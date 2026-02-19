import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Maximum number of free drafts a guest can create
 * Each draft requires 2 API calls (transcribe + generate), so 6 requests = 3 drafts
 */
const MAX_FREE_DRAFTS = 3;

/**
 * Generate a unique guest ID (UUID v4)
 */
function generateGuestId(): string {
  // Simple UUID v4 generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface GuestState {
  // Unique identifier for this guest (generated once, persisted)
  guestId: string | null;
  // Whether the guest successfully completed the full flow (got a draft)
  // Used for content gate logic on draft detail screen
  trialCompletedSuccessfully: boolean;
  // Number of free drafts remaining (derived from API calls made)
  remainingDrafts: number;
  // ISO timestamp when the rate limit resets
  rateLimitResetAt: string | null;
}

interface GuestActions {
  // Get or create the unique guest ID
  getGuestId: () => string;
  // Mark the trial as successfully completed (draft was generated)
  markTrialCompleted: () => void;
  // Decrement remaining drafts count (call after successful draft creation)
  decrementRemainingDrafts: () => void;
  // Update rate limit reset time (from server response)
  updateRateLimitReset: (resetTime: string) => void;
  // Reset the guest trial state (keeps guestId) - for testing
  resetTrial: () => void;
  // Complete reset including guestId - for development/testing only
  resetAll: () => void;
}

const initialState: GuestState = {
  guestId: null,
  trialCompletedSuccessfully: false,
  remainingDrafts: MAX_FREE_DRAFTS,
  rateLimitResetAt: null,
};

export const useGuestStore = create<GuestState & GuestActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Ensure guest ID exists (generate if needed)
      getGuestId: () => {
        let currentId = get().guestId;
        if (!currentId) {
          currentId = generateGuestId();
          set({ guestId: currentId });
        }
        return currentId;
      },

      markTrialCompleted: () => {
        set({ trialCompletedSuccessfully: true });
      },

      decrementRemainingDrafts: () => {
        set((state) => ({
          remainingDrafts: Math.max(0, state.remainingDrafts - 1),
        }));
      },

      updateRateLimitReset: (resetTime: string) => {
        set({ rateLimitResetAt: resetTime });
      },

      resetTrial: () => {
        // Keep guestId when resetting trial
        set({ ...initialState, guestId: get().guestId });
      },

      resetAll: () => {
        // Complete reset including guestId - for development/testing only
        set(initialState);
      },
    }),
    {
      name: "guest-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist these fields
        guestId: state.guestId,
        trialCompletedSuccessfully: state.trialCompletedSuccessfully,
        remainingDrafts: state.remainingDrafts,
        rateLimitResetAt: state.rateLimitResetAt,
      }),
    },
  ),
);
