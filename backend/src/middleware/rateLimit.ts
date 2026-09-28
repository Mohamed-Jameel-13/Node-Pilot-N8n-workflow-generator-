/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DoS attacks
 */

interface ClientRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  message?: string;  // Custom error message
}

/**
 * Creates a memory-bounded rate limit middleware with FIFO eviction
 * @param options Configuration for rate limiting
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later' } = options;
  const store = new Map<string, ClientRecord>();
  const MAX_ENTRIES = 10000;

  return async (c: any, next: any) => {
    // Get identifier (prefer user token/id, fallback to IP)
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || 'unknown';

    let identifier = `ip_${ip}`;
    if (token) {
      // Use token suffix or hash to avoid async overhead on every request
      identifier = `tok_${token.slice(-16)}`;
    }

    const key = `${c.req.path}:${identifier}`;
    const now = Date.now();

    let record = store.get(key);

    // Initialize or reset if window has passed
    if (!record || record.resetTime < now) {
      if (store.size >= MAX_ENTRIES) {
        // Evict oldest entry to prevent memory exhaustion
        const oldestKey = store.keys().next().value;
        if (oldestKey) store.delete(oldestKey);
      }
      store.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // Increment counter
    record.count++;

    // Check if limit exceeded
    if (record.count > max) {
      const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
      c.header('Retry-After', String(resetInSeconds));
      return c.json({
        error: message,
        retryAfter: resetInSeconds
      }, 429);
    }

    return next();
  };
}

// Pre-configured rate limiters for common use cases

/**
 * Strict rate limiter for AI chat endpoint (expensive operation)
 * 20 requests per 15 minutes
 */
export const aiChatLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'AI chat rate limit exceeded. Please wait before sending more messages.'
});

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes  
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded. Please try again later.'
});

/**
 * Lenient rate limiter for read operations
 * 300 requests per 15 minutes
 */
export const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please slow down.'
});

/**
 * Auth rate limiter for login/signup
 * 5 attempts per 15 minutes
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again later.'
});
