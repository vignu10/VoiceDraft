-- ============================================================================
-- Add Subscription Tier to User Profiles
-- ============================================================================

-- Add subscription tier column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free'
CHECK (subscription_tier IN ('free', 'pro', 'team'));

-- Add posts created this month counter for tier limits
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS posts_created_this_month INT DEFAULT 0;

-- Add last posts reset timestamp
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_posts_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on subscription tier for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier
ON user_profiles(subscription_tier)
WHERE is_active = true;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.subscription_tier IS 'Subscription tier: free (3 posts/month), pro (30 posts/month), team (unlimited)';
COMMENT ON COLUMN user_profiles.posts_created_this_month IS 'Counter for posts created in current month. Resets on first post of each month.';
COMMENT ON COLUMN user_profiles.last_posts_reset_at IS 'Timestamp of last monthly post counter reset';
