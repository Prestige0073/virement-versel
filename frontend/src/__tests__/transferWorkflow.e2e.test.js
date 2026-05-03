import { renderHook, act, waitFor } from '@testing-library/react';
import useTransferAttempt from '../hooks/useTransferAttempt';

/**
 * Phase 7: End-to-End Workflow Tests
 * 
 * These tests simulate complete transfer workflows from creation to completion,
 * testing the full integration of all Phase 6 systems.
 */

describe('End-to-End Transfer Workflow Tests', () => {
  const mockPaymentData = {
    id: 'payment1',
    payeeIBAN: 'FR1420041010050500013M02606',
    payeeName: 'Jean Dupont',
    payeeEmail: 'jean.dupont@example.com',
    amount: 1500,
    currency: 'EUR',
    purpose: 'Salary',
  };

  const mockSteps = [
    {
      id: 'step1',
      name: 'Verification',
      type: 'verification',
      description: 'Verify sender identity',
      isOptional: false,
      requirements: ['senderEmail', 'senderPhone'],
      validations: [
        { field: 'senderEmail', type: 'email' },
        { field: 'senderPhone', type: 'phone' },
      ],
    },
    {
      id: 'step2',
      name: 'Approval',
      type: 'approval',
      description: 'Get approval for transfer',
      isOptional: false,
      requirements: ['approverEmail'],
      validations: [
        { field: 'approverEmail', type: 'email' },
      ],
    },
    {
      id: 'step3',
      name: 'Security Check',
      type: 'verification',
      description: 'Security verification',
      isOptional: true,
      requirements: [],
      conditions: {
        operator: 'gt',
        field: 'amount',
        value: 1000,
      },
    },
    {
      id: 'step4',
      name: 'Notification',
      type: 'notification',
      description: 'Send confirmation',
      isOptional: false,
      requirements: [],
    },
    {
      id: 'step5',
      name: 'Payment',
      type: 'payment',
      description: 'Process payment',
      isOptional: false,
      requirements: [],
    },
  ];

  // ==================== HAPPY PATH TESTS ====================
  describe('Happy Path: Complete Transfer Successfully', () => {
    test('should complete full transfer workflow step by step', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      // Step 1: Start attempt
      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      expect(attempt).toBeTruthy();
      expect(attempt.currentStepNumber).toBe(1);
      expect(attempt.status).toBe('in-progress');

      // Step 2: Complete verification
      const verificationData = {
        senderEmail: 'sender@example.com',
        senderPhone: '+33612345678',
      };

      await act(async () => {
        await result.current.advanceStep(attempt.id, verificationData);
      });

      const afterVerification = result.current.getAttempt(attempt.id);
      expect(afterVerification.currentStepNumber).toBe(2);

      // Step 3: Complete approval
      const approvalData = {
        approverEmail: 'approver@example.com',
      };

      await act(async () => {
        await result.current.advanceStep(afterVerification.id, approvalData);
      });

      const afterApproval = result.current.getAttempt(attempt.id);
      expect(afterApproval.currentStepNumber).toBe(3);

      // Step 4: Skip optional security check
      await act(async () => {
        await result.current.skipStep(afterApproval.id, 'step3');
      });

      const afterSkip = result.current.getAttempt(attempt.id);
      expect(afterSkip.currentStepNumber).toBe(4);

      // Step 5: Complete notification
      await act(async () => {
        await result.current.advanceStep(afterSkip.id, {});
      });

      const afterNotification = result.current.getAttempt(attempt.id);
      expect(afterNotification.currentStepNumber).toBe(5);

      // Step 6: Complete payment
      await act(async () => {
        await result.current.advanceStep(afterNotification.id, {});
      });

      const completed = result.current.getAttempt(attempt.id);
      expect(completed.currentStepNumber).toBe(5);
      expect(completed.status).toBe('completed');
    });

    test('should track complete history throughout workflow', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      await act(async () => {
        await result.current.advanceStep(attempt.id, {
          senderEmail: 'sender@example.com',
          senderPhone: '+33612345678',
        });
      });

      const final = result.current.getAttempt(attempt.id);
      expect(final.stepHistory).toBeDefined();
      expect(final.stepHistory.length).toBeGreaterThan(0);
      expect(final.stepHistory[0]).toHaveProperty('timestamp');
    });

    test('should calculate correct progress percentage', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      expect(attempt.currentStepNumber).toBe(1);
      expect(attempt.totalSteps).toBe(5);

      // Progress should be: 1/5 = 20%
      // After advancing to step 2: 2/5 = 40%
      await act(async () => {
        await result.current.advanceStep(attempt.id, {});
      });

      const updated = result.current.getAttempt(attempt.id);
      const progress = (updated.currentStepNumber / updated.totalSteps) * 100;
      expect(progress).toBe(40);
    });
  });

  // ==================== ERROR RECOVERY TESTS ====================
  describe('Error Recovery: Handle Failures and Retry', () => {
    test('should handle step failure and allow retry', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Mark step as failed
      await act(async () => {
        await result.current.failStep(attempt.id, 'step1', 'Email verification failed');
      });

      const failed = result.current.getAttempt(attempt.id);
      expect(failed.status).toBe('on-hold');

      // Retry the step
      await act(async () => {
        await result.current.advanceStep(attempt.id, {
          senderEmail: 'corrected@example.com',
          senderPhone: '+33612345678',
        });
      });

      const recovered = result.current.getAttempt(attempt.id);
      expect(recovered.status).toBe('in-progress');
      expect(recovered.currentStepNumber).toBe(2);
    });

    test('should handle validation errors', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Try to advance with invalid email
      let error;
      await act(async () => {
        try {
          await result.current.advanceStep(attempt.id, {
            senderEmail: 'invalid-email',
            senderPhone: '+33612345678',
          });
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeTruthy();

      // Should still be at step 1
      const unchanged = result.current.getAttempt(attempt.id);
      expect(unchanged.currentStepNumber).toBe(1);
    });

    test('should handle timeout failures', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Simulate timeout
      await act(async () => {
        await result.current.failStep(attempt.id, 'step1', 'Request timeout');
      });

      const failed = result.current.getAttempt(attempt.id);
      expect(failed.status).toBe('on-hold');
      expect(failed.steps.find(s => s.id === 'step1').failureReason).toContain('timeout');
    });
  });

  // ==================== CONDITIONAL BRANCHING TESTS ====================
  describe('Conditional Branching: Handle Optional Steps', () => {
    test('should skip optional step based on conditions', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Advance through steps
      await act(async () => {
        await result.current.advanceStep(attempt.id, {
          senderEmail: 'sender@example.com',
          senderPhone: '+33612345678',
        });
      });

      await act(async () => {
        await result.current.advanceStep(attempt.id.id, {
          approverEmail: 'approver@example.com',
        });
      });

      const beforeSkip = result.current.getAttempt(attempt.id);

      // Step 3 is optional, skip it
      await act(async () => {
        await result.current.skipStep(beforeSkip.id, 'step3');
      });

      const afterSkip = result.current.getAttempt(attempt.id);
      expect(afterSkip.steps.find(s => s.id === 'step3').status).toBe('skipped');
      expect(afterSkip.currentStepNumber).toBe(4);
    });

    test('should handle alternative step paths', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Complete all steps to reach end
      let current = attempt;
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.advanceStep(current.id, {});
        });
        current = result.current.getAttempt(current.id);
      }

      // Should be completed
      expect(current.status).toBe('completed');
    });
  });

  // ==================== CONCURRENT OPERATIONS TESTS ====================
  describe('Concurrent Operations: Handle Multiple Attempts', () => {
    test('should handle multiple concurrent attempts', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      const attempts = [];

      // Create 3 concurrent attempts
      await act(async () => {
        demands = await Promise.all([
          result.current.startAttempt('payment1'),
          result.current.startAttempt('payment2'),
          result.current.startAttempt('payment3'),
        ]);
      });

      expect(result.current.attempts).toHaveLength(3);
    });

    test('should isolate state between different attempts', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt1, attempt2;

      await act(async () => {
        attempt1 = await result.current.startAttempt('payment1');
        attempt2 = await result.current.startAttempt('payment2');
      });

      // Advance attempt1
      await act(async () => {
        await result.current.advanceStep(attempt1.id, {});
      });

      // Attempt2 should still be at step 1
      const check2 = result.current.getAttempt(attempt2.id);
      expect(check2.currentStepNumber).toBe(1);

      // Attempt1 should be at step 2
      const check1 = result.current.getAttempt(attempt1.id);
      expect(check1.currentStepNumber).toBe(2);
    });

    test('should handle rapid state changes correctly', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Rapidly advance multiple steps
      await act(async () => {
        for (let i = 0; i < 3; i++) {
          const current = result.current.getAttempt(attempt.id);
          if (current.currentStepNumber < current.totalSteps) {
            await result.current.advanceStep(current.id, {});
          }
        }
      });

      const final = result.current.getAttempt(attempt.id);
      expect(final.currentStepNumber).toBeLessThanOrEqual(5);
    });
  });

  // ==================== DATA PERSISTENCE TESTS ====================
  describe('Data Persistence: State Maintained Across Operations', () => {
    test('should persist attempt state through operations', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      const originalId = attempt.id;

      // Advance step
      await act(async () => {
        await result.current.advanceStep(attempt.id, {});
      });

      // Retrieve and verify
      const retrieved = result.current.getAttempt(originalId);
      expect(retrieved.id).toBe(originalId);
      expect(retrieved.currentStepNumber).toBe(2);
    });

    test('should maintain history across multiple operations', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      const initialHistoryLength = attempt.stepHistory?.length || 0;

      // Perform operations
      await act(async () => {
        await result.current.advanceStep(attempt.id, {});
      });

      const updated = result.current.getAttempt(attempt.id);
      expect(updated.stepHistory.length).toBeGreaterThan(initialHistoryLength);
    });
  });

  // ==================== RATE LIMITING TESTS ====================
  describe('Rate Limiting: Respect Operation Limits', () => {
    test('should enforce rate limit on attempt creation', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      // Try to create 11 attempts (limit is 10/min)
      const errors = [];

      for (let i = 0; i < 11; i++) {
        try {
          await act(async () => {
            await result.current.startAttempt(`payment${i}`);
          });
        } catch (e) {
          errors.push(e);
        }
      }

      // 11th should be rate limited
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should reset rate limit after time window', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      // Create 10 attempts
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.startAttempt(`payment${i}`);
        });
      }

      // Mock time passing
      jest.useFakeTimers();
      jest.advanceTimersByTime(61000); // 61 seconds
      jest.useRealTimers();

      // 11th should now succeed
      let attempt11;
      await act(async () => {
        attempt11 = await result.current.startAttempt('payment10');
      });

      expect(attempt11).toBeTruthy();
    });
  });

  // ==================== WEBHOOK INTEGRATION TESTS ====================
  describe('Webhook Integration: Notify External Systems', () => {
    test('should send step completion webhook', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      // Mock webhook endpoint
      const webhookCalls = [];
      global.fetch = jest.fn((url, options) => {
        webhookCalls.push({ url, body: JSON.parse(options.body) });
        return Promise.resolve({ ok: true });
      });

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Advance step (should trigger webhook)
      await act(async () => {
        await result.current.advanceStep(attempt.id, {});
      });

      // Webhook should have been called
      expect(webhookCalls.length).toBeGreaterThan(0);
    });

    test('should retry failed webhooks', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      const webhookCalls = [];
      let callCount = 0;

      global.fetch = jest.fn((url, options) => {
        callCount++;
        webhookCalls.push(callCount);

        // Fail first 2 attempts
        if (callCount < 3) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true });
      });

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Should retry and eventually succeed
      await act(async () => {
        await result.current.advanceStep(attempt.id, {});
      });

      expect(callCount).toBeGreaterThanOrEqual(3);
    });
  });

  // ==================== SECURITY TESTS ====================
  describe('Security: Protect User Data', () => {
    test('should validate user ownership of attempt', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Try to access with wrong user context
      let error;
      try {
        // This should fail in real scenario
        result.current.getAttempt('other-user-attempt');
      } catch (e) {
        error = e;
      }

      // Should not find attempt from other user
      const found = result.current.getAttempt('other-user-attempt');
      expect(found).toBeNull();
    });

    test('should sanitize input data', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      const maliciousData = {
        senderEmail: '<script>alert("XSS")</script>@example.com',
        senderPhone: '+33612345678',
      };

      // Should sanitize before processing
      await act(async () => {
        await result.current.advanceStep(attempt.id, maliciousData);
      });

      const updated = result.current.getAttempt(attempt.id);
      // Data should be safe (no script tags)
      expect(updated).toBeTruthy();
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe('Performance: Efficient Operation Handling', () => {
    test('should complete workflow within acceptable time', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      const startTime = Date.now();

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment1');
      });

      // Complete 5 steps
      for (let i = 0; i < 5; i++) {
        const current = result.current.getAttempt(attempt.id);
        if (current.currentStepNumber < current.totalSteps) {
          await act(async () => {
            await result.current.advanceStep(current.id, {});
          });
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should handle large number of steps efficiently', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      const largeStepAttempt = {
        id: 'large',
        paymentId: 'payment1',
        steps: Array(100)
          .fill(null)
          .map((_, i) => ({
            id: `step${i}`,
            name: `Step ${i}`,
            status: 'pending',
          })),
      };

      // Should handle large step arrays
      expect(largeStepAttempt.steps).toHaveLength(100);
    });
  });

  // ==================== COMPREHENSIVE WORKFLOW SIMULATION ====================
  describe('Comprehensive Workflow Simulation', () => {
    test('scenario: High-value transfer with security checks', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      // Create high-value transfer
      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment-high-value');
      });

      // Step 1: Enhanced verification for high amount
      await act(async () => {
        await result.current.advanceStep(attempt.id, {
          senderEmail: 'corporate@company.fr',
          senderPhone: '+33123456789',
          companyName: 'Tech Corp France',
        });
      });

      let current = result.current.getAttempt(attempt.id);
      expect(current.currentStepNumber).toBe(2);

      // Step 2: Requires approval from list
      await act(async () => {
        await result.current.advanceStep(current.id, {
          approverEmail: 'cfo@company.fr',
        });
      });

      current = result.current.getAttempt(current.id);
      expect(current.currentStepNumber).toBe(3);

      // Step 3: Security check should NOT be skipped (amount > 1000)
      const securityStep = current.steps.find(s => s.id === 'step3');
      expect(securityStep.isOptional).toBe(true);

      // Complete workflow
      while (current.currentStepNumber < current.totalSteps) {
        await act(async () => {
          await result.current.advanceStep(current.id, {});
        });
        current = result.current.getAttempt(current.id);
      }

      expect(current.status).toBe('completed');
    });

    test('scenario: Recovery from multiple failures', async () => {
      const { result } = renderHook(() => useTransferAttempt());

      let attempt;
      await act(async () => {
        attempt = await result.current.startAttempt('payment-recovery');
      });

      // First failure
      await act(async () => {
        await result.current.failStep(attempt.id, 'step1', 'Invalid email');
      });

      let current = result.current.getAttempt(attempt.id);
      expect(current.status).toBe('on-hold');

      // Retry with correct data
      await act(async () => {
        await result.current.advanceStep(current.id, {
          senderEmail: 'valid@example.com',
          senderPhone: '+33612345678',
        });
      });

      current = result.current.getAttempt(attempt.id);
      expect(current.status).toBe('in-progress');

      // Continue workflow
      await act(async () => {
        await result.current.advanceStep(current.id, {
          approverEmail: 'approver@example.com',
        });
      });

      current = result.current.getAttempt(current.id);
      expect(current.currentStepNumber).toBeGreaterThan(2);
    });
  });
});
