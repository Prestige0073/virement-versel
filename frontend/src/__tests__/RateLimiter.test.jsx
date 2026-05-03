import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isRateLimited,
  getRemainingRequests,
  resetRateLimiter,
  withRateLimit,
} from '../utils/rateLimiter';

/**
 * Tests for Rate Limiter Utility
 * Covers: Request tracking, limit enforcement, error throwing
 */

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset all rate limiters before each test
    vi.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests below limit', () => {
      const key = 'test-key-1';
      const maxRequests = 5;
      const windowMs = 60000;

      for (let i = 0; i < maxRequests; i++) {
        const limited = isRateLimited(key, maxRequests, windowMs);
        expect(limited).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      const key = 'test-key-2';
      const maxRequests = 3;
      const windowMs = 60000;

      // Make 3 allowed requests
      for (let i = 0; i < maxRequests; i++) {
        isRateLimited(key, maxRequests, windowMs);
      }

      // 4th request should be blocked
      const blocked = isRateLimited(key, maxRequests, windowMs);
      expect(blocked).toBe(true);
    });

    it('should track different keys independently', () => {
      const key1 = 'api-create-1';
      const key2 = 'api-update-1';
      const maxRequests = 2;
      const windowMs = 60000;

      isRateLimited(key1, maxRequests, windowMs);
      isRateLimited(key1, maxRequests, windowMs);

      isRateLimited(key2, maxRequests, windowMs);

      // key1 should be limited, key2 should not
      expect(isRateLimited(key1, maxRequests, windowMs)).toBe(true);
      expect(isRateLimited(key2, maxRequests, windowMs)).toBe(false);
    });
  });

  describe('Request Counting', () => {
    it('should return correct remaining requests', () => {
      const key = 'count-test-1';
      const maxRequests = 5;
      const windowMs = 60000;

      isRateLimited(key, maxRequests, windowMs);
      isRateLimited(key, maxRequests, windowMs);

      const remaining = getRemainingRequests(key, maxRequests);
      expect(remaining).toBe(3); // 5 - 2
    });

    it('should return zero when limit exceeded', () => {
      const key = 'count-test-2';
      const maxRequests = 2;
      const windowMs = 60000;

      isRateLimited(key, maxRequests, windowMs);
      isRateLimited(key, maxRequests, windowMs);
      isRateLimited(key, maxRequests, windowMs);

      const remaining = getRemainingRequests(key, maxRequests);
      expect(remaining).toBe(0);
    });

    it('should return max when no requests made', () => {
      const key = 'count-test-3';
      const maxRequests = 10;

      const remaining = getRemainingRequests(key, maxRequests);
      expect(remaining).toBe(10);
    });
  });

  describe('Rate Limiter Reset', () => {
    it('should reset rate limiter for a key', () => {
      const key = 'reset-test-1';
      const maxRequests = 2;
      const windowMs = 60000;

      // Make 2 requests
      isRateLimited(key, maxRequests, windowMs);
      isRateLimited(key, maxRequests, windowMs);

      // Should be limited
      expect(isRateLimited(key, maxRequests, windowMs)).toBe(true);

      // Reset
      resetRateLimiter(key);

      // Should be allowed again
      expect(isRateLimited(key, maxRequests, windowMs)).toBe(false);
    });
  });

  describe('Decorator Function', () => {
    it('should block decorated function when rate limited', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const key = 'decorator-test-1';
      const rateLimitedFn = withRateLimit(mockFn, key, {
        maxRequests: 1,
        windowMs: 60000,
        errorMessage: 'Too many requests',
      });

      // First call should succeed
      const result1 = await rateLimitedFn();
      expect(result1).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Second call should throw
      await expect(rateLimitedFn()).rejects.toThrow('Too many requests');
      expect(mockFn).toHaveBeenCalledTimes(1); // Still 1, not called
    });

    it('should throw custom error message', async () => {
      const mockFn = vi.fn().mockResolvedValue('ok');
      const customMessage = 'Custom rate limit message';
      const rateLimitedFn = withRateLimit(mockFn, 'decorator-test-2', {
        maxRequests: 0,
        errorMessage: customMessage,
      });

      await expect(rateLimitedFn()).rejects.toThrow(customMessage);
    });

    it('should set rate_limit error code', async () => {
      const mockFn = vi.fn().mockResolvedValue('ok');
      const rateLimitedFn = withRateLimit(mockFn, 'decorator-test-3', {
        maxRequests: 0,
      });

      try {
        await rateLimitedFn();
      } catch (error) {
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });

    it('should execute function normally if not rate limited', async () => {
      const mockFn = vi.fn().mockResolvedValue('test-result');
      const rateLimitedFn = withRateLimit(mockFn, 'decorator-test-4', {
        maxRequests: 10,
      });

      const result = await rateLimitedFn('arg1', 'arg2');
      expect(result).toBe('test-result');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('Time Window Expiration', () => {
    it('should not reset requests outside time window', (done) => {
      const key = 'time-test-1';
      const maxRequests = 2;
      const windowMs = 100; // 100ms window

      isRateLimited(key, maxRequests, windowMs);
      isRateLimited(key, maxRequests, windowMs);

      // Should be limited
      expect(isRateLimited(key, maxRequests, windowMs)).toBe(true);

      // Wait for window to expire
      setTimeout(() => {
        // After window expires, should be allowed again
        expect(isRateLimited(key, maxRequests, windowMs)).toBe(false);
        done();
      }, windowMs + 50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle max requests = 0', () => {
      const key = 'edge-case-1';
      expect(isRateLimited(key, 0, 60000)).toBe(true);
    });

    it('should handle max requests = 1', () => {
      const key = 'edge-case-2';
      expect(isRateLimited(key, 1, 60000)).toBe(false);
      expect(isRateLimited(key, 1, 60000)).toBe(true);
    });

    it('should handle very large window', () => {
      const key = 'edge-case-3';
      const largeWindow = 86400000; // 24 hours in ms

      expect(isRateLimited(key, 1000, largeWindow)).toBe(false);
    });
  });
});
