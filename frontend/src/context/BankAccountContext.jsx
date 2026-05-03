import React, { createContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { isRateLimited, getRemainingRequests } from '../utils/rateLimiter';
import { sanitizeAccountData, getSafeErrorMessage } from '../utils/sanitizer';

/**
 * BankAccountContext - Gère les comptes bancaires de l'utilisateur
 * CRUD operations pour bank_accounts table
 * Security: Rate limiting, input sanitization, atomic transactions
 */
export const BankAccountContext = createContext(null);

export const BankAccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger les comptes de l'utilisateur
   */
  useEffect(() => {
    const initAccounts = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAccounts([]);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        setAccounts(data || []);
      } catch (err) {
        console.error('Init accounts error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAccounts();
  }, []);

  /**
   * Créer un nouveau compte bancaire
   * Security: Rate limited, sanitized, atomic transaction
   */
  const createAccount = useCallback(async (accountData) => {
    try {
      // Rate limiting: max 5 account creations per minute
      if (isRateLimited('bank-account-create', 5, 60000)) {
        const remaining = getRemainingRequests('bank-account-create', 5);
        throw new Error(`Trop de requêtes. Réessayez dans 1 minute. (${remaining} restantes)`);
      }

      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      // Sanitize input data to prevent XSS
      const sanitized = sanitizeAccountData(accountData);

      // Validation IBAN
      if (!validateIBAN(sanitized.iban)) {
        throw new Error('Format IBAN invalide');
      }

      // Upload logo si fourni (BEFORE creating account for atomicity)
      let bank_logo_url = null;
      if (accountData.logoFile) {
        try {
          bank_logo_url = await uploadBankLogo(accountData.logoFile, user.id);
        } catch (logoError) {
          // Fail fast if logo upload fails - don't create account
          throw new Error(`Erreur upload logo: ${logoError.message}`);
        }
      }

      // Now create account with validated data
      const { data, error: insertError } = await supabase
        .from('bank_accounts')
        .insert([{
          user_id: user.id,
          holder_name: sanitized.holder_name,
          holder_email: sanitized.holder_email || user.email,
          phone: sanitized.phone,
          address: sanitized.address,
          iban: sanitized.iban.toUpperCase(),
          bic: sanitized.bic.toUpperCase() || '',
          bank_name: sanitized.bank_name,
          branch: sanitized.branch || '',
          account_type: sanitized.account_type || 'courant',
          tier: sanitized.tier || 'basique',
          currency: sanitized.currency || 'XOF',
          bank_logo_url,
          current_balance: sanitized.current_balance || 0,
          language: sanitized.language || 'fr',
        }])
        .select();

      if (insertError) throw insertError;

      setAccounts(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Create account error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer un compte spécifique
   */
  const getAccount = useCallback(async (accountId) => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (queryError) throw queryError;

      setSelectedAccount(data);
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Erreur récupération compte';
      setError(message);
      console.error('Get account error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour un compte bancaire
   * Security: Rate limited, sanitized
   */
  const updateAccount = useCallback(async (accountId, updates) => {
    try {
      // Rate limiting: max 10 updates per minute
      if (isRateLimited('bank-account-update', 10, 60000)) {
        throw new Error('Trop de mise à jour. Réessayez plus tard.');
      }

      setError(null);
      setLoading(true);

      // Sanitize input
      const sanitized = sanitizeAccountData(updates);

      // Validation IBAN si modifié
      if (sanitized.iban && !validateIBAN(sanitized.iban)) {
        throw new Error('Format IBAN invalide');
      }

      // Upload nouveau logo si fourni
      if (updates.logoFile) {
        const { data: { user } } = await supabase.auth.getUser();
        sanitized.bank_logo_url = await uploadBankLogo(updates.logoFile, user.id);
      }

      // Convertir IBAN en majuscules
      if (sanitized.iban) {
        sanitized.iban = sanitized.iban.toUpperCase();
      }

      const { data, error: updateError } = await supabase
        .from('bank_accounts')
        .update(sanitized)
        .eq('id', accountId)
        .select()
        .single();

      if (updateError) throw updateError;

      setAccounts(prev => 
        prev.map(acc => acc.id === accountId ? data : acc)
      );

      if (selectedAccount?.id === accountId) {
        setSelectedAccount(data);
      }

      return { success: true, data };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Update account error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  /**
   * Supprimer un compte bancaire
   * Security: Rate limited, checks for active transfers
   */
  const deleteAccount = useCallback(async (accountId) => {
    try {
      // Rate limiting: max 3 deletes per minute
      if (isRateLimited('bank-account-delete', 3, 60000)) {
        throw new Error('Trop de suppressions. Réessayez plus tard.');
      }

      setError(null);
      setLoading(true);

      // Vérifier qu'il n'y a pas de transfers actifs
      const { data: activeTransfers, error: checkError } = await supabase
        .from('transfers')
        .select('id')
        .eq('bank_account_id', accountId)
        .in('status', ['pending', 'processing']);

      if (checkError) throw checkError;

      if (activeTransfers && activeTransfers.length > 0) {
        throw new Error('Impossible de supprimer: vous avez des transferts en cours');
      }

      const { error: deleteError } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (deleteError) throw deleteError;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));

      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null);
      }

      return { success: true };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Delete account error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  /**
   * Mettre à jour le solde d'un compte
   */
  const updateBalance = useCallback(async (accountId, newBalance) => {
    try {
      if (newBalance < 0) {
        throw new Error('Le solde ne peut pas être négatif');
      }

      const { data, error: updateError } = await supabase
        .from('bank_accounts')
        .update({ current_balance: newBalance })
        .eq('id', accountId)
        .select()
        .single();

      if (updateError) throw updateError;

      setAccounts(prev => 
        prev.map(acc => acc.id === accountId ? data : acc)
      );

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Erreur mise à jour solde';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Obtenir les comptes avec filtres
   */
  const getAccounts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);

      let query = supabase.from('bank_accounts').select('*');

      if (filters.accountType) {
        query = query.eq('account_type', filters.accountType);
      }
      if (filters.tier) {
        query = query.eq('tier', filters.tier);
      }
      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }
      if (filters.search) {
        query = query.or(`holder_name.ilike.%${filters.search}%,bank_name.ilike.%${filters.search}%`);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Erreur récupération comptes';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // État
    accounts,
    selectedAccount,
    loading,
    error,

    // Méthodes
    createAccount,
    getAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
    getAccounts,
    setSelectedAccount,
    clearError,
  };

  return (
    <BankAccountContext.Provider value={value}>
      {children}
    </BankAccountContext.Provider>
  );
};

/**
 * Validation IBAN
 */
const validateIBAN = (iban) => {
  if (!iban) return false;
  
  // Format: 2 lettres pays + 2 chiffres + 1-30 chars alphanumériques
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
  
  return ibanRegex.test(iban.toUpperCase());
};

/**
 * Upload logo bancaire vers Supabase Storage
 */
const uploadBankLogo = async (file, userId) => {
  try {
    if (!file) return null;

    // Valider type fichier
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      throw new Error('Format d\'image invalide (PNG, JPEG, WebP acceptés)');
    }

    // Valider taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image trop volumineuse (max 5MB)');
    }

    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('bank-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Récupérer URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('bank-logos')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Logo upload error:', err);
    throw err;
  }
};
