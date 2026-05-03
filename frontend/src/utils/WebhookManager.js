/**
 * WebhookManager
 * 
 * Manages webhook execution for transfer steps:
 * - Send webhook notifications
 * - Handle webhook responses
 * - Retry failed webhooks
 * - Log webhook activity
 * 
 * Webhook types:
 * - step_started: Notifies external service that step began
 * - step_completed: Notifies external service that step completed
 * - step_failed: Notifies external service that step failed
 * - verification_needed: Requests external verification
 * - approval_needed: Requests external approval
 */

import { sanitizeString } from '../utils/sanitizer';

export class WebhookManager {
  /**
   * Send webhook to external service
   * 
   * @param {Object} webhook - Webhook configuration
   * @param {Object} data - Data to send to webhook
   * @returns {Promise<Object>} Webhook result
   */
  static async sendWebhook(webhook, data) {
    if (!webhook || !webhook.url) {
      return {
        success: false,
        error: 'Webhook URL is required',
        status_code: null,
      };
    }

    try {
      // Validate webhook configuration
      const validationErrors = this._validateWebhook(webhook);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors[0],
          status_code: null,
        };
      }

      // Prepare webhook payload
      const payload = this._buildPayload(webhook, data);

      // Send webhook with retry logic
      const response = await this._sendWithRetry(
        webhook.url,
        payload,
        webhook.headers || {},
        webhook.timeout || 5000,
        webhook.retry_count || 3
      );

