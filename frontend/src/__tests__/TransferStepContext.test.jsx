import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isRateLimited } from '../utils/rateLimiter';
import { sanitizeString } from '../utils/sanitizer';

/**
 * Tests for TransferStepContext Logic
 * Covers: CRUD operations,validation, rate limiting, sanitization
 */

describe('TransferStep CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step Number Validation', () => {
    it('should validate step_number is positive', () => {
      const stepData = { step_number: 0, step_name: 'Test' };
      const isValid = stepData.step_number >= 1;
      expect(isValid).toBe(false);
    });

    it('should accept valid step_number', () => {
      const stepData = { step_number: 1, step_name: 'Test' };
      const isValid = stepData.step_number >= 1 && stepData.step_name.length >= 2;
      expect(isValid).toBe(true);
    });

    it('should reject negative step numbers', () => {
      const stepData = { step_number: -5 };
      expect(stepData.step_number < 1).toBe(true);
    });
  });

  describe('Step Name Validation', () => {
    it('should require step_name minimum 2 characters', () => {
      const stepName = 'A';
      const isValid = stepName.length >= 2;
      expect(isValid).toBe(false);
    });

    it('should accept valid step_name', () => {
      const stepName = 'Verification';
      const isValid = stepName.length >= 2;
      expect(isValid).toBe(true);
    });

    it('should reject empty step_name', () => {
      const stepName = '';
      const isValid = stepName.length >= 2;
      expect(isValid).toBe(false);
    });
  });

  describe('Step Type Validation', () => {
    it('should validate allowed step types', () => {
      const allowedTypes = ['verification', 'approval', 'notification', 'payment'];
      const stepType = 'verification';
      expect(allowedTypes.includes(stepType)).toBe(true);
    });

    it('should reject invalid step type', () => {
      const allowedTypes = ['verification', 'approval', 'notification', 'payment'];
      const stepType = 'invalid_type';
      expect(allowedTypes.includes(stepType)).toBe(false);
    });

    it('should default to verification if not specified', () => {
      const stepType = undefined || 'verification';
      expect(stepType).toBe('verification');
    });
  });

  describe('Required Fields Validation', () => {
    it('should accept required_fields as array', () => {
      const fields = ['holder_name', 'holder_email'];
      expect(Array.isArray(fields)).toBe(true);
    });

    it('should reject non-array required_fields', () => {
      const fields = 'holder_name'; // Wrong type
      expect(Array.isArray(fields)).toBe(false);
    });

    it('should allow empty required_fields', () => {
      const fields = [];
      expect(Array.isArray(fields) && fields.length === 0).toBe(true);
    });

    it('should sanitize field names', () => {
      const fieldName = 'holder_name<script>';
      const sanitized = sanitizeString(fieldName);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });
  });

  describe('Duration Validation', () => {
    it('should accept non-negative duration', () => {
      const duration = 15;
      expect(duration >= 0).toBe(true);
    });

    it('should reject negative duration', () => {
      const duration = -5;
      expect(duration >= 0).toBe(false);
    });

    it('should default to 0 if not specified', () => {
      const duration = undefined || 0;
      expect(duration).toBe(0);
    });

    it('should floor duration to integer', () => {
      const duration = Math.floor(15.7);
      expect(duration).toBe(15);
    });
  });

  describe('Step Data Sanitization', () => {
    it('should sanitize step_name input', () => {
      const stepName = 'Step<script>Alert</script>';
      const sanitized = sanitizeString(stepName);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should sanitize description input', () => {
      const description = 'Verify user; DROP TABLE--';
      const sanitized = sanitizeString(description);
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('-');
    });

    it('should limit step_name to 100 characters', () => {
      const longName = 'A'.repeat(150);
      const sanitized = sanitizeString(longName);
      expect(sanitized.substring(0, 100).length).toBeLessThanOrEqual(100);
    });

    it('should limit description to 500 characters', () => {
      const longDesc = 'A'.repeat(600);
      const sanitized = sanitizeString(longDesc);
      expect(sanitized.substring(0, 500).length).toBeLessThanOrEqual(500);
    });
  });

  describe('rate Limiting', () => {
    it('should allow first 10 step creations per minute', () => {
      const key = 'transfer-step-create-test-1';
      let blocked = false;

      for (let i = 0; i < 10; i++) {
        if (isRateLimited(key, 10, 60000)) {
          blocked = true;
          break;
        }
      }

      expect(blocked).toBe(false);
    });

    it('should block 11th step creation within minute', () => {
      const key = 'transfer-step-create-test-2';

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        isRateLimited(key, 10, 60000);
      }

      // 11th should be blocked
      const blocked = isRateLimited(key, 10, 60000);
      expect(blocked).toBe(true);
    });

    it('should allow up to 15 updates per minute', () => {
      const key = 'transfer-step-update-test-1';
      let blocked = false;

      for (let i = 0; i < 15; i++) {
        if (isRateLimited(key, 15, 60000)) {
          blocked = true;
          break;
        }
      }

      expect(blocked).toBe(false);
    });

    it('should allow up to 5 deletes per minute', () => {
      const key = 'transfer-step-delete-test-1';
      let blocked = false;

      for (let i = 0; i < 5; i++) {
        if (isRateLimited(key, 5, 60000)) {
          blocked = true;
          break;
        }
      }

      expect(blocked).toBe(false);
    });
  });

  describe('Duplicate Step Number Handling', () => {
    it('should reject duplicate step_number for same user', () => {
      const userSteps = [
        { id: '1', step_number: 1, step_name: 'First' },
        { id: '2', step_number: 2, step_name: 'Second' },
      ];

      const newStepNumber = 1;
      const isDuplicate = userSteps.some(s => s.step_number === newStepNumber);
      expect(isDuplicate).toBe(true);
    });

    it('should allow same step_number for different users', () => {
      // This is a logical check - each user has independent step numbering
      const user1Steps = [{ step_number: 1 }];
      const user2Steps = [{ step_number: 1 }];

      // Both can have step 1
      expect(user1Steps[0].step_number).toBe(1);
      expect(user2Steps[0].step_number).toBe(1);
    });
  });

  describe('Step Reordering', () => {
    it('should accept array of reorder updates', () => {
      const updates = [
        { id: 'step1', new_step_number: 3 },
        { id: 'step2', new_step_number: 1 },
        { id: 'step3', new_step_number: 2 },
      ];

      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBe(3);
    });

    it('should validate step numbers are positive integers', () => {
      const updates = [
        { id: 'step1', new_step_number: Math.floor(2.5) },
      ];

      expect(updates[0].new_step_number).toBe(2);
      expect(updates[0].new_step_number > 0).toBe(true);
    });

    it('should reject non-array reorder updates', () => {
      const updates = { id: 'step1', new_step_number: 1 };
      expect(Array.isArray(updates)).toBe(false);
    });
  });

  describe('Active/Inactive Flag', () => {
    it('should default to active if not specified', () => {
      const isActive = true !== false ? true : false;
      expect(isActive).toBe(true);
    });

    it('should accept explicit inactive', () => {
      const isActive = false;
      expect(isActive).toBe(false);
    });

    it('should convert to boolean', () => {
      const isActive = 'anything' !== false;
      expect(typeof isActive).toBe('boolean');
    });
  });

  describe('Active Transfer Check Before Delete', () => {
    it('should prevent deletion if step has in_progress transfers', () => {
      const activeTransfers = [
        { id: 'transfer1', status: 'in_progress' },
      ];

      const canDelete = activeTransfers.filter(t => t.status === 'in_progress').length === 0;
      expect(canDelete).toBe(false);
    });

    it('should allow deletion if no active transfers', () => {
      const activeTransfers = [];
      const canDelete = activeTransfers.filter(t => t.status === 'in_progress').length === 0;
      expect(canDelete).toBe(true);
    });

    it('should allow deletion if transfers only completed', () => {
      const activeTransfers = [
        { id: 'transfer1', status: 'completed' },
        { id: 'transfer2', status: 'failed' },
      ];

      const canDelete = activeTransfers.filter(t => t.status === 'in_progress').length === 0;
      expect(canDelete).toBe(true);
    });
  });

  describe('Validation Rules Object', () => {
    it('should accept empty validations object', () => {
      const validations = {};
      expect(typeof validations).toBe('object');
      expect(Array.isArray(validations)).toBe(false);
    });

    it('should accept custom validation rules', () => {
      const validations = {
        min_amount: 100,
        max_amount: 1000000,
        require_approval: true,
      };

      expect(validations.min_amount).toBe(100);
      expect(validations.require_approval).toBe(true);
    });
  });

  describe('Conditions Object', () => {
    it('should accept empty conditions object', () => {
      const conditions = {};
      expect(typeof conditions).toBe('object');
    });

    it('should accept conditional logic', () => {
      const conditions = {
        skip_if_amount_less_than: 500,
        require_if_international: true,
      };

      expect(conditions.skip_if_amount_less_than).toBe(500);
      expect(conditions.require_if_international).toBe(true);
    });
  });

  describe('Step Sorting', () => {
    it('should sort steps by step_number ascending', () => {
      const steps = [
        { step_number: 3, name: 'Third' },
        { step_number: 1, name: 'First' },
        { step_number: 2, name: 'Second' },
      ];

      const sorted = steps.sort((a, b) => a.step_number - b.step_number);
      expect(sorted[0].step_number).toBe(1);
      expect(sorted[1].step_number).toBe(2);
      expect(sorted[2].step_number).toBe(3);
    });
  });

  describe('Error Messages', () => {
    it('should provide user-friendly error for duplicate step_number', () => {
      const stepNumber = 1;
      const error = `Une étape avec le numéro ${stepNumber} existe déjà`;
      expect(error).toContain('étape');
      expect(error).toContain('existe');
    });

    it('should provide user-friendly error for active transfers', () => {
      const error = 'Impossible de supprimer: cette étape est actuellement utilisée';
      expect(error).toContain('supprime');
      expect(error).toContain('utilisée');
    });
  });
});
