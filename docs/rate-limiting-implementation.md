# API Rate Limiting Implementation

## Overview

This document describes the tiered rate limiting system implemented for VoiceScribe using Upstash Redis.

## Architecture

### Components

1. **rate-limit-upstash.ts** - Core rate limiting logic using Upstash
2. **subscription-limits.ts** - Monthly post counter and tier management
3. **Database migration** - Adds subscription tier fields to user_profiles

### Subscription Tiers

| Tier   | Posts/Month | Requests/Hour | Cost   |
|--------|-------------|---------------|--------|
| Free   | 3           | 10            | $0     |
| Pro    | 30          | 50            | $19/mo |
| Team   | Unlimited   | Unlimited     | $49/mo |

## Implementation Details

### 1. Database Schema

```sql
ALTER TABLE user_profiles
ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free'
CHECK (subscription_tier IN ('free', 'pro', 'team'));

ALTER TABLE user_profiles
ADD COLUMN posts_created_this_month INT DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN last_posts_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

### 2. Rate Limiting Types

#### Hourly Rate Limiting
- Used for API endpoint protection
- Sliding window algorithm
- Prevents API abuse
- Configured per tier

#### Monthly Post Limits
- Tracks posts created per user
- Resets automatically on first post of each month
- Enforces subscription tier limits

### 3. API Integration

Example usage in API routes:

```typescript
import { canCreatePost, incrementPostCounter } from '@/lib/subscription-limits';
import { checkRateLimit, formatRateLimitHeaders, createRateLimitErrorResponse } from '@/lib/rate-limit-upstash';

// After authentication
const hourlyLimitCheck = await checkRateLimit(user.id, tier, 'hourly');
if (!hourlyLimitCheck.allowed) {
  const errorResponse = createRateLimitErrorResponse(hourlyLimitCheck, 'hourly');
  return NextResponse.json(errorResponse, {
    status: 429,
    headers: formatRateLimitHeaders(hourlyLimitCheck),
  });
}

// Check monthly post limit
const monthlyLimitCheck = await canCreatePost(user.id);
if (!monthlyLimitCheck.allowed) {
  return NextResponse.json({
    error: 'Monthly post limit reached',
    tier: monthlyLimitCheck.tier,
    resetDate: monthlyLimitCheck.resetDate,
  }, { status: 429 });
}

// After successful post creation
await incrementPostCounter(user.id);

// Return response with rate limit headers
return NextResponse.json(data, {
  headers: formatRateLimitHeaders(hourlyLimitCheck),
});
```

### 4. Response Headers

All rate-limited responses include:

```
X-RateLimit-Tier: free|pro|team
X-RateLimit-Limit: 10 (or "unlimited")
X-RateLimit-Remaining: 7 (or "unlimited")
X-RateLimit-Reset: 2024-01-15T12:00:00.000Z
```

### 5. Error Responses

When rate limits are exceeded:

```json
{
  "error": "Rate limit exceeded. Please try again in 5 minutes.",
  "tier": "free",
  "limit": 10,
  "resetTime": "2024-01-15T12:00:00.000Z",
  "upgradeUrl": "/pricing"
}
```

For monthly limits:

```json
{
  "error": "Monthly post limit reached. You've used all 3 posts for this month. Upgrade to Pro for 30 posts/month.",
  "tier": "free",
  "resetDate": "2024-02-01T00:00:00.000Z"
}
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply to Supabase SQL Editor
psql -f docs/migrations/add_subscription_tier.sql
```

Or paste the SQL directly into Supabase SQL Editor.

### 2. Configure Environment Variables

```bash
# Upstash Redis (already configured for queue)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 3. Apply to API Routes

The rate limiting is already applied to:
- ✅ POST /api/drafts - Create new draft

Future endpoints should follow the same pattern.

## Testing

### Test Rate Limiting

```bash
# Create multiple posts rapidly
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/drafts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title": "Test Post"}'
  echo "Request $i completed"
done
```

### Test Different Tiers

```sql
-- Update user to pro tier
UPDATE user_profiles
SET subscription_tier = 'pro'
WHERE auth_user_id = 'user_id';

-- Reset post counter
UPDATE user_profiles
SET posts_created_this_month = 0
WHERE auth_user_id = 'user_id';
```

## Monitoring

Upstash Redis provides built-in analytics:
- Request rate per tier
- Limit violations
- Remaining capacity

View at: https://console.upstash.io

## Future Enhancements

1. **Webhook Integration** - Automatically update tiers from RevenueCat
2. **Granular Limits** - Separate limits for different operations
3. **Burst Allowance** - Allow short bursts within limits
4. **Analytics Dashboard** - Display usage stats to users
5. **Proration** - Handle mid-month upgrades/downgrades

## Troubleshooting

### Rate limiting not working
- Check Upstash credentials are set
- Verify Redis connection: `curl $UPSTASH_REDIS_REST_URL/ping`
- Check logs for connection errors

### Counter not resetting
- Verify `last_posts_reset_at` is being updated
- Check timezone handling
- Manually reset: `UPDATE user_profiles SET posts_created_this_month = 0, last_posts_reset_at = NOW()`

### Headers not showing
- Ensure `formatRateLimitHeaders()` is called
- Check response object includes headers
- Verify no middleware is stripping headers
