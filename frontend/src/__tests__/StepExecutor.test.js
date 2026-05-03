import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StepExecutor } from '../utils/StepExecutor';
import { ConditionEvaluator } from '../utils/ConditionEvaluator';

/**
 * Tests for StepExecutor Utility
 * Coverage: Step execution, next step determination, type-specific logic
 */

describe('StepExecutor - Get Next Step', () => {
  const allSteps = [
    { id: 'step1', step_number: 1, step_name: 'Verification', step_type: 'verification' },
    { id: 'step2', step_number: 2, step_name: 'Approval', step_type: 'approval' },
    { id: 'step3', step_number: 3, step_name: 'Notification', step_type: 'notification' },
    { id: 'step4', step_number: 4, step_name: 'Payment', step_type: 'payment' },
  ];

  const transferData = {
    amount: 500,
    currency: 'EUR',
    holder_name: 'John Doe',
  };

  it('should return first step when none completed', () => {
    const next = StepExecutor.getNextStep(allSteps, [], [], transferData, {});
    expect(next.id).toBe('step1');
    expect(next.step_number).toBe(1);
  });

  it('should return next step after completed', () => {
    const next = StepExecutor.getNextStep(
      allSteps,
      ['step1'],
      [],
      transferData,
      {}
    );
    expect(next.id).toBe('step2');
  });

  it('should skip completed and skipped steps', () => {
    const next = StepExecutor.getNextStep(
      allSteps,
      ['step1'],
      ['step2'],
      transferData,
      {}
    );
    expect(next.id).toBe('step3');
  });

  it('should return null when all steps completed', () => {
    const next = StepExecutor.getNextStep(
      allSteps,
      ['step1', 'step2', 'step3', 'step4'],
      [],
      transferData,
      {}
    );
    expect(next).toBeNull();
  });

  it('should handle empty steps array', () => {
    const next = StepExecutor.getNextStep([], [], [], transferData, {});
    expect(next).toBeNull();
  });
});

describe('StepExecutor - Validation Rules', () => {
  it('should get validation rules for step', () => {
    const step = {
      id: 'step1',
      step_name: 'Test',
      step_type: 'verification',
      required_fields: ['holder_name', 'holder_email'],
    };

    const rules = StepExecutor.getValidationRules(step);

    expect(rules.holder_name).toBeTruthy();
    expect(rules.holder_email).toBeTruthy();
    expect(rules.holder_name.required).toBe(true);
  });

  it('should include type-specific validations', () => {
    const step = {
      step_type: 'approval',
      required_fields: [],
    };

    const rules = StepExecutor.getValidationRules(step);

    expect(rules.approved_by).toBeTruthy();
    expect(rules.approval_timestamp).toBeTruthy();
  });

  it('should detect field types correctly', () => {
    const emailType = StepExecutor._getFieldType('holder_email');
    const ibanType = StepExecutor._getFieldType('iban');
    const phoneType = StepExecutor._getFieldType('phone');

    expect(emailType).toBe('email');
    expect(ibanType).toBe('iban');
    expect(phoneType).toBe('phone');
  });

  it('should get type-specific validations', () => {
    const paymentValidations = StepExecutor._getTypeValidations('payment');

    expect(paymentValidations.transaction_id).toBeTruthy();
    expect(paymentValidations.payment_confirmed).toBeTruthy();
    expect(paymentValidations.transaction_id.required).toBe(true);
  });
});

