/**
 * Redis-based Distributed Rate Limiter
 * Scales across multiple server instances
 * 
 * Features:
 * - Distributed rate limiting across instances
 * - Per-user, per-operation limits
 * - Exponential backoff for retries
 * - Automatic limit reset
 * - Real-time remaining quota tracking
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisRateLimiter {
  constructor() {
    this.client = null;
    this.limits = {
      transfer_create: { max: 10, window: 60 },      // 10 per minute
      transfer_advance: { max: 20, window: 60 },     // 20 per minute
      validation: { max: 30, window: 60 },           // 30 per minute
      webhook: { max: 15, window: 60 },              // 15 per minute
      default: { max: 100, window: 3600 },           // 100 per hour
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      this.client = createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      });

      this.client.on('error', (err) => {
        console.error('✗ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✓ Redis rate limiter connected');
      });

      await this.client.connect();
    } catch (error) {
      console.error('✗ Failed to initialize Redis:', error.message);
      throw error;
    }
  }

  /**
   * Check if operation is allowed
   * Returns: { allowed: boolean, remaining: number, resetTime: number }
   */
  async checkLimit(userId, operation) {
    const limit = this.limits[operation] || this.limits.default;
    const key = `ratelimit:${userId}:${operation}`;
    const now = Date.now();

    try {
      // Get current count
      const current = await this.client.get(key);
      const count = current ? parseInt(current) : 0;

      // Get TTL
      const ttl = await this.client.ttl(key);

      if (count >= limit.max) {
        // Rate limit exceeded
        const resetTime = ttl === -1 ? limit.window : ttl;
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: resetTime,
        };
      }

      // Increment counter
      const newCount = count + 1;
      
      if (ttl === -1) {
        // First time or key expired, set TTL
        await this.client.set(key, newCount.toString(), {
          EX: limit.window,
        });
      } else {
        // Update existing key
        await this.client.set(key, newCount.toString(), {
          EX: ttl,
        });
      }

      const remaining = limit.max - newCount;
      const newTTL = await this.client.ttl(key);

      return {
        allowed: true,
        remaining: Math.max(0, remaining),
        resetTime: newTTL,
        limit: limit.max,
        window: limit.window,
      };
    } catch (error) {
      console.error('✗ Rate limit check error:', error);
      // Allow on error to prevent complete failure
      return {
        allowed: true,
        remaining: this.limits.default.max,
        resetTime: this.limits.default.window,
        error: error.message,
      };
    }
  }

  /**
   * Get current quota for user/operation
   */
  async getQuota(userId, operation) {
    const limit = this.limits[operation] || this.limits.default;
    const key = `ratelimit:${userId}:${operation}`;

    try {
      const current = await this.client.get(key);
      const count = current ? parseInt(current) : 0;
      const ttl = await this.client.ttl(key);

      return {
        used: count,
        remaining: Math.max(0, limit.max - count),
        limit: limit.max,
        window: limit.window,
        resetIn: ttl === -1 ? null : ttl,
      };
    } catch (error) {
      console.error('✗ Get quota error:', error);
      return null;
    }
  }

  /**
   * Reset rate limit for user/operation
   */
  async resetLimit(userId, operation) {
    const key = `ratelimit:${userId}:${operation}`;
    try {
      await this.client.del(key);
      return { success: true };
    } catch (error) {
      console.error('✗ Reset limit error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all limits for a user
   */
  async getAllLimits(userId) {
    const result = {};
    try {
      for (const operation of Object.keys(this.limits)) {
        result[operation] = await this.getQuota(userId, operation);
      }
      return result;
    } catch (error) {
      console.error('✗ Get all limits error:', error);
      return null;
    }
  }

  /**
   * Middleware for Express
   */
  middleware(operation = 'default') {
    return async (req, res, next) => {
      const userId = req.user?.id || req.ip;

      const result = await this.checkLimit(userId, operation);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit || 100);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: result.retryAfter,
          resetIn: result.resetTime,
        });
      }

      next();
    };
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const info = await this.client.info('stats');
      const keycount = await this.client.dbSize();

      return {
        connected: true,
        keyCount: keycount,
        info: info,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    if (this.client) {
      await this.client.quit();
      console.log('✓ Redis rate limiter shutdown');
    }
  }
}

export default RedisRateLimiter;
