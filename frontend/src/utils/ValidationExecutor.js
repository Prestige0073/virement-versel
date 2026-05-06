/**
 * ValidationExecutor
 * 
 * Executes validation rules against transfer data.
 * 
 * Supports:
 * - Required field validation
 * - Type validation (email, iban, phone, etc.)
 * - Length/range constraints
 * - Pattern matching
 * - Custom validators
 */

export class ValidationExecutor {
  /**
   * Validate transfer data against rules
   * 
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @returns {Array} Array of validation errors (empty if valid)
   */
  static validate(data, rules) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Données invalides');
      return errors;
    }

    if (!rules || typeof rules !== 'object') {
      return []; // No rules = no errors
    }

    // Validate each field
    for (const [field, rule] of Object.entries(rules)) {
      const fieldErrors = this._validateField(field, data[field], rule, data);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  /**
   * Validate a single field against its rules
   * 
   * @private
   */
  static _validateField(fieldName, fieldValue, rule, allData) {
    const errors = [];

    if (typeof rule === 'boolean') {
      // Simple required check
      rule = { required: rule };
    }

    if (typeof rule !== 'object') {
      return [];
    }

    // Check if required
    if (rule.required && !fieldValue) {
      errors.push(`${fieldName} est requis`);
      return errors; // Skip other validations
    }

    // If not required and empty, skip other validations
    if (!fieldValue && !rule.required) {
      return [];
    }

    // Type validation
    if (rule.type) {
      const typeError = this._validateType(fieldName, fieldValue, rule.type);
      if (typeError) {
        errors.push(typeError);
        return errors; // Skip further validations for this field
      }
    }

    // Length validation
    if (rule.minLength && String(fieldValue).length < rule.minLength) {
      errors.push(`${fieldName} doit avoir au moins ${rule.minLength} caractères`);
    }

    if (rule.maxLength && String(fieldValue).length > rule.maxLength) {
      errors.push(`${fieldName} ne doit pas dépasser ${rule.maxLength} caractères`);
    }

    // Range validation (for numbers)
    if (rule.min && parseFloat(fieldValue) < parseFloat(rule.min)) {
      errors.push(`${fieldName} doit être au moins ${rule.min}`);
    }

    if (rule.max && parseFloat(fieldValue) > parseFloat(rule.max)) {
      errors.push(`${fieldName} ne doit pas dépasser ${rule.max}`);
    }

    // Pattern validation
    if (rule.pattern) {
      try {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(String(fieldValue))) {
          errors.push(`${fieldName} n'a pas le bon format`);
        }
      } catch (err) {
        errors.push(`Erreur dans la validation de ${fieldName}`);
      }
    }

    // Enum validation (allowed values)
    if (Array.isArray(rule.allowedValues)) {
      if (!rule.allowedValues.includes(fieldValue)) {
        errors.push(`${fieldName} doit être l'une des valeurs: ${rule.allowedValues.join(', ')}`);
      }
    }

    // Custom validator function
    if (typeof rule.validator === 'function') {
      const customError = rule.validator(fieldValue, allData);
      if (customError) {
        errors.push(customError);
      }
    }

    // Conditional validation based on other fields
    if (rule.requireIf) {
      const shouldRequire = this._evaluateCondition(rule.requireIf, allData);
      if (shouldRequire && !fieldValue) {
        errors.push(`${fieldName} est requis dans ce contexte`);
      }
    }

    return errors;
  }

  /**
   * Validate field type
   * 
   * @private
   */
  static _validateType(fieldName, value, type) {
    switch (type) {
      case 'email':
        return this._validateEmail(fieldName, value);

      case 'iban':
        return this._validateIBAN(fieldName, value);

      case 'phone':
        return this._validatePhone(fieldName, value);

      case 'number':
      case 'integer':
        return this._validateNumber(fieldName, value, type);

      case 'string':
        if (typeof value !== 'string') {
          return `${fieldName} doit être du texte`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${fieldName} doit être vrai ou faux`;
        }
        break;

      case 'date':
      case 'timestamp':
        return this._validateDate(fieldName, value);

      case 'currency':
        return this._validateCurrency(fieldName, value);

      case 'array':
        if (!Array.isArray(value)) {
          return `${fieldName} doit être un tableau`;
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `${fieldName} doit être un objet`;
        }
        break;

      default:
        return null; // Unknown type, skip
    }

    return null;
  }

  /**
   * Validate email format
   * 
   * @private
   */
  static _validateEmail(fieldName, value) {
    if (typeof value !== 'string') {
      return `${fieldName} doit être du texte`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${fieldName} n'est pas une adresse email valide`;
    }

    return null;
  }

  /**
   * Validate IBAN format
   * 
   * @private
   */
  static _validateIBAN(fieldName, value) {
    if (typeof value !== 'string') {
      return `${fieldName} doit être du texte`;
    }

    // IBAN: starts with 2 letters, 2 digits, then alphanumeric
    // Length: 15-34 characters
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;

    if (!ibanRegex.test(value.replace(/\s/g, ''))) {
      return `${fieldName} n'est pas un IBAN valide`;
    }

    return null;
  }

  /**
   * Validate phone format
   * 
   * @private
   */
  static _validatePhone(fieldName, value) {
    if (typeof value !== 'string') {
      return `${fieldName} doit être du texte`;
    }

    // Phone: 10-15 digits, may include +, -, spaces, ()
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;

    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return `${fieldName} n'est pas un numéro de téléphone valide`;
    }

    return null;
  }

  /**
   * Validate number format
   * 
   * @private
   */
  static _validateNumber(fieldName, value, type) {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return `${fieldName} doit être un nombre`;
    }

    if (type === 'integer' && !Number.isInteger(num)) {
      return `${fieldName} doit être un nombre entier`;
    }

    return null;
  }

  /**
   * Validate date/timestamp format
   * 
   * @private
   */
  static _validateDate(fieldName, value) {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return `${fieldName} n'est pas une date valide`;
    }

    return null;
  }

  /**
   * Validate currency code
   * 
   * @private
   */
  static _validateCurrency(fieldName, value) {
    if (typeof value !== 'string') {
      return `${fieldName} doit être du texte`;
    }

    const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY'];

    if (!validCurrencies.includes(value.toUpperCase())) {
      return `${fieldName} n'est pas une devise valide`;
    }

    return null;
  }

  /**
   * Evaluate conditional requirement
   * 
   * @private
   */
  static _evaluateCondition(condition, data) {
    if (!condition || typeof condition !== 'object') {
      return false;
    }

    const { field, operator, value } = condition;

    if (!field || !data.hasOwnProperty(field)) {
      return false;
    }

    const fieldValue = data[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(value);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(value);
      case 'contains':
        return String(fieldValue).includes(String(value));
      default:
        return false;
    }
  }

  /**
   * Validate complete transfer attempt data
   * 
   * Checks all required fields across all steps
   * 
   * @param {Object} transferData - Transfer data to validate
   * @param {Array} transferSteps - All configured transfer steps
   * @returns {Array} Validation errors
   */
  static validateTransfer(transferData, transferSteps) {
    const errors = [];

    if (!transferData || typeof transferData !== 'object') {
      errors.push('Les données de virement sont invalides');
      return errors;
    }

    if (!Array.isArray(transferSteps) || transferSteps.length === 0) {
      errors.push('Aucune étape de virement configurée');
      return errors;
    }

    // Collect all required fields from all steps
    const requiredFields = new Set();

    transferSteps.forEach(step => {
      if (Array.isArray(step.required_fields)) {
        step.required_fields.forEach(f => requiredFields.add(f));
      }
    });

    // Validate all required fields are present
    for (const field of requiredFields) {
      if (!transferData[field]) {
        const fieldLabel = field
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        errors.push(`${fieldLabel} manquant`);
      }
    }

    // Validate amount
    if (transferData.amount) {
      const amount = parseFloat(transferData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Le montant doit être un nombre positif');
      }
      if (amount > 999999999) {
        errors.push('Le montant dépasse le maximum autorisé');
      }
    }

    // Validate email if provided
    if (transferData.holder_email) {
      const emailError = this._validateEmail('Email titulaire', transferData.holder_email);
      if (emailError) errors.push(emailError);
    }

    // Validate IBAN if provided
    if (transferData.holder_iban) {
      const ibanError = this._validateIBAN('IBAN titulaire', transferData.holder_iban);
      if (ibanError) errors.push(ibanError);
    }

    if (transferData.recipient_iban) {
      const ibanError = this._validateIBAN('IBAN destinataire', transferData.recipient_iban);
      if (ibanError) errors.push(ibanError);
    }

    return errors;
  }

  /**
   * Build validation results object with status
   * 
   * @param {Array} errors - Validation errors
   * @returns {Object} Validation result {valid, errors, error_count}
   */
  static buildResult(errors) {
    return {
      valid: errors.length === 0,
      errors,
      error_count: errors.length,
      timestamp: new Date().toISOString(),
    };
  }
}