describe('StepExecutor - Step Execution', () => {
  const step = {
    id: 'step1',
    step_name: 'Verification',
    step_type: 'verification',
    required_fields: ['holder_name'],
  };

  const transferData = {
    holder_name: 'John Doe',
  };

  it('should execute step successfully', async () => {
    const result = await StepExecutor.executeStep(step, transferData, {});

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toBeTruthy();
  });

  it('should handle verification step', async () => {
    const result = await StepExecutor.executeStep(step, transferData, {});

    expect(result.data.step_type).toBe('verification');
    expect(result.data.checks_performed).toBeTruthy();
  });

  it('should handle approval step', async () => {
    const approvalStep = {
      id: 'step2',
      step_type: 'approval',
      required_fields: [],
    };

    const result = await StepExecutor.executeStep(
      approvalStep,
      transferData,
      {}
    );

    expect(result.data.step_type).toBe('approval');
    expect(result.data.approval_status).toBeTruthy();
  });

  it('should handle notification step', async () => {
    const notificationStep = {
      id: 'step3',
      step_type: 'notification',
      required_fields: [],
    };

    const notificationData = {
      ...transferData,
      holder_email: 'john@example.com',
    };

    const result = await StepExecutor.executeStep(
      notificationStep,
      notificationData,
      {}
    );

    expect(result.data.step_type).toBe('notification');
    expect(result.data.notifications_sent).toContain('email');
  });

  it('should handle payment step', async () => {
    const paymentStep = {
      id: 'step4',
      step_type: 'payment',
      required_fields: [],
    };

    const paymentData = {
      ...transferData,
      amount: 1000,
      currency: 'EUR',
      recipient_iban: 'DE89370400440532013000',
      holder_iban: 'FR1420041010050500013M02606',
    };

    const result = await StepExecutor.executeStep(
      paymentStep,
      paymentData,
      {}
    );

    expect(result.data.step_type).toBe('payment');
    expect(result.data.transaction_id).toBeTruthy();
    expect(result.data.status).toBe('completed');
  });
});

describe('StepExecutor - Execution Plan', () => {
  it('should build execution plan', () => {
    const steps = [
      { id: 'step1', step_number: 1, step_name: 'Verify', step_type: 'verification' },
      { id: 'step2', step_number: 2, step_name: 'Approve', step_type: 'approval' },
    ];

    const transferData = { amount: 500 };

    const plan = StepExecutor.buildExecutionPlan(steps, transferData);

    expect(plan.length).toBe(2);
    expect(plan[0].will_execute).toBe(true);
    expect(plan[1].will_execute).toBe(true);
  });

  it('should show plan with all step details', () => {
    const steps = [
      {
        id: 'step1',
        step_number: 1,
        step_name: 'Verification',
        step_type: 'verification',
        estimated_duration_minutes: 5,
        required_fields: ['holder_name'],
      },
    ];

    const plan = StepExecutor.buildExecutionPlan(steps, {});

    expect(plan[0].step_id).toBe('step1');
    expect(plan[0].duration_estimate).toBe(5);
    expect(plan[0].required_fields).toContain('holder_name');
  });
});

describe('StepExecutor - Approval Requirements', () => {
  it('should require approval for high amounts', () => {
    const requiresApproval = StepExecutor._requiresApproval(15000);
    expect(requiresApproval).toBe(true);
  });

  it('should not require approval for low amounts', () => {
    const requiresApproval = StepExecutor._requiresApproval(5000);
    expect(requiresApproval).toBe(false);
  });
});

describe('StepExecutor - Payment Validation', () => {
  it('should allow valid payments', () => {
    const canProcess = StepExecutor._canProcessPayment({
      amount: 1000,
      currency: 'EUR',
      recipient_iban: 'DE89370400440532013000',
      holder_iban: 'FR1420041010050500013M02606',
    });

    expect(canProcess).toBe(true);
  });

  it('should reject payments missing fields', () => {
    const canProcess = StepExecutor._canProcessPayment({
      amount: 1000,
      currency: 'EUR',
    });

    expect(canProcess).toBe(false);
  });
});

describe('StepExecutor - Error Handling', () => {
  it('should handle invalid step types', async () => {
    const result = await StepExecutor.executeStep(
      { id: 'step1', step_type: 'invalid' },
      {},
      {}
    );

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle missing required fields', async () => {
    const step = {
      id: 'step1',
      step_type: 'verification',
      required_fields: ['holder_name'],
    };

    const result = await StepExecutor.executeStep(
      step,
      {}, // Missing holder_name
      {}
    );

    expect(result.success).toBe(false);
  });
});
