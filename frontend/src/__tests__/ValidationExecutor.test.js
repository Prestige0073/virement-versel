import { describe, it, expect } from 'vitest';
import { ValidationExecutor } from '../utils/ValidationExecutor';

/**
 * Tests for ValidationExecutor Utility
 * Coverage: Field validation, type checking, constraints
 */

describe('ValidationExecutor - Required Fields', () => {
  it('should validate required fields present', () => {
    const data = { name: 'John', email: 'john@example.com' };
    const rules = { name: { required: true }, email: { required: true } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject missing required field', () => {
    const data = { email: 'john@example.com' };
    const rules = { name: { required: true }, email: { required: true } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('name'))).toBe(true);
  });

  it('should skip non-required fields when missing', () => {
    const data = { name: 'John' };
    const rules = { name: { required: true }, phone: { required: false } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });
});

describe('ValidationExecutor - Type Validation', () => {
  it('should validate email type', () => {
    const data = { email: 'john@example.com' };
    const rules = { email: { type: 'email' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid email', () => {
    const data = { email: 'invalid-email' };
    const rules = { email: { type: 'email' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('email'))).toBe(true);
  });

  it('should validate IBAN type', () => {
    const data = { iban: 'DE89370400440532013000' };
    const rules = { iban: { type: 'iban' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid IBAN', () => {
    const data = { iban: 'INVALID' };
    const rules = { iban: { type: 'iban' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('IBAN'))).toBe(true);
  });

  it('should validate phone type', () => {
    const data = { phone: '+33123456789' };
    const rules = { phone: { type: 'phone' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should validate number type', () => {
    const data = { amount: 1000 };
    const rules = { amount: { type: 'number' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject non-number for number type', () => {
    const data = { amount: 'abc' };
    const rules = { amount: { type: 'number' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('nombre'))).toBe(true);
  });

  it('should validate integer type', () => {
    const data = { steps: 5 };
    const rules = { steps: { type: 'integer' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject decimal for integer type', () => {
    const data = { steps: 5.5 };
    const rules = { steps: { type: 'integer' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('entier'))).toBe(true);
  });
});

describe('ValidationExecutor - Length Constraints', () => {
  it('should validate minimum length', () => {
    const data = { password: 'SecurePass123' };
    const rules = { password: { minLength: 8 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject string too short', () => {
    const data = { password: 'Short' };
    const rules = { password: { minLength: 8 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('au moins'))).toBe(true);
  });

  it('should validate maximum length', () => {
    const data = { name: 'John' };
    const rules = { name: { maxLength: 10 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject string too long', () => {
    const data = { name: 'VeryLongNameExceedingLimit' };
    const rules = { name: { maxLength: 10 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('dépasser'))).toBe(true);
  });
});

describe('ValidationExecutor - Range Constraints', () => {
  it('should validate minimum value', () => {
    const data = { amount: 100 };
    const rules = { amount: { min: 50 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject value below minimum', () => {
    const data = { amount: 30 };
    const rules = { amount: { min: 50 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('au moins'))).toBe(true);
  });

  it('should validate maximum value', () => {
    const data = { amount: 5000 };
    const rules = { amount: { max: 10000 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject value above maximum', () => {
    const data = { amount: 15000 };
    const rules = { amount: { max: 10000 } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('dépasser'))).toBe(true);
  });
});

describe('ValidationExecutor - Pattern Validation', () => {
  it('should validate pattern match', () => {
    const data = { iban: 'DE12345678901234567890' };
    const rules = { iban: { pattern: '^[A-Z]{2}' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject pattern mismatch', () => {
    const data = { code: '12abc' };
    const rules = { code: { pattern: '^[A-Z]+$' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('bon format'))).toBe(true);
  });
});

describe('ValidationExecutor - Enum Validation', () => {
  it('should validate allowed values', () => {
    const data = { currency: 'EUR' };
    const rules = { currency: { allowedValues: ['EUR', 'USD', 'GBP'] } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject not allowed value', () => {
    const data = { currency: 'JPY' };
    const rules = { currency: { allowedValues: ['EUR', 'USD', 'GBP'] } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('valeurs'))).toBe(true);
  });
});

describe('ValidationExecutor - Transfer Validation', () => {
  it('should validate complete transfer', () => {
    const transferData = {
      holder_name: 'John Doe',
      holder_email: 'john@example.com',
      holder_iban: 'FR1420041010050500013M02606',
      recipient_iban: 'DE89370400440532013000',
      amount: 1000,
      currency: 'EUR',
    };

    const steps = [
      {
        required_fields: ['holder_name', 'holder_email'],
      },
      {
        required_fields: ['holder_iban', 'recipient_iban', 'amount', 'currency'],
      },
    ];

    const errors = ValidationExecutor.validateTransfer(transferData, steps);
    expect(errors.length).toBe(0);
  });

  it('should validate amount constraints', () => {
    const transferData = {
      amount: 0,
      currency: 'EUR',
    };

    const errors = ValidationExecutor.validateTransfer(transferData, []);
    expect(errors.some(e => e.includes('montant'))).toBe(true);
  });

  it('should reject extremely large amount', () => {
    const transferData = {
      amount: 1000000000,
      currency: 'EUR',
    };

    const errors = ValidationExecutor.validateTransfer(transferData, []);
    expect(errors.some(e => e.includes('maximum'))).toBe(true);
  });

  it('should validate all required fields collected', () => {
    const transferData = {
      holder_name: 'John',
    };

    const steps = [
      {
        required_fields: ['holder_name', 'holder_email', 'amount'],
      },
    ];

    const errors = ValidationExecutor.validateTransfer(transferData, steps);
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe('ValidationExecutor - Result Building', () => {
  it('should build valid result', () => {
    const result = ValidationExecutor.buildResult([]);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.error_count).toBe(0);
    expect(result.timestamp).toBeTruthy();
  });

  it('should build invalid result with errors', () => {
    const errors = ['Error 1', 'Error 2'];
    const result = ValidationExecutor.buildResult(errors);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(errors);
    expect(result.error_count).toBe(2);
  });
});

describe('ValidationExecutor - Custom Validators', () => {
  it('should execute custom validator function', () => {
    const data = { age: 25 };
    const rules = {
      age: {
        validator: (value) => {
          if (value < 18) return 'Must be 18 or older';
          return null;
        },
      },
    };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should capture custom validator error', () => {
    const data = { age: 15 };
    const rules = {
      age: {
        validator: (value) => {
          if (value < 18) return 'Must be 18 or older';
          return null;
        },
      },
    };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('18'))).toBe(true);
  });
});

describe('ValidationExecutor - Conditional Requirements', () => {
  it('should require field conditionally when condition met', () => {
    const data = { amount: 50000 };
    const rules = {
      approval: {
        requireIf: { field: 'amount', operator: 'greater_than', value: 10000 },
      },
    };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('requis'))).toBe(true);
  });

  it('should not require field when condition not met', () => {
    const data = { amount: 5000 };
    const rules = {
      approval: {
        requireIf: { field: 'amount', operator: 'greater_than', value: 10000 },
      },
    };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });
});

describe('ValidationExecutor - Currency Validation', () => {
  it('should validate supported currencies', () => {
    const data = { currency: 'EUR' };
    const rules = { currency: { type: 'currency' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.length).toBe(0);
  });

  it('should reject unsupported currency', () => {
    const data = { currency: 'XYZ' };
    const rules = { currency: { type: 'currency' } };

    const errors = ValidationExecutor.validate(data, rules);
    expect(errors.some(e => e.includes('devise'))).toBe(true);
  });
});
