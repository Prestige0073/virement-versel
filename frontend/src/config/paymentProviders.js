/**
 * Config - PaymentProviders.js
 * Configuration des fournisseurs de paiement mobile money
 * 
 * Provider utilisé:
 * - LeekPay (Multi-pays Afrique)
 */

export const PAYMENT_PROVIDERS = {
  LEEKPAY: 'leekpay',
};

/**
 * Configuration LeekPay
 * Documentation: https://leekpay.fr
 */
export const LEEKPAY_CONFIG = {
  publicKey: process.env.REACT_APP_LEEKPAY_PUBLIC_KEY,
  secretKey: process.env.REACT_APP_LEEKPAY_SECRET_KEY,
  apiUrl: 'https://leekpay.fr/js/leekpay.js',
  webhookSecret: process.env.REACT_APP_LEEKPAY_WEBHOOK_SECRET,
  currencies: ['XOF', 'EUR', 'USD'],
  minAmount: 100,
  maxAmount: 10000000,
};

/**
 * Get active provider config
 */
export const getProviderConfig = (provider = PAYMENT_PROVIDERS.LEEKPAY) => {
  const configs = {
    [PAYMENT_PROVIDERS.LEEKPAY]: LEEKPAY_CONFIG,
  };

  return configs[provider];
};

/**
 * Payment transaction status
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  INITIATED: 'initiated',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

/**
 * Mobile operators
 */
export const MOBILE_OPERATORS = {
  ORANGE: 'orange',
  MTN: 'mtn',
  MOOV: 'moov',
  CELTIIS: 'celtiis',
  WAVE: 'wave', // Senegal
  AIRTEL: 'airtel',
};

/**
 * Payment channels
 */
export const PAYMENT_CHANNELS = {
  MOBILE_MONEY: 'mobile_money',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  USSD: 'ussd',
};

/**
 * Currency codes
 */
export const CURRENCY_CODES = {
  XOF: 'XOF', // CFA Franc
  EUR: 'EUR', // Euro
  USD: 'USD', // US Dollar
};

export default {
  PAYMENT_PROVIDERS,
  FEDAPAY_CONFIG,
  KKIAPAY_CONFIG,
  CINETPAY_CONFIG,
  getProviderConfig,
  PAYMENT_STATUS,
  MOBILE_OPERATORS,
  PAYMENT_CHANNELS,
  CURRENCY_CODES,
};
