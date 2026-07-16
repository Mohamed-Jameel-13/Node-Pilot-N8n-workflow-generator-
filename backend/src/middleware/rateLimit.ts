/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DoS attacks
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    const entry = store[key];
    if (entry && entry.resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  message?: string;  // Custom error message
}

/**
 * Creates a rate limit middleware
 * @param options Configuration for rate limiting
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later' } = options;

  return async (c: any, next: any) => {
    // Get identifier (prefer user ID, fallback to IP)
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    
    let identifier = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    
    // If authenticated, use user as identifier for better tracking
    if (token) {
      try {
        const { supabaseAdmin } = await import('../utils/supabase.js');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          identifier = `user_${user.id}`;
        }
      } catch (err) {
        // Fall back to IP if auth check fails
      }
    }

    const key = `${c.req.path}_${identifier}`;
    const now = Date.now();

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    // Increment counter
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > max) {
      const resetIn = Math.ceil((store[key].resetTime - now) / 1000);
      return c.json({
        error: message,
        retryAfter: resetIn
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
