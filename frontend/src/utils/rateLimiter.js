/**
 * Client-side rate limiter to prevent abuse
 * Tracks requests per endpoint/action
 */

const requestTracking = {};

/**
 * Check if request should be rate limited
 * @param {string} key - Unique identifier (e.g., 'payment-create', 'auth-login')
 * @param {number} maxRequests - Max requests allowed in time window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - true if rate limited, false if allowed
 */
export function isRateLimited(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  
  if (!requestTracking[key]) {
    requestTracking[key] = [];
  }

  // Remove old requests outside the time window
  requestTracking[key] = requestTracking[key].filter(
    timestamp => now - timestamp < windowMs
  );

  // Check if limit exceeded
  if (requestTracking[key].length >= maxRequests) {
    return true;
  }

  // Record this request
  requestTracking[key].push(now);
  return false;
}

/**
 * Get remaining requests in current window
 * @param {string} key - Unique identifier
 * @param {number} maxRequests - Max requests allowed
 * @returns {number} - Remaining requests
 */
export function getRemainingRequests(key, maxRequests = 5) {
  if (!requestTracking[key]) return maxRequests;
  return Math.max(0, maxRequests - requestTracking[key].length);
}

/**
 * Reset rate limiter for a key
 * @param {string} key - Unique identifier
 */
export function resetRateLimiter(key) {
  delete requestTracking[key];
}

/**
 * Rate limit decorator for async functions
 * @param {Function} fn - Function to rate limit
 * @param {string} key - Rate limiter key
 * @param {Object} options - Rate limit options
 * @returns {Function} - Decorated function
 */
export function withRateLimit(fn, key, options = {}) {
  const {
    maxRequests = 5,
    windowMs = 60000,
    errorMessage = 'Trop de requêtes. Veuillez réessayer plus tard.',
  } = options;

  return async function(...args) {
    if (isRateLimited(key, maxRequests, windowMs)) {
      const error = new Error(errorMessage);
      error.code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }

    return fn.apply(this, args);
  };
}
