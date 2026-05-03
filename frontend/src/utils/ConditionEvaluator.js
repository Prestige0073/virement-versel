/**
 * ConditionEvaluator
 * 
 * Evaluates conditional logic for step branching and skipping.
 * 
 * Supports:
 * - Simple comparisons (eq, gt, lt, gte, lte, contains)
 * - Logical operators (AND, OR, NOT)
 * - Context-based conditions (transfer data, validation results)
 * 
 * Condition format:
 * {
 *   operator: 'AND', // AND, OR, NOT
 *   conditions: [
 *     { field: 'amount', operator: 'gt', value: 1000 },
 *     { field: 'currency', operator: 'eq', value: 'EUR' }
 *   ]
 * }
 */

export class ConditionEvaluator {
  /**
   * Evaluate a condition against transfer data
   * 
   * @param {Object} conditions - Condition object to evaluate
   * @param {Object} transferData - Transfer data context
   * @param {Object} validationResults - Previous validation results
   * @returns {boolean} True if condition is met (step should be skipped)
   */
  static evaluate(conditions, transferData, validationResults = {}) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return false; // No conditions = don't skip
    }

    if (!conditions.operator) {
      return false; // Invalid condition format
    }

    return this._evaluateOperator(conditions, transferData, validationResults);
  }

  /**
   * Evaluate logical operator
   * 
   * @private
   */
  static _evaluateOperator(condition, transferData, validationResults) {
    const { operator, conditions: subConditions } = condition;

    if (!Array.isArray(subConditions) || subConditions.length === 0) {
      return false;
    }

    switch (operator.toUpperCase()) {
      case 'AND':
        return subConditions.every(c => this._evaluateCondition(c, transferData, validationResults));

      case 'OR':
        return subConditions.some(c => this._evaluateCondition(c, transferData, validationResults));

      case 'NOT':
        return !this._evaluateCondition(subConditions[0], transferData, validationResults);

      default:
        return false;
    }
  }

  /**
   * Evaluate a single condition
   * 
   * @private
   */
  static _evaluateCondition(condition, transferData, validationResults) {
    const { field, operator, value, source } = condition;

    if (!field || !operator) {
      return false;
    }

    // Get field value from appropriate source
    let fieldValue;

    switch (source) {
      case 'validation':
        fieldValue = this._getNestedValue(validationResults, field);
        break;

      case 'transfer':
      default:
        fieldValue = this._getNestedValue(transferData, field);
        break;
    }

    // Handle null/undefined
    if (fieldValue === null || fieldValue === undefined) {
      return operator === 'exists' ? false : operator === 'not_exists' ? true : false;
    }

    return this._compareValues(fieldValue, operator, value);
  }

  /**
   * Get nested object value using dot notation
   * 
   * @private
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notated path (e.g., 'user.address.country')
   * @returns {*} Value at path
   */
  static _getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Compare two values using operator
   * 
   * @private
   */
  static _compareValues(fieldValue, operator, value) {
    switch (operator) {
      // Equality
      case 'eq':
      case 'equals':
        return fieldValue === value;

      case 'ne':
      case 'not_eq':
        return fieldValue !== value;

      // Numeric comparisons
      case 'gt':
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(value);

      case 'gte':
      case 'greater_than_or_equal':
        return parseFloat(fieldValue) >= parseFloat(value);

      case 'lt':
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(value);

      case 'lte':
      case 'less_than_or_equal':
        return parseFloat(fieldValue) <= parseFloat(value);

      // String operations
      case 'contains':
        return String(fieldValue).includes(String(value));

      case 'not_contains':
        return !String(fieldValue).includes(String(value));

      case 'starts_with':
        return String(fieldValue).startsWith(String(value));

      case 'ends_with':
        return String(fieldValue).endsWith(String(value));

      // Pattern matching (basic regex)
      case 'matches':
        try {
          const regex = new RegExp(value);
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }

      // Existence checks
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;

      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;

      // Array checks
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);

      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);

      // Boolean
      case 'is_true':
        return Boolean(fieldValue) === true;

      case 'is_false':
        return Boolean(fieldValue) === false;

      default:
        return false;
    }
  }

  /**
   * Build human-readable description of conditions
   * 
   * Useful for UI display and logging
   * 
   * @param {Object} conditions - Condition object
   * @returns {string} Human-readable description
   */
  static describe(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return 'Aucune condition';
    }

    return this._describeOperator(conditions);
  }

  /**
   * Build description for operator
   * 
   * @private
   */
  static _describeOperator(condition) {
    const { operator, conditions: subConditions } = condition;

    if (!Array.isArray(subConditions) || subConditions.length === 0) {
      return 'Condition invalide';
    }

    const descriptions = subConditions.map(c => this._describeCondition(c));

    switch (operator.toUpperCase()) {
      case 'AND':
        return `${descriptions.join(' ET ')}`;

      case 'OR':
        return `(${descriptions.join(' OU ')})`;

      case 'NOT':
        return `NON (${descriptions[0]})`;

      default:
        return 'Condition invalide';
    }
  }

  /**
   * Build description for single condition
   * 
   * @private
   */
  static _describeCondition(condition) {
    const { field, operator, value } = condition;

    const fieldLabel = field
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const operatorLabel = this._getOperatorLabel(operator);
    const valueLabel = Array.isArray(value) ? value.join(', ') : value;

    return `${fieldLabel} ${operatorLabel} ${valueLabel}`;
  }

  /**
   * Get human-readable label for operator
   * 
   * @private
   */
  static _getOperatorLabel(operator) {
    const labels = {
      eq: 'égal à',
      equals: 'égal à',
      ne: 'différent de',
      not_eq: 'différent de',
      gt: 'supérieur à',
      greater_than: 'supérieur à',
      gte: 'supérieur ou égal à',
      greater_than_or_equal: 'supérieur ou égal à',
      lt: 'inférieur à',
      less_than: 'inférieur à',
      lte: 'inférieur ou égal à',
      less_than_or_equal: 'inférieur ou égal à',
      contains: 'contient',
      not_contains: 'ne contient pas',
      starts_with: 'commence par',
      ends_with: 'se termine par',
      matches: 'correspond à',
      exists: 'existe',
      not_exists: 'n\'existe pas',
      in: 'dans',
      not_in: 'pas dans',
      is_true: 'est vrai',
      is_false: 'est faux',
    };

    return labels[operator] || operator;
  }

  /**
   * Validate condition structure
   * 
   * @param {Object} conditions - Condition to validate
   * @returns {Array} Array of validation errors (empty if valid)
   */
  static validate(conditions) {
    const errors = [];

    if (!conditions || typeof conditions !== 'object') {
      return ['Condition must be an object'];
    }

    if (!conditions.operator) {
      errors.push('Operator is required');
    }

    if (!['AND', 'OR', 'NOT'].includes(conditions.operator?.toUpperCase())) {
      errors.push(`Invalid operator: ${conditions.operator}`);
    }

    if (!Array.isArray(conditions.conditions)) {
      errors.push('Conditions must be an array');
    } else if (conditions.conditions.length === 0) {
      errors.push('Conditions array cannot be empty');
    } else {
      // Validate each sub-condition
      conditions.conditions.forEach((cond, idx) => {
        if (!cond.field) {
          errors.push(`Condition ${idx}: field is required`);
        }

        if (!cond.operator) {
          errors.push(`Condition ${idx}: operator is required`);
        }

        if (!this._isValidOperator(cond.operator)) {
          errors.push(`Condition ${idx}: invalid operator '${cond.operator}'`);
        }
      });
    }

    return errors;
  }

  /**
   * Check if operator is valid
   * 
   * @private
   */
  static _isValidOperator(operator) {
    const validOperators = [
      'eq', 'equals', 'ne', 'not_eq',
      'gt', 'greater_than', 'gte', 'greater_than_or_equal',
      'lt', 'less_than', 'lte', 'less_than_or_equal',
      'contains', 'not_contains', 'starts_with', 'ends_with',
      'matches', 'exists', 'not_exists', 'in', 'not_in',
      'is_true', 'is_false',
    ];

    return validOperators.includes(operator);
  }
}
