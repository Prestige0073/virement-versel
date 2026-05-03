/**
 * Environment variables validation and configuration
 */

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  VITE_APP_NAME: 'Simulateur Virement Bancaire',
  VITE_APP_VERSION: '0.0.1',
  VITE_APP_ENV: 'development',
};

/**
 * Payment provider configuration environment variables
 */
const PAYMENT_PROVIDER_VARS = {
  VITE_FEDAPAY_PUBLIC_KEY: 'FedaPay',
  VITE_KKIAPAY_PUBLIC_KEY: 'Kkiapay',
  VITE_LEEKPAY_PUBLIC_KEY: 'LeekPay',
  VITE_CINETPAY_APP_ID: 'CinetPay',
};

/**
 * Validate all required environment variables are set
 * @throws {Error} If required variables are missing
 * @returns {Object} Validated environment configuration
 */
export function validateEnvironment() {
  const missing = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuration Error: Variables manquantes: ${missing.join(', ')}\n` +
      'Veuillez créer un fichier .env.local avec les variables d\'environnement requises.'
    );
  }

  return true;
}

/**
 * Get environment variable with fallback
 * @param {string} varName - Variable name
 * @param {*} defaultValue - Default value if not found
 * @returns {*} - Value from env or default
 */
export function getEnvVar(varName, defaultValue = null) {
  const value = import.meta.env[varName];
  
  if (value === undefined) {
    if (defaultValue === null) {
      console.warn(`Environment variable not set: ${varName}`);
    }
    return defaultValue;
  }

  return value;
}

/**
 * Get configuration object with validated environment variables
 * @returns {Object} - Application configuration
 */
export function getConfig() {
  validateEnvironment();

  return {
    // Core
    supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),

    // App
    appName: getEnvVar('VITE_APP_NAME', OPTIONAL_ENV_VARS.VITE_APP_NAME),
    appVersion: getEnvVar('VITE_APP_VERSION', OPTIONAL_ENV_VARS.VITE_APP_VERSION),
    appEnv: getEnvVar('VITE_APP_ENV', OPTIONAL_ENV_VARS.VITE_APP_ENV),
    isDevelopment: getEnvVar('VITE_APP_ENV', 'development') === 'development',
    isProduction: getEnvVar('VITE_APP_ENV', 'development') === 'production',

    // Payment providers
    fedapayPublicKey: getEnvVar('VITE_FEDAPAY_PUBLIC_KEY', null),
    kkiapayPublicKey: getEnvVar('VITE_KKIAPAY_PUBLIC_KEY', null),
    leekpayPublicKey: getEnvVar('VITE_LEEKPAY_PUBLIC_KEY', null),
    cinetpayAppId: getEnvVar('VITE_CINETPAY_APP_ID', null),

    // API
    apiBaseUrl: getEnvVar('VITE_API_BASE_URL', ''),
  };
}

/**
 * Validate payment provider configuration
 * @returns {Object} - Available payment providers
 */
export function getAvailablePaymentProviders() {
  const available = {};

  if (getEnvVar('VITE_FEDAPAY_PUBLIC_KEY')) {
    available.fedapay = true;
  }
  if (getEnvVar('VITE_KKIAPAY_PUBLIC_KEY')) {
    available.kkiapay = true;
  }
  if (getEnvVar('VITE_LEEKPAY_PUBLIC_KEY')) {
    available.leekpay = true;
  }
  if (getEnvVar('VITE_CINETPAY_APP_ID')) {
    available.cinetpay = true;
  }

  return available;
}

/**
 * Log environment configuration (safe - no secrets)
 */
export function logEnvironmentConfig() {
  const config = getConfig();
  
  const safe = {
    appName: config.appName,
    appVersion: config.appVersion,
    appEnv: config.appEnv,
    supabaseUrl: config.supabaseUrl, // Safe to log (public)
    providersFedapay: !!config.fedapayPublicKey,
    providersKkiapay: !!config.kkiapayPublicKey,
    providersLeekpay: !!config.leekpayPublicKey,
    providersCinetpay: !!config.cinetpayAppId,
  };

  if (config.isDevelopment) {
    console.log('📋 Environment Configuration:', safe);
  }

  return safe;
}
