import { describe, it, expect } from 'vitest';
import { ConditionEvaluator } from '../utils/ConditionEvaluator';

/**
 * Tests for ConditionEvaluator Utility
 * Coverage: Condition parsing, logical operators, comparisons
 */

describe('ConditionEvaluator - Basic Comparisons', () => {
  it('should evaluate equals condition', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'currency', operator: 'eq', value: 'EUR' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { currency: 'EUR' }
    );

    expect(result).toBe(false); // False = skip this step
  });

  it('should evaluate not equals condition', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'currency', operator: 'ne', value: 'USD' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { currency: 'EUR' }
    );

    expect(result).toBe(false);
  });

  it('should evaluate greater than', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'amount', operator: 'gt', value: 1000 }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 1500 }
    );

    expect(result).toBe(false);
  });

  it('should evaluate less than', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'amount', operator: 'lt', value: 1000 }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 500 }
    );

    expect(result).toBe(false);
  });
});

describe('ConditionEvaluator - Logical Operators', () => {
  it('should evaluate AND condition - all true', () => {
    const condition = {
      operator: 'AND',
      conditions: [
        { field: 'amount', operator: 'gt', value: 100 },
        { field: 'currency', operator: 'eq', value: 'EUR' },
      ],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 500, currency: 'EUR' }
    );

    expect(result).toBe(false); // Both true = skip
  });

  it('should evaluate AND condition - one false', () => {
    const condition = {
      operator: 'AND',
      conditions: [
        { field: 'amount', operator: 'gt', value: 1000 },
        { field: 'currency', operator: 'eq', value: 'EUR' },
      ],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 500, currency: 'EUR' }
    );

    expect(result).toBe(true); // One false = don't skip
  });

  it('should evaluate OR condition - any true', () => {
    const condition = {
      operator: 'OR',
      conditions: [
        { field: 'amount', operator: 'gt', value: 1000 },
        { field: 'currency', operator: 'eq', value: 'EUR' },
      ],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 500, currency: 'EUR' }
    );

    expect(result).toBe(false); // One true = skip
  });

  it('should evaluate NOT condition', () => {
    const condition = {
      operator: 'NOT',
      conditions: [{ field: 'currency', operator: 'eq', value: 'USD' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { currency: 'EUR' }
    );

    expect(result).toBe(false); // NOT false = true (skip)
  });
});

describe('ConditionEvaluator - String Operations', () => {
  it('should evaluate contains', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'name', operator: 'contains', value: 'John' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { name: 'John Doe' }
    );

    expect(result).toBe(false);
  });

  it('should evaluate starts_with', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'iban', operator: 'starts_with', value: 'DE' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { iban: 'DE89370400440532013000' }
    );

    expect(result).toBe(false);
  });

  it('should evaluate ends_with', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'email', operator: 'ends_with', value: '.com' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { email: 'john@example.com' }
    );

    expect(result).toBe(false);
  });
});

describe('ConditionEvaluator - Existence Checks', () => {
  it('should check if field exists', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'amount', operator: 'exists' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 500 }
    );

    expect(result).toBe(false);
  });

  it('should check if field not exists', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'bonus', operator: 'not_exists' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { amount: 500 }
    );

    expect(result).toBe(false);
  });
});

describe('ConditionEvaluator - Array Operations', () => {
  it('should evaluate in operator', () => {
    const condition = {
      operator: 'AND',
      conditions: [
        { field: 'status', operator: 'in', value: ['pending', 'processing'] },
      ],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { status: 'pending' }
    );

    expect(result).toBe(false);
  });

  it('should evaluate not_in operator', () => {
    const condition = {
      operator: 'AND',
      conditions: [
        { field: 'country', operator: 'not_in', value: ['US', 'CA'] },
      ],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { country: 'FR' }
    );

    expect(result).toBe(false);
  });
});

describe('ConditionEvaluator - Nested Values', () => {
  it('should access nested object fields', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'user.country', operator: 'eq', value: 'FR' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { user: { country: 'FR' } }
    );

    expect(result).toBe(false);
  });

  it('should handle missing nested fields', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'user.phone', operator: 'exists' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { user: { name: 'John' } }
    );

    expect(result).toBe(true);
  });
});

describe('ConditionEvaluator - Validation', () => {
  it('should validate correct condition structure', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'amount', operator: 'gt', value: 1000 }],
    };

    const errors = ConditionEvaluator.validate(condition);
    expect(errors.length).toBe(0);
  });

  it('should reject missing operator', () => {
    const condition = {
      conditions: [{ field: 'amount', operator: 'gt', value: 1000 }],
    };

    const errors = ConditionEvaluator.validate(condition);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid operator', () => {
    const condition = {
      operator: 'INVALID',
      conditions: [{ field: 'amount', operator: 'gt', value: 1000 }],
    };

    const errors = ConditionEvaluator.validate(condition);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject empty conditions array', () => {
    const condition = {
      operator: 'AND',
      conditions: [],
    };

    const errors = ConditionEvaluator.validate(condition);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ConditionEvaluator - Description', () => {
  it('should generate human-readable description', () => {
    const condition = {
      operator: 'AND',
      conditions: [
        { field: 'amount', operator: 'gt', value: 1000 },
        { field: 'currency', operator: 'eq', value: 'EUR' },
      ],
    };

    const description = ConditionEvaluator.describe(condition);
    expect(description).toContain('Montant');
    expect(description).toContain('EUR');
  });

  it('should handle empty conditions', () => {
    const description = ConditionEvaluator.describe({});
    expect(description).toBe('Aucune condition');
  });
});

describe('ConditionEvaluator - Edge Cases', () => {
  it('should handle null values', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'bonus', operator: 'exists' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      { bonus: null }
    );

    expect(result).toBe(true);
  });

  it('should handle undefined values', () => {
    const condition = {
      operator: 'AND',
      conditions: [{ field: 'bonus', operator: 'not_exists' }],
    };

    const result = ConditionEvaluator.evaluate(
      condition,
      {}
    );

    expect(result).toBe(false);
  });

  it('should handle empty condition object', () => {
    const result = ConditionEvaluator.evaluate({}, { amount: 500 });
    expect(result).toBe(false); // No conditions = don't skip
  });
});
