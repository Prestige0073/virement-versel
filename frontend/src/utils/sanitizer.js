/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks
 */

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Remove potentially dangerous characters
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remove special chars
    .substring(0, 255); // Max 255 chars
}

/**
 * Sanitize object for safe storage/transmission
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} allowedFields - Whitelist of allowed fields
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj, allowedFields = []) {
  if (!obj || typeof obj !== 'object') return {};

  const sanitized = {};

  for (const field of allowedFields) {
    if (field in obj) {
      const value = obj[field];
      
      if (typeof value === 'string') {
        sanitized[field] = sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[field] = isNaN(value) ? 0 : value;
      } else if (typeof value === 'boolean') {
        sanitized[field] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize email
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  const trimmed = email.trim().toLowerCase();
  return trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? trimmed : '';
}

/**
 * Sanitize phone number (keep only digits)
 * @param {string} phone - Phone to sanitize
 * @returns {string} - Digits only
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  return phone.replace(/\D/g, '').substring(0, 15);
}

/**
 * Sanitize IBAN (letters and numbers only, uppercase)
 * @param {string} iban - IBAN to sanitize
 * @returns {string} - Sanitized IBAN
 */
export function sanitizeIBAN(iban) {
  if (typeof iban !== 'string') return '';
  
  return iban
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 34); // Max IBAN length
}

/**
 * Sanitize BIC (letters and numbers only, uppercase)
 * @param {string} bic - BIC to sanitize
 * @returns {string} - Sanitized BIC
 */
export function sanitizeBIC(bic) {
  if (typeof bic !== 'string') return '';
  
  return bic
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 11); // Standard BIC length
}

/**
 * Safe error message (don't leak system details)
 * @param {Error} error - Error to make safe
 * @returns {string} - User-friendly message
 */
export function getSafeErrorMessage(error) {
  const message = error?.message || 'Une erreur est survenue';
  
  // Map internal errors to user-friendly messages
  const errorMap = {
    'IBAN invalide': 'Veuillez vérifier votre IBAN',
    'Network error': 'Vérifiez votre connexion internet',
    'User not authenticated': 'Vous devez être connecté',
    'File too large': 'Le fichier est trop volumineux (max 5MB)',
    'Invalid file type': 'Type de fichier non accepté',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Don't leak system errors
  return 'Une erreur est survenue. Veuillez réessayer.';
}

/**
 * Validate and sanitize account data
 * @param {Object} accountData - Account data to validate
 * @returns {Object} - Sanitized account data
 */
export function sanitizeAccountData(accountData) {
  return {
    holder_name: sanitizeString(accountData.holder_name || ''),
    holder_email: sanitizeEmail(accountData.holder_email || ''),
    phone: sanitizePhone(accountData.phone || ''),
    address: sanitizeString(accountData.address || ''),
    iban: sanitizeIBAN(accountData.iban || ''),
    bic: sanitizeBIC(accountData.bic || ''),
    bank_name: sanitizeString(accountData.bank_name || ''),
    branch: sanitizeString(accountData.branch || ''),
    account_type: accountData.account_type || 'courant',
    tier: accountData.tier || 'basique',
    currency: accountData.currency || 'XOF',
    language: accountData.language || 'fr',
    current_balance: Math.max(0, parseFloat(accountData.current_balance) || 0),
  };
}
