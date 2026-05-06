/**
 * Backend API Routes - Payment Processing (LeekPay Only)
 * 
 * À implémenter côté serveur (Edge Functions Supabase ou backend Node.js)
 * Ces routes gèrent:
 * - Initialisation des paiements
 * - Webhooks de confirmation
 * - Audit logging
 */

// ============================================
// LeekPay Payment Routes
// ============================================

/**
 * POST /api/payments/leekpay/init
 * Initialiser un paiement via LeekPay
 * 
 * Request:
 * {
 *   amount: 10000,
 *   currency: "XOF",
 *   description: "Virement vers Oumar Ba",
 *   transferId: "uuid-transfer-id",
 *   recipientName: "Oumar Ba",
 *   recipientIban: "CI05A..."
 * }
 * 
 * Response:
 * {
 *   checkoutUrl: "https://checkout.leekpay.fr/...",
 *   transactionId: "leekpay-transaction-id"
 * }
 */
export const initiateLeekpayPayment = async (req, res) => {
  try {
    const { amount, currency, description, transferId, recipientName, recipientIban } = req.body;

    // Valider le montant
    if (amount < 100 || amount > 10000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Créer transaction LeekPay
    const leekpayResponse = await fetch('https://api.leekpay.fr/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEEKPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Amount in cents
        currency,
        description,
        customer: {
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          email: req.user.email,
        },
        beneficiary: {
          name: recipientName,
          iban: recipientIban,
        },
        metadata: {
          transferId,
          userId: req.user.id,
          destination: 'bank_transfer',
        },
        returnUrl: `${process.env.FRONTEND_URL}/payment/success/{id}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment`,
      }),
    });

    const transaction = await leekpayResponse.json();

    if (!leekpayResponse.ok) {
      throw new Error(transaction.message || 'LeekPay error');
    }

    // Sauvegarder l'ID LeekPay en DB
    await updateTransferWithProvider(transferId, {
      provider_transaction_id: transaction.id,
      status: 'initiated',
    });

    return res.json({
      checkoutUrl: transaction.checkout_url || transaction.url,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('LeekPay init error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/webhooks/leekpay
 * Notification de LeekPay - Webhook
 */
export const leekpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-leekpay-signature'];
    const body = req.rawBody; // Raw body string

    // Vérifier la signature
    const isValid = verifyLeekpaySignature(body, signature, process.env.LEEKPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const { transaction } = event.data;

    if (event.type === 'checkout.success' || event.type === 'transaction.completed') {
      await updateTransferStatus(transaction.metadata.transferId, 'success', {
        federatedPaymentId: transaction.id,
        provider: 'leekpay',
      });
    } else if (event.type === 'checkout.failed' || event.type === 'transaction.failed') {
      await updateTransferStatus(transaction.metadata.transferId, 'failed', {
        federatedPaymentId: transaction.id,
        provider: 'leekpay',
        reason: transaction.failure_reason || 'Payment declined',
      });
    } else if (event.type === 'checkout.cancelled') {
      await updateTransferStatus(transaction.metadata.transferId, 'cancelled', {
        federatedPaymentId: transaction.id,
        provider: 'leekpay',
      });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('LeekPay webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

    const event = req.body;

// ============================================
// Helper Functions
// ============================================

/**
 * Mettre à jour le transfert avec ID provider
 */
const updateTransferWithProvider = async (transferId, data) => {
  const { supabase } = require('../config/supabase/server');
  
  return await supabase
    .from('transfers')
    .update(data)
    .eq('id', transferId);
};

/**
 * Mettre à jour le statut du transfert
 */
const updateTransferStatus = async (transferId, status, details = {}) => {
  const { supabase } = require('../config/supabase/server');
  
  // Mettre à jour le transfert
  await supabase
    .from('transfers')
    .update({
      status,
      metadata: details,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transferId);

  // Enregistrer dans audit log
  await supabase
    .from('audit_logs')
    .insert([{
      action: `payment_${status}`,
      entity_type: 'transfer',
      entity_id: transferId,
      changes: details,
    }]);
};

/**
 * Vérifier la signature LeekPay
 */
const verifyLeekpaySignature = (body, signature, secret) => {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
};
