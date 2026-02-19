// Simple in-memory rate limiter for serverless functions
// Uses a Map with TTL cleanup - works for Vercel serverless with short windows

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    },
    10 * 60 * 1000,
  );
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Optional prefix for the key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const key = `${config.keyPrefix || "rl"}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIp(request: Request): string {
  // Try various headers for client IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for development
  return "unknown";
}

/**
 * Get the guest ID from request headers
 * Returns the guest ID if present, otherwise falls back to client IP
 */
export function getGuestIdOrIp(request: Request): string {
  const guestId = request.headers.get("x-guest-id");
  if (guestId) {
    return `guest:${guestId}`;
  }

  // Fallback to IP address
  return `ip:${getClientIp(request)}`;
}

/**
 * Pre-configured rate limit for guest users
 * 6 requests per hour per IP for unauthenticated requests
 * Note: Each draft requires 2 API calls (transcribe + generate), so this allows 3 complete drafts per hour
 */
export const GUEST_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 6, // Allows 3 complete drafts (2 calls each)
  keyPrefix: "guest",
};