      return {
        success: response.success,
        status_code: response.status,
        response_time_ms: response.responseTime,
        error: response.error || null,
      };
    } catch (err) {
      return {
        success: false,
        error: sanitizeString(err.message),
        status_code: null,
      };
    }
  }

  /**
   * Validate webhook configuration
   * 
   * @private
   */
  static _validateWebhook(webhook) {
    const errors = [];

    if (!webhook.url) {
      errors.push('Webhook URL is required');
    } else if (!this._isValidUrl(webhook.url)) {
      errors.push('Invalid webhook URL format');
    }

    if (webhook.event_type && !this._isValidEventType(webhook.event_type)) {
      errors.push(`Invalid event type: ${webhook.event_type}`);
    }

    return errors;
  }

  /**
   * Check if URL is valid
   * 
   * @private
   */
  static _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if event type is valid
   * 
   * @private
   */
  static _isValidEventType(eventType) {
    const validTypes = [
      'step_started',
      'step_completed',
      'step_failed',
      'verification_needed',
      'approval_needed',
      'transfer_completed',
      'transfer_failed',
    ];

    return validTypes.includes(eventType);
  }

  /**
   * Build webhook payload
   * 
   * @private
   */
  static _buildPayload(webhook, data) {
    const now = new Date().toISOString();
    const timestamp = Math.floor(Date.now() / 1000);

    const payload = {
      event: webhook.event_type || 'transfer_event',
      timestamp: now,
      timestamp_unix: timestamp,
      data: {
        attempt_id: sanitizeString(data.attempt_id || ''),
        transfer_id: sanitizeString(data.transfer_id || ''),
        step_id: sanitizeString(data.step_id || ''),
        step_name: sanitizeString(data.step_name || ''),
        step_type: sanitizeString(data.step_type || ''),
        status: sanitizeString(data.status || ''),
        amount: data.amount || 0,
        currency: sanitizeString(data.currency || ''),
        message: sanitizeString(data.message || ''),
      },
    };

    // Add additional data if provided
    if (data.error) {
      payload.data.error = {
        code: sanitizeString(data.error.code || ''),
        message: sanitizeString(data.error.message || ''),
      };
    }

    // Sign payload if secret is provided
    if (webhook.secret) {
      payload.signature = this._generateSignature(JSON.stringify(payload), webhook.secret);
    }

    return payload;
  }

  /**
   * Generate HMAC signature for webhook (for verification)
   * 
   * @private
   */
  static _generateSignature(payload, secret) {
    // In real implementation, use crypto library
    // For now, return placeholder that indicates signature would be here
    return `sha256_${Date.now()}`;
  }

  /**
   * Send webhook with retry logic
   * 
   * @private
   */
  static async _sendWithRetry(url, payload, headers = {}, timeout = 5000, maxRetries = 3) {
    let lastError = null;
    let lastStatus = null;
    let responseTime = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TransferStep-Webhook/1.0',
            ...headers,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeout),
        });

        responseTime = Date.now() - startTime;
        lastStatus = response.status;

        if (response.ok) {
          return {
            success: true,
            status: response.status,
            responseTime,
            error: null,
          };
        }

        // 4xx errors: don't retry
        if (response.status < 500) {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          break;
        }

        // 5xx errors: retry
        lastError = `HTTP ${response.status}: ${response.statusText}`;

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          await this._delay(Math.pow(2, attempt - 1) * 100);
        }
      } catch (err) {
        lastError = sanitizeString(err.message);

        if (attempt < maxRetries) {
          await this._delay(Math.pow(2, attempt - 1) * 100);
        }
      }
    }

    return {
      success: false,
      status: lastStatus,
      responseTime,
      error: lastError || 'Webhook delivery failed',
    };
  }

  /**
   * Helper: delay execution
   * 
   * @private
   */
  static _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate webhook log entry
   * 
   * @param {Object} webhook - Webhook config
   * @param {Object} data - Data sent
   * @param {Object} result - Webhook result
   * @returns {Object} Log entry
   */
  static generateLogEntry(webhook, data, result) {
    return {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      webhook_url: webhook.url,
      event_type: webhook.event_type,
      status: result.success ? 'success' : 'failed',
      status_code: result.status_code,
      response_time_ms: result.response_time_ms || 0,
      payload_size_bytes: JSON.stringify(data).length,
      error: result.error || null,
      attempt_id: data.attempt_id,
      transfer_id: data.transfer_id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create webhook configuration object
   * 
   * @param {string} url - Webhook URL
   * @param {Object} options - Additional options
   * @returns {Object} Webhook config
   */
  static createConfig(url, options = {}) {
    return {
      url: sanitizeString(url),
      event_type: options.event_type || 'transfer_event',
      headers: options.headers || {},
      secret: options.secret ? sanitizeString(options.secret) : null,
      timeout: options.timeout || 5000,
      retry_count: Math.min(options.retry_count || 3, 5), // Max 5 retries
      enabled: options.enabled !== false,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Parse webhook URL to get protocol and host
   * 
   * @param {string} url - Webhook URL
   * @returns {Object} Parsed URL info
   */
  static parseUrl(url) {
    try {
      const parsed = new URL(url);
      return {
        valid: true,
        protocol: parsed.protocol,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  /**
   * Batch send webhooks to multiple endpoints
   * 
   * @param {Array} webhooks - Array of webhook configs
   * @param {Object} data - Data to send
   * @returns {Promise<Array>} Results for each webhook
   */
  static async sendBatch(webhooks, data) {
    if (!Array.isArray(webhooks) || webhooks.length === 0) {
      return [];
    }

    const results = await Promise.all(
      webhooks.map(webhook => this.sendWebhook(webhook, data))
    );

    return results;
  }

  /**
   * Build webhook notification for step completion
   * 
   * @param {Object} attempt - Transfer attempt
   * @param {Object} step - Completed step
   * @param {Object} result - Step execution result
   * @returns {Object} Webhook data
   */
  static buildStepCompletionNotification(attempt, step, result) {
    return {
      attempt_id: attempt.id,
      transfer_id: attempt.transfer_id,
      step_id: step.id,
      step_name: step.step_name,
      step_type: step.step_type,
      status: 'completed',
      message: `Étape ${step.step_number}: ${step.step_name} complétée`,
      amount: attempt.transfer_data.amount,
      currency: attempt.transfer_data.currency,
      result: {
        validations_passed: result.validations_passed || true,
        execution_result: result.execution_result || {},
      },
    };
  }

  /**
   * Build webhook notification for step failure
   * 
   * @param {Object} attempt - Transfer attempt
   * @param {Object} step - Failed step
   * @param {Object} error - Error details
   * @returns {Object} Webhook data
   */
  static buildStepFailureNotification(attempt, step, error) {
    return {
      attempt_id: attempt.id,
      transfer_id: attempt.transfer_id,
      step_id: step.id,
      step_name: step.step_name,
      step_type: step.step_type,
      status: 'failed',
      message: `Étape ${step.step_number}: ${step.step_name} échouée`,
      amount: attempt.transfer_data.amount,
      currency: attempt.transfer_data.currency,
      error: {
        code: error.code || 'UNKNOWN',
        message: error.message,
      },
    };
  }
}
