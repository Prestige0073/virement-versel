import React, { createContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS } from '../config/paymentProviders';

/**
 * PaymentContext - Gère les paiements mobile money
 */
export const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);

  /**
   * Initialiser les paiements de l'utilisateur
   */
  useEffect(() => {
    const initPayments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('transfers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error('Init payments error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initPayments();
  }, []);

  /**
   * Créer une transaction de paiement
   */
  const createPayment = useCallback(async (paymentData) => {
    try {
      setError(null);
      setLoading(true);

      const {
        bankAccountId,
        amount,
        currency,
        recipient,
        description,
        provider,
      } = paymentData;

      // Créer la transaction en DB
      const { data, error } = await supabase
        .from('transfers')
        .insert([
          {
            bank_account_id: bankAccountId,
            recipient_name: recipient.name,
            recipient_iban: recipient.iban,
            recipient_bic: recipient.bic,
            recipient_bank: recipient.bank,
            amount,
            currency,
            status: PAYMENT_STATUS.INITIATED,
            current_step: 1,
            provider,
          },
        ])
        .select();

      if (error) throw error;

      const transfer = data[0];
      setCurrentPayment(transfer);
      setPayments(prev => [transfer, ...prev]);

      return { success: true, transfer };
    } catch (err) {
      const message = err.message || 'Erreur lors de la création du paiement';
      setError(message);
      console.error('Create payment error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialiser le paiement avec FedaPay
   */
  const initiateFedapayPayment = useCallback(async (transfer) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch('/api/payments/fedapay/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: transfer.amount,
          currency: transfer.currency,
          description: `Virement vers ${transfer.recipient_name}`,
          transferId: transfer.id,
        }),
      });

      if (!response.ok) throw new Error('Payment initiation failed');

      const data = await response.json();

      // Rediriger vers FedaPay
      window.location.href = data.redirectUrl;

      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur FedaPay';
      setError(message);
      console.error('FedaPay error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialiser le paiement avec Kkiapay
   */
  const initiateKkiapayPayment = useCallback(async (transfer) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch('/api/payments/kkiapay/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: transfer.amount,
          currency: transfer.currency,
          phone: transfer.phone,
          description: `Virement vers ${transfer.recipient_name}`,
          transferId: transfer.id,
        }),
      });

      if (!response.ok) throw new Error('Payment initiation failed');

      const data = await response.json();

      // Ouvrir widget de paiement Kkiapay
      if (window.Kkiapay) {
        window.Kkiapay.openPaymentWidget(data.transactionId);
      } else {
        throw new Error('Kkiapay widget not loaded');
      }

      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur Kkiapay';
      setError(message);
      console.error('Kkiapay error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour le statut du paiement
   */
  const updatePaymentStatus = useCallback(async (transferId, status, details = {}) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('transfers')
        .update({
          status,
          updated_at: new Date().toISOString(),
          metadata: details,
        })
        .eq('id', transferId);

      if (error) throw error;

      // Mettre à jour l'état local
      setPayments(prev =>
        prev.map(p =>
          p.id === transferId ? { ...p, status, metadata: details } : p
        )
      );
      setCurrentPayment(prev =>
        prev?.id === transferId
          ? { ...prev, status, metadata: details }
          : prev
      );

      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur mise à jour';
      setError(message);
      console.error('Update payment error:', err);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Annuler un paiement
   */
  const cancelPayment = useCallback(async (transferId) => {
    return updatePaymentStatus(transferId, PAYMENT_STATUS.CANCELLED);
  }, [updatePaymentStatus]);

  /**
   * Récupérer historique paiements
   */
  const getPaymentHistory = useCallback(async (filters = {}) => {
    try {
      setError(null);
      setLoading(true);

      let query = supabase.from('transfers').select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.bankAccountId) {
        query = query.eq('bank_account_id', filters.bankAccountId);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Erreur récupération';
      setError(message);
      console.error('Get history error:', err);
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
    payments,
    currentPayment,
    loading,
    error,

    // Méthodes
    createPayment,
    initiateFedapayPayment,
    initiateKkiapayPayment,
    updatePaymentStatus,
    cancelPayment,
    getPaymentHistory,
    clearError,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentContext;
