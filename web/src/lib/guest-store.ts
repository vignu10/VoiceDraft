/**
 * Guest trial state for web (localStorage-based)
 * Mirrors mobile-app/stores/guest-store.ts functionality
 */

import React from 'react';

/**
 * Maximum number of free drafts a guest can create
 * Each draft requires 2 API calls (transcribe + generate), so 6 requests = 3 drafts
 */
const MAX_FREE_DRAFTS = 3;

const GUEST_STORAGE_KEY = 'voicescribe-guest';
const GUEST_DRAFT_STORAGE_KEY = 'voicescribe-guest-draft';

interface GuestState {
  hasUsedFreeTrial: boolean;
  trialUsedAt: string | null;
  trialCompletedSuccessfully: boolean;
  remainingDrafts: number;
  rateLimitResetAt: string | null;
}

interface GuestDraft {
  id: string; // 'guest-draft' constant
  title: string;
  content: string;
  transcription: string;
  keywords: string[];
  createdAt: string;
  audioUri?: string;
  audioS3Key?: string;
  audioFileUrl?: string;
  audioDuration?: number;
  tone?: string;
  length?: string;
}

const initialState: GuestState = {
  hasUsedFreeTrial: false,
  trialUsedAt: null,
  trialCompletedSuccessfully: false,
  remainingDrafts: MAX_FREE_DRAFTS,
  rateLimitResetAt: null,
};

/**
 * Load guest state from localStorage
 */
function loadGuestState(): GuestState {
  if (typeof window === 'undefined') return initialState;

  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      return { ...initialState, ...JSON.parse(stored) };
    }
  } catch (error) {
    // Silently fail on storage errors
  }
  return initialState;
}

/**
 * Save guest state to localStorage
 */
function saveGuestState(state: GuestState) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Silently fail on storage errors
  }
}

/**
 * Guest store for web (using localStorage instead of Zustand+AsyncStorage)
 * Provides a simple API compatible with mobile's useGuestStore
 */
class GuestStore {
  private state: GuestState;
  private listeners: Set<(state: GuestState) => void> = new Set();

  constructor() {
    this.state = loadGuestState();
  }

  getState(): GuestState {
    return { ...this.state };
  }

  // Actions
  markTrialUsed() {
    this.state = {
      ...this.state,
      hasUsedFreeTrial: true,
      trialUsedAt: new Date().toISOString(),
    };
    saveGuestState(this.state);
    this.notifyListeners();
  }

  markTrialCompleted() {
    this.state = {
      ...this.state,
      trialCompletedSuccessfully: true,
    };
    saveGuestState(this.state);
    this.notifyListeners();
  }

  decrementRemainingDrafts() {
    this.state = {
      ...this.state,
      remainingDrafts: Math.max(0, this.state.remainingDrafts - 1),
    };
    saveGuestState(this.state);
    this.notifyListeners();
  }

  updateRateLimitReset(resetTime: string) {
    this.state = {
      ...this.state,
      rateLimitResetAt: resetTime,
    };
    saveGuestState(this.state);
    this.notifyListeners();
  }

  resetTrial() {
    this.state = { ...initialState };
    saveGuestState(this.state);
    this.notifyListeners();
  }

  // Draft management
  getGuestDraft(): GuestDraft | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(GUEST_DRAFT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Silently fail on storage errors
    }
    return null;
  }

  setGuestDraft(draft: GuestDraft) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(GUEST_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      // Silently fail on storage errors
    }
  }

  clearGuestDraft() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(GUEST_DRAFT_STORAGE_KEY);
    } catch (error) {
      // Silently fail on storage errors
    }
  }

  // Subscription for React hooks
  subscribe(listener: (state: GuestState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

// Singleton instance
export const guestStore = new GuestStore();

/**
 * React hook for guest state (simple implementation without Zustand)
 */
export function useGuestStore() {
  const [state, setState] = React.useState(() => guestStore.getState());

  React.useEffect(() => {
    return guestStore.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return {
    ...state,
    maxFreeDrafts: MAX_FREE_DRAFTS,
    // Actions
    markTrialUsed: () => guestStore.markTrialUsed(),
    markTrialCompleted: () => guestStore.markTrialCompleted(),
    decrementRemainingDrafts: () => guestStore.decrementRemainingDrafts(),
    updateRateLimitReset: (resetTime: string) => guestStore.updateRateLimitReset(resetTime),
    resetTrial: () => guestStore.resetTrial(),
    // Draft actions
    getGuestDraft: () => guestStore.getGuestDraft(),
    setGuestDraft: (draft: GuestDraft) => guestStore.setGuestDraft(draft),
    clearGuestDraft: () => guestStore.clearGuestDraft(),
  };
}

// Export types
export type { GuestState, GuestDraft };
