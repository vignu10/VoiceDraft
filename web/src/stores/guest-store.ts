import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_FREE_DRAFTS = 5;

interface GuestState {
  guestId: string | null;
  remainingDrafts: number;
  hasSeenOnboarding: boolean;
  guestDrafts: string[]; // Track IDs of drafts created during guest trial

  // Actions
  setGuestId: (id: string) => void;
  decrementDrafts: () => void;
  resetDrafts: () => void;
  setOnboardingSeen: () => void;
  canCreateDraft: () => boolean;
  isGuest: () => boolean;
  addGuestDraft: (draftId: string) => void;
  isGuestDraft: (draftId: string) => boolean;
  clearGuestDrafts: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      guestId: null,
      remainingDrafts: MAX_FREE_DRAFTS,
      hasSeenOnboarding: false,
      guestDrafts: [],

      setGuestId: (id) => set({ guestId: id }),

      decrementDrafts: () =>
        set((state) => ({
          remainingDrafts: Math.max(0, state.remainingDrafts - 1),
        })),

      resetDrafts: () => set({ remainingDrafts: MAX_FREE_DRAFTS }),

      setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      canCreateDraft: () => {
        const { remainingDrafts } = get();
        return remainingDrafts > 0;
      },

      isGuest: () => {
        const { guestId } = get();
        return !!guestId;
      },

      addGuestDraft: (draftId: string) =>
        set((state) => ({
          guestDrafts: [...state.guestDrafts, draftId],
        })),

      isGuestDraft: (draftId: string) => {
        const { guestDrafts } = get();
        return guestDrafts.includes(draftId);
      },

      clearGuestDrafts: () => set({ guestDrafts: [] }),
    }),
    {
      name: 'guest-storage',
    }
  )
);
