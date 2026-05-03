/**
 * Config - PaymentProviders.js
 * Configuration des fournisseurs de paiement mobile money
 * 
 * Providers supportés:
 * - FedaPay (Togo, Benin, Cameroun)
 * - Kkiapay (Sénégal, Mali, Burkina Faso)
 * - CinetPay (Côte d'Ivoire, etc.)
 */

export const PAYMENT_PROVIDERS = {
  FEDAPAY: 'fedapay',
  KKIAPAY: 'kkiapay',
  CINETPAY: 'cinetpay',
};

/**
 * Configuration FedaPay
 */
export const FEDAPAY_CONFIG = {
  publicKey: process.env.REACT_APP_FEDAPAY_PUBLIC_KEY,
  apiUrl: 'https://api.fedapay.com',
  webhookSecret: process.env.REACT_APP_FEDAPAY_WEBHOOK_SECRET,
  currencies: ['XOF', 'EUR', 'USD'], // CFA, Euro, Dollar
  minAmount: 100,
  maxAmount: 5000000,
};

/**
 * Configuration Kkiapay
 */
export const KKIAPAY_CONFIG = {
  apiKey: process.env.REACT_APP_KKIAPAY_API_KEY,
  secretKey: process.env.REACT_APP_KKIAPAY_SECRET_KEY,
  apiUrl: 'https://api.kkiapay.com',
  webhookSecret: process.env.REACT_APP_KKIAPAY_WEBHOOK_SECRET,
  currencies: ['XOF', 'EUR'],
  minAmount: 100,
  maxAmount: 5000000,
};

/**
 * Configuration CinetPay
 */
export const CINETPAY_CONFIG = {
  apiKey: process.env.REACT_APP_CINETPAY_API_KEY,
  siteId: process.env.REACT_APP_CINETPAY_SITE_ID,
  apiUrl: 'https://api.cinetpay.com',
  webhookSecret: process.env.REACT_APP_CINETPAY_WEBHOOK_SECRET,
  currencies: ['XOF', 'EUR', 'USD'],
  minAmount: 50,
  maxAmount: 10000000,
};

/**
 * Get active provider config
 */
export const getProviderConfig = (provider = PAYMENT_PROVIDERS.FEDAPAY) => {
  const configs = {
    [PAYMENT_PROVIDERS.FEDAPAY]: FEDAPAY_CONFIG,
    [PAYMENT_PROVIDERS.KKIAPAY]: KKIAPAY_CONFIG,
    [PAYMENT_PROVIDERS.CINETPAY]: CINETPAY_CONFIG,
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
