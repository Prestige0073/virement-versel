import React, { createContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS } from '../config/paymentProviders';
import { isRateLimited } from '../utils/rateLimiter';
import { getSafeErrorMessage } from '../utils/sanitizer';

/**
 * PaymentContext - Gère les paiements mobile money
 * Security: Rate limiting on payment creation, script loading verification
 */
export const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [leekpayLoaded, setLeekpayLoaded] = useState(false);

  /**
   * Charger les scripts externes (LeekPay, etc.) avec error handling
   */
  useEffect(() => {
    // Load LeekPay script safely with timeout
    const loadLeekpayScript = () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://leekpay.fr/js/leekpay.js';
        script.async = true;
        script.timeout = 5000; // 5 second timeout

        script.onload = () => {
          setLeekpayLoaded(true);
          console.log('✅ LeekPay script loaded successfully');
        };

        script.onerror = () => {
          console.warn('⚠️ Failed to load LeekPay script - will try again later');
          // Don't set error state, just log. Payment can still work.
        };

        document.head.appendChild(script);

        return () => {
          // Cleanup on unmount
          if (script.parentNode) {
            try {
              script.parentNode.removeChild(script);
            } catch (err) {
              console.error('Cleanup error:', err);
            }
          }
        };
      } catch (err) {
        console.error('Error loading LeekPay script:', err);
      }
    };

    const cleanup = loadLeekpayScript();

    return cleanup;
  }, []);

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
   * Security: Rate limited (max 10 per minute)
   */
  const createPayment = useCallback(async (paymentData) => {
    try {
      // Rate limiting: max 10 payment creations per minute
      if (isRateLimited('payment-create', 10, 60000)) {
        throw new Error('Trop de tentatives. Veuillez réessayer dans 1 minute.');
      }

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

      // Validate amount bounds
      if (amount < 100 || amount > 10000000) {
        throw new Error('Montant entre 100 et 10 000 000 requis');
      }

      // Sanitize recipient name
      const sanitizedName = (recipient.name || '').replace(/[<>\"'%;()&+]/g, '').substring(0, 100);

      // Créer la transaction en DB
      const { data, error } = await supabase
        .from('transfers')
        .insert([
          {
            bank_account_id: bankAccountId,
            recipient_name: sanitizedName,
            recipient_iban: recipient.iban?.toUpperCase() || '',
            recipient_bic: recipient.bic?.toUpperCase() || '',
            recipient_bank: (recipient.bank || '').substring(0, 100),
            amount: Math.floor(amount), // Ensure integer
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
   * Initialiser le paiement avec LeekPay ⭐ NEW
   */
  const initiateLeekpayPayment = useCallback(async (transfer) => {
    try {
      setError(null);
      setLoading(true);

      // LeekPay utilise un checkout direct via l'API
      const response = await fetch('/api/payments/leekpay/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: transfer.amount,
          currency: transfer.currency,
          description: `Virement vers ${transfer.recipient_name}`,
          transferId: transfer.id,
          recipientName: transfer.recipient_name,
          recipientIban: transfer.recipient_iban,
        }),
      });

      if (!response.ok) throw new Error('Payment initiation failed');

      const data = await response.json();

      // Utiliser LeekPay checkout
      if (window.LeekPay) {
        window.LeekPay.checkout({
          amount: transfer.amount,
          currency: transfer.currency,
          apiKey: process.env.REACT_APP_LEEKPAY_PUBLIC_KEY,
          successUrl: `${window.location.origin}/payment/success/${data.transactionId}`,
          cancelUrl: `${window.location.origin}/payment`,
          metadata: {
            transferId: transfer.id,
          },
        });
      } else {
        // Fallback: rediriger vers URL de paiement
        window.location.href = data.checkoutUrl;
      }

      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur LeekPay';
      setError(message);
      console.error('LeekPay error:', err);
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
    initiateLeekpayPayment, // ⭐ NEW
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
