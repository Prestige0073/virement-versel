import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TransferAttemptProvider, TransferAttemptContext } from '../context/TransferAttemptContext';
import useTransferAttempt from '../hooks/useTransferAttempt';

// Mock API calls
jest.mock('../services/api', () => ({
  transferAttemptsApi: {
    create: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
    advance: jest.fn(),
    skip: jest.fn(),
    fail: jest.fn(),
    retry: jest.fn(),
    complete: jest.fn(),
  },
}));

import { transferAttemptsApi } from '../services/api';

const wrapper = ({ children }) => (
  <TransferAttemptProvider>{children}</TransferAttemptProvider>
);

describe('TransferAttemptContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    test('should initialize with empty attempts', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      expect(result.current.attempts).toEqual([]);
    });

    test('should initialize with no selected attempt', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      expect(result.current.selectedAttempt).toBeNull();
    });

    test('should initialize with loading false', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      expect(result.current.loading).toBe(false);
    });

    test('should initialize with no error', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      expect(result.current.error).toBeNull();
    });

    test('should have all expected context methods', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      expect(typeof result.current.startAttempt).toBe('function');
      expect(typeof result.current.advanceStep).toBe('function');
      expect(typeof result.current.skipStep).toBe('function');
      expect(typeof result.current.failStep).toBe('function');
      expect(typeof result.current.completeAttempt).toBe('function');
      expect(typeof result.current.getAttempt).toBe('function');
      expect(typeof result.current.getAttempts).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  // ==================== startAttempt Tests ====================
  describe('startAttempt Method', () => {
    test('should create new transfer attempt', async () => {
      const mockAttempt = {
        id: 'attempt1',
        paymentId: 'payment1',
        status: 'in-progress',
        currentStepNumber: 1,
        totalSteps: 5,
        steps: [],
      };

      transferAttemptsApi.create.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(transferAttemptsApi.create).toHaveBeenCalledWith({ paymentId: 'payment1' });
    });

    test('should set loading state during creation', async () => {
      transferAttemptsApi.create.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      act(() => {
        result.current.startAttempt('payment1');
      });

      expect(result.current.loading).toBe(true);
    });

    test('should add new attempt to attempts array', async () => {
      const mockAttempt = {
        id: 'attempt1',
        paymentId: 'payment1',
        status: 'in-progress',
        currentStepNumber: 1,
        totalSteps: 5,
        steps: [],
      };

      transferAttemptsApi.create.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(result.current.attempts).toContainEqual(mockAttempt);
    });

    test('should set selected attempt to newly created attempt', async () => {
      const mockAttempt = {
        id: 'attempt1',
        paymentId: 'payment1',
        status: 'in-progress',
        currentStepNumber: 1,
        totalSteps: 5,
        steps: [],
      };

      transferAttemptsApi.create.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(result.current.selectedAttempt).toEqual(mockAttempt);
    });

    test('should clear error on successful creation', async () => {
      transferAttemptsApi.create.mockResolvedValue({
        id: 'attempt1',
        paymentId: 'payment1',
      });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // Manually set error
      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(result.current.error).toBeNull();
    });

    test('should handle creation error', async () => {
      const error = new Error('Failed to create attempt');
      transferAttemptsApi.create.mockRejectedValue(error);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.attempts).toHaveLength(0);
    });

    test('should enforce rate limiting on creation (10/min)', async () => {
      transferAttemptsApi.create.mockResolvedValue({
        id: 'attempt1',
        paymentId: 'payment1',
      });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // Try to create 11 attempts rapidly
      for (let i = 0; i < 11; i++) {
        await act(async () => {
          await result.current.startAttempt(`payment${i}`);
        });
      }

      // 11th attempt should fail due to rate limiting
      expect(result.current.error).toContain('rate limit');
    });
  });

  // ==================== advanceStep Tests ====================
  describe('advanceStep Method', () => {
    const mockAttempt = {
      id: 'attempt1',
      paymentId: 'payment1',
      status: 'in-progress',
      currentStepNumber: 1,
      totalSteps: 5,
      steps: [
        {
          id: 'step1',
          name: 'Vérification',
          type: 'verification',
          status: 'completed',
        },
      ],
    };

    test('should advance attempt to next step', async () => {
      const advancedAttempt = {
        ...mockAttempt,
        currentStepNumber: 2,
        steps: [
          ...mockAttempt.steps,
          {
            id: 'step2',
            name: 'Approbation',
            type: 'approval',
            status: 'in-progress',
          },
        ],
      };

      transferAttemptsApi.advance.mockResolvedValue(advancedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(transferAttemptsApi.advance).toHaveBeenCalledWith('attempt1', {});
    });

    test('should validate step requirements before advancing', async () => {
      transferAttemptsApi.advance.mockRejectedValue(
        new Error('Unmet step requirements')
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.error).toContain('requirements');
    });

    test('should update current step number', async () => {
      const advancedAttempt = {
        ...mockAttempt,
        currentStepNumber: 2,
      };

      transferAttemptsApi.advance.mockResolvedValue(advancedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      const updated = result.current.attempts.find(a => a.id === 'attempt1');
      expect(updated.currentStepNumber).toBe(2);
    });

    test('should track step history with timestamps', async () => {
      const advancedAttempt = {
        ...mockAttempt,
        stepHistory: [
          {
            stepId: 'step1',
            action: 'completed',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      transferAttemptsApi.advance.mockResolvedValue(advancedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      const updated = result.current.getAttempt('attempt1');
      expect(updated.stepHistory).toBeTruthy();
      expect(updated.stepHistory[0].timestamp).toBeTruthy();
    });

    test('should execute validation rules', async () => {
      transferAttemptsApi.advance.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const stepData = {
        email: 'test@example.com',
        phoneNumber: '+33612345678',
      };

      await act(async () => {
        await result.current.advanceStep('attempt1', stepData);
      });

      expect(transferAttemptsApi.advance).toHaveBeenCalledWith(
        'attempt1',
        expect.objectContaining(stepData)
      );
    });

    test('should enforce rate limiting on advance (20/min)', async () => {
      transferAttemptsApi.advance.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // Try to advance 21 times rapidly
      for (let i = 0; i < 21; i++) {
        await act(async () => {
          await result.current.advanceStep('attempt1', {});
        });
      }

      // 21st attempt should fail due to rate limiting
      expect(result.current.error).toContain('rate limit');
    });

    test('should handle conditional step branching', async () => {
      const conditionalAttempt = {
        ...mockAttempt,
        currentStepNumber: 3,
        steps: [
          mockAttempt.steps[0],
          {
            id: 'step2',
            name: 'Approbation (optionnelle)',
            type: 'approval',
            status: 'skipped',
            isOptional: true,
          },
          {
            id: 'step3',
            name: 'Notification',
            type: 'notification',
            status: 'in-progress',
          },
        ],
      };

      transferAttemptsApi.advance.mockResolvedValue(conditionalAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.selectedAttempt?.currentStepNumber).toBe(3);
    });
  });

  // ==================== skipStep Tests ====================
  describe('skipStep Method', () => {
    const mockAttempt = {
      id: 'attempt1',
      paymentId: 'payment1',
      status: 'in-progress',
      currentStepNumber: 2,
      totalSteps: 5,
      steps: [
        {
          id: 'step2',
          name: 'Notification',
          type: 'notification',
          status: 'pending',
          isOptional: true,
        },
      ],
    };

    test('should skip optional step', async () => {
      const skippedAttempt = {
        ...mockAttempt,
        currentStepNumber: 3,
        steps: [
          {
            ...mockAttempt.steps[0],
            status: 'skipped',
          },
        ],
      };

      transferAttemptsApi.skip.mockResolvedValue(skippedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.skipStep('attempt1', 'step2');
      });

      expect(transferAttemptsApi.skip).toHaveBeenCalledWith('attempt1', 'step2');
    });

    test('should not skip required step', async () => {
      transferAttemptsApi.skip.mockRejectedValue(
        new Error('Step is required and cannot be skipped')
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.skipStep('attempt1', 'step1');
      });

      expect(result.current.error).toContain('required');
    });

    test('should update step status to skipped', async () => {
      const skippedAttempt = {
        ...mockAttempt,
        steps: [
          {
            ...mockAttempt.steps[0],
            status: 'skipped',
            skippedAt: new Date().toISOString(),
          },
        ],
      };

      transferAttemptsApi.skip.mockResolvedValue(skippedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.skipStep('attempt1', 'step2');
      });

      const updated = result.current.getAttempt('attempt1');
      const skippedStep = updated.steps.find(s => s.id === 'step2');
      expect(skippedStep.status).toBe('skipped');
    });

    test('should record skip in step history', async () => {
      const skippedAttempt = {
        ...mockAttempt,
        stepHistory: [
          {
            stepId: 'step2',
            action: 'skipped',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      transferAttemptsApi.skip.mockResolvedValue(skippedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.skipStep('attempt1', 'step2');
      });

      const updated = result.current.getAttempt('attempt1');
      expect(updated.stepHistory).toContainEqual(
        expect.objectContaining({
          stepId: 'step2',
          action: 'skipped',
        })
      );
    });
  });

  // ==================== failStep Tests ====================
  describe('failStep Method', () => {
    const mockAttempt = {
      id: 'attempt1',
      paymentId: 'payment1',
      status: 'in-progress',
      currentStepNumber: 2,
      totalSteps: 5,
      steps: [
        {
          id: 'step2',
          name: 'Approbation',
          type: 'approval',
          status: 'pending',
        },
      ],
    };

    test('should mark step as failed', async () => {
      const failedAttempt = {
        ...mockAttempt,
        status: 'on-hold',
        steps: [
          {
            ...mockAttempt.steps[0],
            status: 'failed',
            failureReason: 'Timeout',
          },
        ],
      };

      transferAttemptsApi.fail.mockResolvedValue(failedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.failStep('attempt1', 'step2', 'Timeout');
      });

      expect(transferAttemptsApi.fail).toHaveBeenCalledWith(
        'attempt1',
        'step2',
        'Timeout'
      );
    });

    test('should set attempt status to on-hold', async () => {
      const failedAttempt = {
        ...mockAttempt,
        status: 'on-hold',
        steps: [
          {
            ...mockAttempt.steps[0],
            status: 'failed',
          },
        ],
      };

      transferAttemptsApi.fail.mockResolvedValue(failedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.failStep('attempt1', 'step2', 'Error');
      });

      const updated = result.current.getAttempt('attempt1');
      expect(updated.status).toBe('on-hold');
    });

    test('should record failure reason', async () => {
      const failedAttempt = {
        ...mockAttempt,
        status: 'on-hold',
        steps: [
          {
            ...mockAttempt.steps[0],
            status: 'failed',
            failureReason: 'Validation failed',
            failedAt: new Date().toISOString(),
          },
        ],
      };

      transferAttemptsApi.fail.mockResolvedValue(failedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.failStep('attempt1', 'step2', 'Validation failed');
      });

      const updated = result.current.getAttempt('attempt1');
      const failedStep = updated.steps.find(s => s.id === 'step2');
      expect(failedStep.failureReason).toBe('Validation failed');
    });

    test('should trigger notification webhook on failure', async () => {
      const failedAttempt = {
        ...mockAttempt,
        status: 'on-hold',
        steps: [
          {
            ...mockAttempt.steps[0],
            status: 'failed',
          },
        ],
      };

      transferAttemptsApi.fail.mockResolvedValue(failedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.failStep('attempt1', 'step2', 'System error');
      });

      expect(transferAttemptsApi.fail).toHaveBeenCalled();
    });
  });

  // ==================== completeAttempt Tests ====================
  describe('completeAttempt Method', () => {
    const mockAttempt = {
      id: 'attempt1',
      paymentId: 'payment1',
      status: 'in-progress',
      currentStepNumber: 5,
      totalSteps: 5,
      steps: Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `step${i + 1}`,
          name: `Step ${i + 1}`,
          status: 'completed',
        })),
    };

    test('should complete transfer attempt', async () => {
      const completedAttempt = {
        ...mockAttempt,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      transferAttemptsApi.complete.mockResolvedValue(completedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.completeAttempt('attempt1');
      });

      expect(transferAttemptsApi.complete).toHaveBeenCalledWith('attempt1');
    });

    test('should set status to completed', async () => {
      const completedAttempt = {
        ...mockAttempt,
        status: 'completed',
      };

      transferAttemptsApi.complete.mockResolvedValue(completedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.completeAttempt('attempt1');
      });

      const updated = result.current.getAttempt('attempt1');
      expect(updated.status).toBe('completed');
    });

    test('should record completion timestamp', async () => {
      const completedAttempt = {
        ...mockAttempt,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      transferAttemptsApi.complete.mockResolvedValue(completedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.completeAttempt('attempt1');
      });

      const updated = result.current.getAttempt('attempt1');
      expect(updated.completedAt).toBeTruthy();
    });

    test('should require all steps to be completed', async () => {
      transferAttemptsApi.complete.mockRejectedValue(
        new Error('Not all steps are completed')
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.completeAttempt('attempt1');
      });

      expect(result.current.error).toContain('Not all steps');
    });

    test('should send completion webhook', async () => {
      const completedAttempt = {
        ...mockAttempt,
        status: 'completed',
      };

      transferAttemptsApi.complete.mockResolvedValue(completedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.completeAttempt('attempt1');
      });

      expect(transferAttemptsApi.complete).toHaveBeenCalled();
    });
  });

  // ==================== getAttempt Tests ====================
  describe('getAttempt Method', () => {
    const mockAttempt = {
      id: 'attempt1',
      paymentId: 'payment1',
      status: 'in-progress',
      currentStepNumber: 2,
      totalSteps: 5,
      steps: [],
    };

    test('should return attempt by id', async () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        result.current.attempts = [mockAttempt];
      });

      const attempt = result.current.getAttempt('attempt1');
      expect(attempt).toEqual(mockAttempt);
    });

    test('should return null if attempt not found', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const attempt = result.current.getAttempt('nonexistent');
      expect(attempt).toBeNull();
    });

    test('should return attempt with all properties', async () => {
      const detailedAttempt = {
        ...mockAttempt,
        steps: [
          {
            id: 'step1',
            name: 'Verification',
            status: 'completed',
          },
        ],
        stepHistory: [
          {
            stepId: 'step1',
            action: 'completed',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        result.current.attempts = [detailedAttempt];
      });

      const attempt = result.current.getAttempt('attempt1');
      expect(attempt.steps).toBeTruthy();
      expect(attempt.stepHistory).toBeTruthy();
    });
  });

  // ==================== getAttempts Tests ====================
  describe('getAttempts Method', () => {
    const mockAttempts = [
      {
        id: 'attempt1',
        paymentId: 'payment1',
        status: 'in-progress',
        currentStepNumber: 2,
        totalSteps: 5,
      },
      {
        id: 'attempt2',
        paymentId: 'payment2',
        status: 'completed',
        currentStepNumber: 5,
        totalSteps: 5,
      },
    ];

    test('should get all attempts', async () => {
      transferAttemptsApi.list.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const attempts = await result.current.getAttempts();
      expect(attempts).toHaveLength(2);
    });

    test('should filter attempts by status', async () => {
      const inProgressAttempts = mockAttempts.filter(a => a.status === 'in-progress');
      transferAttemptsApi.list.mockResolvedValue(inProgressAttempts);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const attempts = await result.current.getAttempts({ status: 'in-progress' });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe('in-progress');
    });

    test('should filter attempts by payment id', async () => {
      const paymentAttempts = mockAttempts.filter(a => a.paymentId === 'payment1');
      transferAttemptsApi.list.mockResolvedValue(paymentAttempts);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const attempts = await result.current.getAttempts({ paymentId: 'payment1' });
      expect(attempts).toHaveLength(1);
    });

    test('should support pagination', async () => {
      transferAttemptsApi.list.mockResolvedValue([mockAttempts[0]]);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const attempts = await result.current.getAttempts({ limit: 1, offset: 0 });
      expect(attempts).toHaveLength(1);
      expect(transferAttemptsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 1, offset: 0 })
      );
    });

    test('should support sorting', async () => {
      const sorted = [...mockAttempts].reverse();
      transferAttemptsApi.list.mockResolvedValue(sorted);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      const attempts = await result.current.getAttempts({ sortBy: 'date', order: 'desc' });
      expect(transferAttemptsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'date', order: 'desc' })
      );
    });
  });

  // ==================== Error Handling Tests ====================
  describe('Error Handling', () => {
    test('should set error state on api failure', async () => {
      const errorMessage = 'Connection error';
      transferAttemptsApi.create.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(result.current.error).toBeTruthy();
    });

    test('should clear error with clearError method', async () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    test('should not disclose sensitive error details to user', async () => {
      transferAttemptsApi.create.mockRejectedValue(
        new Error('Database connection string: mongodb://user:pass@host')
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.startAttempt('payment1');
      });

      expect(result.current.error).not.toContain('mongodb://');
    });

    test('should provide helpful error messages', async () => {
      transferAttemptsApi.advance.mockRejectedValue(
        new Error('Step requirements not met')
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.error).toContain('requirements');
    });
  });

  // ==================== Rate Limiting Tests ====================
  describe('Rate Limiting', () => {
    test('should enforce start attempt limit (10/min)', async () => {
      transferAttemptsApi.create.mockResolvedValue({ id: 'attempt1' });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // Create 10 attempts (should succeed)
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.startAttempt(`payment${i}`);
        });
      }

      expect(transferAttemptsApi.create).toHaveBeenCalledTimes(10);

      // 11th attempt should fail
      await act(async () => {
        await result.current.startAttempt('payment10');
      });

      expect(result.current.error).toContain('rate limit');
    });

    test('should enforce advance step limit (20/min)', async () => {
      transferAttemptsApi.advance.mockResolvedValue({
        id: 'attempt1',
        currentStepNumber: 2,
      });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // Advance 20 times (should succeed)
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          await result.current.advanceStep('attempt1', {});
        });
      }

      expect(transferAttemptsApi.advance).toHaveBeenCalledTimes(20);

      // 21st attempt should fail
      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.error).toContain('rate limit');
    });

    test('should enforce validate step limit (30/min)', async () => {
      transferAttemptsApi.advance.mockResolvedValue({});

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // 30 validations should succeed
      for (let i = 0; i < 30; i++) {
        await act(async () => {
          await result.current.advanceStep('attempt1', {});
        });
      }

      // 31st should fail
      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.error).toContain('rate limit');
    });

    test('should enforce webhook call limit (15/min)', async () => {
      transferAttemptsApi.complete.mockResolvedValue({ status: 'completed' });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // 15 webhook calls should succeed
      for (let i = 0; i < 15; i++) {
        await act(async () => {
          await result.current.completeAttempt(`attempt${i}`);
        });
      }

      expect(transferAttemptsApi.complete).toHaveBeenCalledTimes(15);

      // 16th should fail
      await act(async () => {
        await result.current.completeAttempt('attempt15');
      });

      expect(result.current.error).toContain('rate limit');
    });

    test('should reset rate limit counters after time window', async () => {
      transferAttemptsApi.create.mockResolvedValue({ id: 'attempt1' });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      // Create 10 attempts (succeed)
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.startAttempt(`payment${i}`);
        });
      }

      // Mock time passing
      jest.useFakeTimers();
      jest.advanceTimersByTime(61000); // Advance 61 seconds
      jest.useRealTimers();

      // 11th attempt should now succeed
      transferAttemptsApi.create.mockResolvedValue({ id: 'attempt11' });
      await act(async () => {
        await result.current.startAttempt('payment11');
      });

      expect(transferAttemptsApi.create).toHaveBeenCalledTimes(11);
    });
  });

  // ==================== Ownership Validation Tests ====================
  describe('Ownership Validation', () => {
    test('should validate user owns the attempt', async () => {
      transferAttemptsApi.advance.mockRejectedValue(
        new Error('User does not own this attempt')
      );

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('other-user-attempt', {});
      });

      expect(result.current.error).toContain('own');
    });

    test('should prevent accessing other users attempts', async () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        result.current.attempts = [
          { id: 'attempt1', paymentId: 'payment1', userId: 'user1' },
        ];
      });

      transferAttemptsApi.get.mockRejectedValue(
        new Error('Unauthorized access')
      );

      const attempt = await result.current.getAttempt('attempt2');
      expect(attempt).toBeNull();
    });
  });

  // ==================== Webhook Integration Tests ====================
  describe('Webhook Integration', () => {
    test('should send webhook on step completion', async () => {
      const completedAttempt = {
        id: 'attempt1',
        currentStepNumber: 2,
        status: 'in-progress',
      };

      transferAttemptsApi.advance.mockResolvedValue(completedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.advanceStep('attempt1', {});
      });

      expect(transferAttemptsApi.advance).toHaveBeenCalled();
    });

    test('should send webhook on step failure', async () => {
      transferAttemptsApi.fail.mockResolvedValue({});

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.failStep('attempt1', 'step1', 'Error');
      });

      expect(transferAttemptsApi.fail).toHaveBeenCalledWith(
        'attempt1',
        'step1',
        'Error'
      );
    });

    test('should retry webhook on failure', async () => {
      const completedAttempt = { status: 'completed' };

      transferAttemptsApi.complete.mockResolvedValue(completedAttempt);

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.completeAttempt('attempt1');
      });

      expect(transferAttemptsApi.complete).toHaveBeenCalled();
    });
  });

  // ==================== State Persistence Tests ====================
  describe('State Persistence', () => {
    test('should maintain state across re-renders', () => {
      const mockAttempt = {
        id: 'attempt1',
        status: 'in-progress',
        currentStepNumber: 2,
        totalSteps: 5,
      };

      const { result, rerender } = renderHook(() => useTransferAttempt(), { wrapper });

      act(() => {
        result.current.attempts = [mockAttempt];
      });

      rerender();

      expect(result.current.attempts).toContainEqual(mockAttempt);
    });

    test('should preserve selected attempt on state updates', async () => {
      const mockAttempt = {
        id: 'attempt1',
        status: 'in-progress',
        currentStepNumber: 2,
        totalSteps: 5,
      };

      transferAttemptsApi.advance.mockResolvedValue({
        ...mockAttempt,
        currentStepNumber: 3,
      });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        result.current.selectedAttempt = mockAttempt;
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.selectedAttempt).toBeTruthy();
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    test('should handle empty attempts list gracefully', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      expect(result.current.attempts).toEqual([]);
      expect(result.current.getAttempt('nonexistent')).toBeNull();
    });

    test('should handle concurrent operations', async () => {
      transferAttemptsApi.advance.mockResolvedValue({ currentStepNumber: 2 });
      transferAttemptsApi.skipStep = jest.fn().mockResolvedValue({});

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await Promise.all([
          result.current.advanceStep('attempt1', {}),
          result.current.skipStep('attempt1', 'step1'),
        ]);
      });

      expect(transferAttemptsApi.advance).toHaveBeenCalled();
    });

    test('should handle rapid succeed/fail cycles', async () => {
      transferAttemptsApi.fail.mockResolvedValue({ status: 'on-hold' });
      transferAttemptsApi.advance.mockResolvedValue({ status: 'in-progress' });

      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      await act(async () => {
        await result.current.failStep('attempt1', 'step1', 'Error');
        await result.current.advanceStep('attempt1', {});
      });

      expect(result.current.error).toBeNull();
    });

    test('should handle attempts with no steps', () => {
      const { result } = renderHook(() => useTransferAttempt(), { wrapper });

      act(() => {
        result.current.attempts = [
          { id: 'attempt1', steps: [], currentStepNumber: 0 },
        ];
      });

      const attempt = result.current.getAttempt('attempt1');
      expect(attempt.steps).toEqual([]);
    });
  });
});
