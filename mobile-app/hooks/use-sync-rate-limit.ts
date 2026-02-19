import { useEffect } from "react";
import { useGuestStore } from "@/stores/guest-store";
import type { ApiResponse } from "@/services/api/client";

/**
 * Hook to sync rate limit information from API responses
 * to the guest store. Call this with an API response to update
 * the local remaining drafts count and reset time.
 *
 * @example
 * const syncRateLimit = useSyncRateLimit();
 * const response = await apiClient.post('/api/generate', data);
 * syncRateLimit(response);
 */
export function useSyncRateLimit() {
  const updateRateLimitReset = useGuestStore(
    (state) => state.updateRateLimitReset,
  );

  /**
   * Sync rate limit info from API response to guest store
   */
  const syncRateLimit = <T>(response: ApiResponse<T>) => {
    // Update reset time if present in response
    if (response.rateLimitReset) {
      const resetTime = new Date(response.rateLimitReset).toISOString();
      updateRateLimitReset(resetTime);
    }
  };

  return syncRateLimit;
}

/**
 * Helper function to calculate remaining drafts from rate limit headers
 * Each draft = 2 API calls (transcribe + generate)
 */
export function calculateRemainingDrafts(
  rateLimitRemaining: number | undefined,
): number {
  if (rateLimitRemaining === undefined) return 3;
  // Each draft needs 2 API calls, so divide by 2 and round down
  return Math.max(0, Math.floor(rateLimitRemaining / 2));
}
