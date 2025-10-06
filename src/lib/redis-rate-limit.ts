/**
 * Distributed Rate Limiting with Upstash Redis
 * Provides persistent, distributed rate limiting across multiple server instances
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (only if credentials are available)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Rate limit configurations for different endpoints
 *
 * TIERED SYSTEM:
 * - Unauthenticated requests: Stricter limits (IP-based)
 * - Authenticated requests: More generous limits (user-ID-based)
 */

// === UNAUTHENTICATED (IP-based) - Strict limits ===

// Auth endpoints - 5 requests per 15 minutes (IP-based)
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:auth',
    })
  : null;

// API endpoints - 100 requests per 15 minutes (IP-based)
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:api',
    })
  : null;

// Public ministry endpoints - 60 requests per minute (IP-based, always)
export const publicRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:public',
    })
  : null;

// Upload endpoints - 10 requests per hour (IP-based)
export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit:upload',
    })
  : null;

// === AUTHENTICATED (user-ID-based) - Generous limits ===

// Auth endpoints - 10 requests per 15 minutes (user-based, 2x IP limit)
export const authRateLimitAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:auth:user',
    })
  : null;

// API endpoints - 300 requests per 15 minutes (user-based, 3x IP limit)
export const apiRateLimitAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:api:user',
    })
  : null;

// Upload endpoints - 50 requests per hour (user-based, 5x IP limit)
export const uploadRateLimitAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit:upload:user',
    })
  : null;

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (Vercel/Cloudflare)
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');
  const cfConnectingIP = headers.get('cf-connecting-ip');

  const ip = cfConnectingIP || forwarded?.split(',')[0] || realIP || 'unknown';

  return ip;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  limiter: typeof authRateLimit | typeof apiRateLimit | typeof publicRateLimit | typeof uploadRateLimit
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  error?: string;
}> {
  // If Redis is not configured, fall back to allowing all requests
  // (In-memory fallback can be added if needed)
  if (!limiter) {
    console.warn('[Rate Limit] Redis not configured, allowing request');
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000,
      error: 'Redis not configured'
    };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset: reset * 1000, // Convert to milliseconds
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);

    // On error, allow the request but log the error
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Rate limit information to be added to response headers
 */
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

/**
 * Middleware helper to check rate limit and return proper response
 * Returns rate limit info for successful requests to add headers
 */
export async function rateLimit(
  request: Request,
  limiter: typeof authRateLimit | typeof apiRateLimit | typeof publicRateLimit | typeof uploadRateLimit
): Promise<{ response: Response | null; rateLimitInfo: RateLimitInfo }> {
  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, limiter);

  const rateLimitInfo: RateLimitInfo = {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset
  };

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return {
      response: new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
          limit: result.limit,
          remaining: result.remaining,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
      rateLimitInfo
    };
  }

  return { response: null, rateLimitInfo }; // No rate limit hit, proceed with request
}

/**
 * Check if Redis is properly configured
 */
export function isRedisConfigured(): boolean {
  return redis !== null;
}

/**
 * TIERED RATE LIMITING: Automatically choose between IP-based and user-based rate limiting
 *
 * This function checks if the request is authenticated and applies appropriate limits:
 * - Authenticated users: More generous limits, keyed by user ID
 * - Unauthenticated requests: Stricter limits, keyed by IP address
 *
 * @param request - The incoming request
 * @param unauthLimiter - Rate limiter for unauthenticated requests (IP-based)
 * @param authLimiter - Rate limiter for authenticated requests (user-based)
 * @returns Rate limit response (429) if exceeded, null otherwise. Also returns user info if available.
 */
export async function rateLimitWithAuth(
  request: Request,
  unauthLimiter: typeof authRateLimit | typeof apiRateLimit | typeof uploadRateLimit,
  authLimiter?: typeof authRateLimitAuthenticated | typeof apiRateLimitAuthenticated | typeof uploadRateLimitAuthenticated
): Promise<{
  response: Response | null
  user?: { id: string; email?: string }
  isAuthenticated: boolean
  rateLimitInfo: RateLimitInfo
}> {
  // Try to get authenticated user from Supabase
  // Note: We use dynamic import to avoid circular dependencies
  let user: { id: string; email?: string } | null = null
  let isAuthenticated = false

  try {
    // Import Supabase client dynamically
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser?.id) {
      user = {
        id: authUser.id,
        email: authUser.email
      }
      isAuthenticated = true
    }
  } catch (error) {
    console.warn('[Rate Limit] Failed to get user auth status:', error)
    // Fall back to IP-based rate limiting
  }

  // Choose limiter and identifier based on authentication status
  let limiter: typeof authRateLimit | typeof apiRateLimit | typeof uploadRateLimit | typeof authRateLimitAuthenticated | typeof apiRateLimitAuthenticated | typeof uploadRateLimitAuthenticated
  let identifier: string

  if (isAuthenticated && authLimiter && user) {
    // Authenticated: Use user-based rate limiting
    limiter = authLimiter
    identifier = user.id
    console.log(`[Rate Limit] Authenticated user: ${user.email} (ID: ${user.id})`)
  } else {
    // Unauthenticated: Use IP-based rate limiting
    limiter = unauthLimiter
    identifier = getClientIdentifier(request)
    console.log(`[Rate Limit] Unauthenticated request from IP: ${identifier}`)
  }

  // Check rate limit
  const result = await checkRateLimit(identifier, limiter)

  const rateLimitInfo: RateLimitInfo = {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset
  }

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return {
      response: new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: isAuthenticated
            ? 'You have exceeded your rate limit. Please try again later.'
            : 'Rate limit exceeded for your IP address. Sign in for higher limits.',
          retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          authenticated: isAuthenticated,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
      user: user || undefined,
      isAuthenticated,
      rateLimitInfo
    }
  }

  // Rate limit not exceeded
  return {
    response: null,
    user: user || undefined,
    isAuthenticated,
    rateLimitInfo
  }
}
