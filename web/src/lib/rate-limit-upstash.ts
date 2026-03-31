/**
 * Upstash-based Rate Limiting with Tiered Access
 *
 * Implements sliding window rate limiting using Upstash Redis.
 * Supports tiered access control for different subscription levels.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Environment variables for Upstash Redis
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface TierLimits {
  postsPerMonth: number;
  requestsPerHour: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    postsPerMonth: 3,
    requestsPerHour: 10,
  },
  pro: {
    postsPerMonth: 30,
    requestsPerHour: 50,
  },
  team: {
    postsPerMonth: -1, // Unlimited
    requestsPerHour: -1, // Unlimited
  },
};

/**
 * Create Upstash Redis connection
 */
function createRedis(): Redis | null {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash credentials not configured, rate limiting will be disabled');
    return null;
  }

  return new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Create rate limiter for a specific limit type
 */
function createRateLimiter(
  prefix: string,
  limit: number,
  window: string
): Ratelimit | null {
  const redis = createRedis();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix,
  });
}

/**
 * Rate limiters for different usage types
 */
const limiters = {
  hourly: (limit: number) => createRateLimiter('hourly', limit, '1h'),
  monthly: (limit: number) => createRateLimiter('monthly', limit, '30d'),
};

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  tier: SubscriptionTier;
}

/**
 * Check rate limit for a user based on their tier
 *
 * @param identifier - User ID or guest identifier
 * @param tier - User's subscription tier
 * @param type - Type of limit to check ('hourly' or 'monthly')
 */
export async function checkRateLimit(
  identifier: string,
  tier: SubscriptionTier,
  type: 'hourly' | 'monthly'
): Promise<RateLimitCheckResult> {
  const limits = TIER_LIMITS[tier];
  const limit = type === 'hourly' ? limits.requestsPerHour : limits.postsPerMonth;

  // Unlimited for team tier
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      resetTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      limit: -1,
      tier,
    };
  }

  const limiter = limiters[type](limit);
  if (!limiter) {
    // Rate limiting disabled, allow all requests
    return {
      allowed: true,
      remaining: limit,
      resetTime: new Date(Date.now() + 3600000),
      limit,
      tier,
    };
  }

  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetTime: new Date(result.reset),
    limit,
    tier,
  };
}

/**
 * Get subscription tier from user profile
 * Defaults to 'free' if not set
 */
export function getDefaultTier(): SubscriptionTier {
  return 'free';
}

/**
 * Format rate limit headers for response
 */
export function formatRateLimitHeaders(result: RateLimitCheckResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Tier': result.tier,
  };

  if (result.limit === -1) {
    headers['X-RateLimit-Limit'] = 'unlimited';
    headers['X-RateLimit-Remaining'] = 'unlimited';
    headers['X-RateLimit-Reset'] = '';
  } else {
    headers['X-RateLimit-Limit'] = String(result.limit);
    headers['X-RateLimit-Remaining'] = String(result.remaining);
    headers['X-RateLimit-Reset'] = result.resetTime.toISOString();
  }

  return headers;
}

/**
 * Create rate limit error response
 */
export interface RateLimitErrorResponse {
  error: string;
  tier: SubscriptionTier;
  limit: number;
  resetTime: string;
  upgradeUrl?: string;
}

export function createRateLimitErrorResponse(
  result: RateLimitCheckResult,
  type: 'hourly' | 'monthly'
): RateLimitErrorResponse {
  const response: RateLimitErrorResponse = {
    error: getRateLimitMessage(result, type),
    tier: result.tier,
    limit: result.limit,
    resetTime: result.resetTime.toISOString(),
  };

  // Add upgrade URL for free tier
  if (result.tier === 'free') {
    response.upgradeUrl = '/pricing';
  }

  return response;
}

/**
 * Get user-friendly rate limit message
 */
function getRateLimitMessage(
  result: RateLimitCheckResult,
  type: 'hourly' | 'monthly'
): string {
  if (result.tier === 'team') {
    return 'Unlimited access';
  }

  if (type === 'monthly') {
    if (result.tier === 'free') {
      return `Free tier limit reached: ${result.limit} posts per month. Upgrade to Pro for ${TIER_LIMITS.pro.postsPerMonth} posts/month.`;
    }
    return `Monthly limit reached: ${result.limit} posts per month. You've used all your posts for this billing period.`;
  }

  const resetMinutes = Math.ceil((result.resetTime.getTime() - Date.now()) / 60000);
  return `Rate limit exceeded. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`;
}

/**
 * Middleware to check rate limits and add headers
 */
export interface RateLimitMiddlewareOptions {
  getUserId: () => string | Promise<string>;
  getTier: () => SubscriptionTier | Promise<SubscriptionTier>;
  type: 'hourly' | 'monthly';
}

export async function withRateLimit<T>(
  options: RateLimitMiddlewareOptions,
  handler: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: RateLimitErrorResponse; headers?: Record<string, string> }> {
  const userId = await options.getUserId();
  const tier = await options.getTier();

  const result = await checkRateLimit(userId, tier, options.type);

  if (!result.allowed) {
    return {
      success: false,
      error: createRateLimitErrorResponse(result, options.type),
      headers: formatRateLimitHeaders(result),
    };
  }

  const data = await handler();

  return {
    success: true,
    data,
    headers: formatRateLimitHeaders(result),
  };
}
