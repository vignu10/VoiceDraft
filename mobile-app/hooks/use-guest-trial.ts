import { useAuthStore } from "@/stores/auth-store";
import { useGuestStore } from "@/stores/guest-store";

/**
 * Maximum number of free drafts a guest can create
 */
export const MAX_FREE_DRAFTS = 3;

/**
 * Hook to manage guest trial functionality
 * Combines auth store and guest store state to determine
 * if a user can record/transcribe as a guest
 */
export function useGuestTrial() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const guestId = useGuestStore((state) => state.guestId);
  const trialCompletedSuccessfully = useGuestStore(
    (state) => state.trialCompletedSuccessfully,
  );
  const remainingDrafts = useGuestStore((state) => state.remainingDrafts);
  const rateLimitResetAt = useGuestStore((state) => state.rateLimitResetAt);
  const markTrialCompleted = useGuestStore((state) => state.markTrialCompleted);
  const decrementRemainingDrafts = useGuestStore(
    (state) => state.decrementRemainingDrafts,
  );
  const updateRateLimitReset = useGuestStore(
    (state) => state.updateRateLimitReset,
  );
  const getGuestId = useGuestStore((state) => state.getGuestId);
  const resetTrial = useGuestStore((state) => state.resetTrial);
  const resetAll = useGuestStore((state) => state.resetAll);

  /**
   * Whether the user can use the free trial
   * True if: not authenticated AND has remaining drafts
   */
  const canUseFreeTrial = !isAuthenticated && remainingDrafts > 0;

  /**
   * Whether the user should be prompted to sign in
   * True if: not authenticated AND has completed a draft
   */
  const shouldPromptSignIn = !isAuthenticated && trialCompletedSuccessfully;

  /**
   * Whether the user can record (either authenticated or has remaining drafts)
   */
  const canRecord = isAuthenticated || remainingDrafts > 0;

  /**
   * Get minutes until rate limit resets
   */
  const getMinutesUntilReset = () => {
    if (!rateLimitResetAt) return null;
    const minutes = Math.ceil(
      (new Date(rateLimitResetAt).getTime() - Date.now()) / 60000,
    );
    return Math.max(0, minutes);
  };

  return {
    // State
    isAuthenticated,
    guestId,
    trialCompletedSuccessfully,
    remainingDrafts,
    maxFreeDrafts: MAX_FREE_DRAFTS,
    rateLimitResetAt,
    canUseFreeTrial,
    shouldPromptSignIn,
    canRecord,
    minutesUntilReset: getMinutesUntilReset(),
    // Actions
    getGuestId,
    markTrialCompleted,
    decrementRemainingDrafts,
    updateRateLimitReset,
    resetTrial,
    resetAll,
  };
}

export type UseGuestTrialReturn = ReturnType<typeof useGuestTrial>;
