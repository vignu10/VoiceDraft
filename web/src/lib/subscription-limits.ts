/**
 * Subscription tier management and post limit tracking
 *
 * Handles monthly post counters and tier-based access control.
 */

import { supabaseAdmin } from './supabase';
import type { SubscriptionTier } from './rate-limit-upstash';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  subscription_tier: SubscriptionTier;
  posts_created_this_month: number;
  last_posts_reset_at: string;
}

/**
 * Get user profile with subscription tier
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile | null;
}

/**
 * Get user's subscription tier
 * Defaults to 'free' if profile doesn't exist
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const profile = await getUserProfile(userId);
  return profile?.subscription_tier || 'free';
}

/**
 * Check if user can create a new post based on monthly limits
 */
export async function canCreatePost(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetDate?: Date;
  tier: SubscriptionTier;
}> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    // No profile = free tier with 0 posts
    return {
      allowed: false,
      remaining: 3,
      tier: 'free',
    };
  }

  const tier = profile.subscription_tier || 'free';

  // Team tier has unlimited posts
  if (tier === 'team') {
    return {
      allowed: true,
      remaining: -1,
      tier: 'team',
    };
  }

  // Check if we need to reset the monthly counter
  await resetMonthlyCounterIfNeeded(profile);

  // Get the latest profile after potential reset
  const updatedProfile = await getUserProfile(userId);
  const postsCreated = updatedProfile?.posts_created_this_month || 0;

  const limits = {
    free: 3,
    pro: 30,
    team: -1,
  };

  const limit = limits[tier];
  const remaining = Math.max(0, limit - postsCreated);

  return {
    allowed: postsCreated < limit,
    remaining,
    resetDate: getNextMonthReset(),
    tier,
  };
}

/**
 * Increment post counter for user
 */
export async function incrementPostCounter(userId: string): Promise<void> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    // Create profile if it doesn't exist
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        auth_user_id: userId,
        subscription_tier: 'free',
        posts_created_this_month: 1,
        last_posts_reset_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating user profile:', error);
    }
    return;
  }

  // Reset counter if needed
  await resetMonthlyCounterIfNeeded(profile);

  // Increment counter
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      posts_created_this_month: (profile.posts_created_this_month || 0) + 1,
    })
    .eq('auth_user_id', userId);

  if (error) {
    console.error('Error incrementing post counter:', error);
  }
}

/**
 * Reset monthly counter if we're in a new month
 */
async function resetMonthlyCounterIfNeeded(profile: UserProfile): Promise<void> {
  const now = new Date();
  const lastReset = new Date(profile.last_posts_reset_at);

  // Check if we're in a new month
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        posts_created_this_month: 0,
        last_posts_reset_at: now.toISOString(),
      })
      .eq('auth_user_id', profile.auth_user_id);

    if (error) {
      console.error('Error resetting monthly counter:', error);
    }
  }
}

/**
 * Get next month reset date
 */
function getNextMonthReset(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Update user's subscription tier
 */
export async function updateUserTier(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ subscription_tier: tier })
    .eq('auth_user_id', userId);

  if (error) {
    console.error('Error updating user tier:', error);
    return false;
  }

  return true;
}

/**
 * Get user's current post usage stats
 */
export async function getUserUsageStats(userId: string) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    return {
      tier: 'free' as SubscriptionTier,
      postsCreatedThisMonth: 0,
      postsRemaining: 3,
      resetDate: getNextMonthReset(),
    };
  }

  await resetMonthlyCounterIfNeeded(profile);

  const updatedProfile = await getUserProfile(userId);
  const tier = updatedProfile?.subscription_tier || 'free';
  const postsCreated = updatedProfile?.posts_created_this_month || 0;

  const limits = {
    free: 3,
    pro: 30,
    team: -1,
  };

  const limit = limits[tier];

  return {
    tier,
    postsCreatedThisMonth: postsCreated,
    postsRemaining: tier === 'team' ? -1 : Math.max(0, limit - postsCreated),
    resetDate: getNextMonthReset(),
  };
}
