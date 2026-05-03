/**
 * Backend API Routes - Payment Processing
 * 
 * À implémenter côté serveur (Edge Functions Supabase ou backend Node.js)
 * Ces routes gèrent:
 * - Initialisation des paiements
 * - Webhooks de confirmation
 * - Audit logging
 */

// ============================================
// FedaPay Payment Routes
// ============================================

/**
 * POST /api/payments/fedapay/init
 * Initialiser un paiement via FedaPay
 * 
 * Request:
 * {
 *   amount: 10000,
 *   currency: "XOF",
 *   description: "Virement vers Oumar Ba",
 *   transferId: "uuid-transfer-id"
 * }
 * 
 * Response:
 * {
 *   redirectUrl: "https://pay.fedapay.com/...",
 *   transactionId: "fedapay-transaction-id"
 * }
 */
export const initiateFedapayPayment = async (req, res) => {
  try {
    const { amount, currency, description, transferId } = req.body;

    // Valider le montant
    if (amount < 100 || amount > 5000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Créer transaction FedaPay
    const fedapayResponse = await fetch('https://api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
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
        metadata: {
          transferId,
          userId: req.user.id,
        },
      }),
    });

    const transaction = await fedapayResponse.json();

    if (!fedapayResponse.ok) {
      throw new Error(transaction.message || 'FedaPay error');
    }

    // Sauvegarder l'ID FedaPay en DB
    await updateTransferWithProvider(transferId, {
      provider_transaction_id: transaction.id,
      status: 'initiated',
    });

    return res.json({
      redirectUrl: transaction.authorization_url || transaction.url,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('FedaPay init error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/webhooks/fedapay
 * Notification de FedaPay - Webhook
 */
export const fedapayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-fedapay-signature'];
    const body = req.rawBody; // Raw body string

    // Vérifier la signature
    const isValid = verifyFedapaySignature(body, signature, process.env.FEDAPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const { transaction } = event.data;

    if (event.type === 'transaction.approved') {
      await updateTransferStatus(transaction.metadata.transferId, 'success', {
        federatedPaymentId: transaction.id,
        provider: 'fedapay',
      });
    } else if (event.type === 'transaction.declined') {
      await updateTransferStatus(transaction.metadata.transferId, 'failed', {
        federatedPaymentId: transaction.id,
        provider: 'fedapay',
        reason: transaction.reason,
      });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('FedaPay webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================
// Kkiapay Payment Routes
// ============================================

/**
 * POST /api/payments/kkiapay/init
 * Initialiser un paiement via Kkiapay
 */
export const initiateKkiapayPayment = async (req, res) => {
  try {
    const { amount, currency, phone, description, transferId } = req.body;

    // Valider
    if (amount < 100 || amount > 5000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Créer transaction Kkiapay
    const kkiapayResponse = await fetch('https://api.kkiapay.com/api/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KKIAPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        tel: phone,
        narration: description,
        metadata: {
          transferId,
          userId: req.user.id,
        },
      }),
    });

    const transaction = await kkiapayResponse.json();

    if (!kkiapayResponse.ok) {
      throw new Error(transaction.message || 'Kkiapay error');
    }

    // Sauvegarder l'ID Kkiapay en DB
    await updateTransferWithProvider(transferId, {
      provider_transaction_id: transaction.id,
      status: 'processing',
    });

    return res.json({
      transactionId: transaction.id,
      token: transaction.token,
    });
  } catch (error) {
    console.error('Kkiapay init error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/webhooks/kkiapay
 * Notification de Kkiapay - Webhook
 */
export const kkiapayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-kkiapay-signature'];

    // Vérifier la signature
    const isValid = verifyKkiapaySignature(req.body, signature, process.env.KKIAPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { status, transactionId, metadata } = req.body;

    if (status === 'SUCCESS') {
      await updateTransferStatus(metadata.transferId, 'success', {
        federatedPaymentId: transactionId,
        provider: 'kkiapay',
      });
    } else if (status === 'FAILED') {
      await updateTransferStatus(metadata.transferId, 'failed', {
        federatedPaymentId: transactionId,
        provider: 'kkiapay',
        reason: req.body.reason,
      });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Kkiapay webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};

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
 * Vérifier la signature FedaPay
 */
const verifyFedapaySignature = (body, signature, secret) => {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
};

/**
 * Vérifier la signature Kkiapay
 */
const verifyKkiapaySignature = (body, signature, secret) => {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return hash === signature;
};
