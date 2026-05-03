/**
 * Webhook Queue Persistence Manager
 * Stores webhook calls in database with retry logic
 * 
 * Features:
 * - Persistent queue in PostgreSQL
 * - Exponential backoff retry strategy (5s, 25s, 125s)
 * - Automatic retry on failure
 * - Webhook status tracking
 * - Failed webhook dead-letter handling
 */

import { createClient } from 'redis';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class WebhookQueueManager {
  constructor(db) {
    this.db = db; // PostgreSQL database connection
    this.redisClient = null;
    this.processingInterval = null;
    this.maxRetries = 3;
    this.retryDelays = [5000, 25000, 125000]; // 5s, 25s, 125s
    this.timeout = 10000; // 10 second timeout per webhook call
  }

  /**
   * Initialize Redis for queue processing
   */
  async initialize() {
    try {
      this.redisClient = createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
      });

      await this.redisClient.connect();
      console.log('✓ Webhook queue manager initialized');

      // Start queue processor
      this.startProcessor();
    } catch (error) {
      console.error('✗ Failed to initialize webhook queue:', error.message);
      throw error;
    }
  }

  /**
   * Enqueue a webhook call
   */
  async enqueueWebhook(attemptId, url, event, payload) {
    try {
      // Insert into database
      const result = await this.db.query(
        `INSERT INTO webhook_queue (attempt_id, url, event, payload, status, retry_count, next_retry)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, created_at`,
        [
          attemptId,
          url,
          event,
          JSON.stringify(payload),
          'pending',
          0,
          new Date(),
        ]
      );

      const webhookId = result.rows[0].id;

      // Add to Redis processing queue
      await this.redisClient.rPush('webhook:queue', webhookId.toString());

      console.log(`📮 Webhook queued: ${webhookId} → ${url}`);

      return {
        success: true,
        webhookId,
        status: 'pending',
      };
    } catch (error) {
      console.error('✗ Error enqueuing webhook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process webhook queue
   */
  async processQueue() {
    try {
      // Get pending webhooks from database
      const pending = await this.db.query(
        `SELECT * FROM webhook_queue
         WHERE status = 'pending' OR (status = 'retrying' AND next_retry <= NOW())
         ORDER BY created_at ASC
         LIMIT 50`
      );

      for (const webhook of pending.rows) {
        await this.processWebhook(webhook);
      }
    } catch (error) {
      console.error('✗ Error processing queue:', error);
    }
  }

  /**
   * Process single webhook
   */
  async processWebhook(webhook) {
    try {
      const { id, url, event, payload, retry_count, attempt_id } = webhook;

      console.log(`🚀 Processing webhook ${id}: ${event}`);

      // Call webhook
      const response = await axios.post(url, JSON.parse(payload), {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.generateSignature(payload),
          'X-Webhook-Event': event,
          'X-Attempt-ID': attempt_id,
        },
      });

      // Success
      await this.db.query(
        `UPDATE webhook_queue SET status = $1, response = $2, completed_at = NOW()
         WHERE id = $3`,
        ['delivered', JSON.stringify(response.data), id]
      );

      console.log(`✓ Webhook ${id} delivered successfully`);

      // Remove from processing queue
      await this.redisClient.lRem('webhook:queue', 0, id.toString());

      return { success: true };
    } catch (error) {
      console.error(`✗ Webhook ${webhook.id} failed:`, error.message);

      // Handle retry
      await this.handleWebhookRetry(webhook);

      return { success: false, error: error.message };
    }
  }

  /**
   * Handle webhook retry with exponential backoff
   */
  async handleWebhookRetry(webhook) {
    const { id, retry_count } = webhook;

    if (retry_count >= this.maxRetries) {
      // Max retries exceeded - move to dead letter
      await this.db.query(
        `UPDATE webhook_queue SET status = $1, failed_at = NOW()
         WHERE id = $2`,
        ['failed', id]
      );

      console.log(`💀 Webhook ${id} moved to dead letter (max retries exceeded)`);
      return;
    }

    // Schedule next retry
    const delayMs = this.retryDelays[retry_count];
    const nextRetry = new Date(Date.now() + delayMs);

    await this.db.query(
      `UPDATE webhook_queue 
       SET status = $1, retry_count = $2, next_retry = $3, last_error = $4
       WHERE id = $5`,
      ['retrying', retry_count + 1, nextRetry, 'HTTP error', id]
    );

    console.log(
      `⏱️  Webhook ${id} scheduled for retry ${retry_count + 1} in ${delayMs / 1000}s`
    );
  }

  /**
   * Generate webhook signature for verification
   */
  generateSignature(payload) {
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET || 'webhook-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Start queue processor (runs every 5 seconds)
   */
  startProcessor() {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 5000);

    console.log('✓ Webhook queue processor started');
  }

  /**
   * Get webhook status
   */
  async getWebhookStatus(webhookId) {
    try {
      const result = await this.db.query(
        `SELECT * FROM webhook_queue WHERE id = $1`,
        [webhookId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('✗ Error getting webhook status:', error);
      return null;
    }
  }

  /**
   * Get attempt webhooks
   */
  async getAttemptWebhooks(attemptId) {
    try {
      const result = await this.db.query(
        `SELECT * FROM webhook_queue WHERE attempt_id = $1 ORDER BY created_at DESC`,
        [attemptId]
      );

      return result.rows;
    } catch (error) {
      console.error('✗ Error getting attempt webhooks:', error);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const result = await this.db.query(
        `SELECT 
           status,
           COUNT(*) as count,
           AVG(retry_count) as avg_retries
         FROM webhook_queue
         GROUP BY status`
      );

      const stats = {};
      for (const row of result.rows) {
        stats[row.status] = {
          count: parseInt(row.count),
          avgRetries: parseFloat(row.avg_retries),
        };
      }

      return stats;
    } catch (error) {
      console.error('✗ Error getting stats:', error);
      return null;
    }
  }

  /**
   * Replay failed webhooks
   */
  async replayFailed() {
    try {
      const result = await this.db.query(
        `UPDATE webhook_queue 
         SET status = 'pending', retry_count = 0, next_retry = NOW()
         WHERE status = 'failed'
         RETURNING id`
      );

      console.log(`🔄 Replayed ${result.rows.length} failed webhooks`);

      return result.rows.length;
    } catch (error) {
      console.error('✗ Error replaying failed webhooks:', error);
      return 0;
    }
  }

  /**
   * Cleanup old completed webhooks (older than 30 days)
   */
  async cleanupOld() {
    try {
      const result = await this.db.query(
        `DELETE FROM webhook_queue 
         WHERE status = 'delivered' AND completed_at < NOW() - INTERVAL '30 days'`
      );

      console.log(`🗑️  Cleaned up ${result.rowCount} old webhooks`);

      return result.rowCount;
    } catch (error) {
      console.error('✗ Error cleaning up old webhooks:', error);
      return 0;
    }
  }

  /**
   * Shutdown
   */
  async shutdown() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    console.log('✓ Webhook queue manager shutdown');
  }
}

export default WebhookQueueManager;
