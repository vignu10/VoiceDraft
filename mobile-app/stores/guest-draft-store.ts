import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface GuestDraft {
  id: string; // 'guest-draft' constant
  guestId: string; // Unique guest identifier - must be provided when setting draft
  title: string;
  content: string; // full markdown/text content
  transcription: string;
  keywords: string[];
  createdAt: string; // ISO date
  audioUri?: string; // local file path (may be cleaned up)
  audioDuration?: number;
  // Additional metadata
  tone?: string;
  length?: string;
}

interface GuestDraftStore {
  draft: GuestDraft | null;
  setGuestDraft: (draft: GuestDraft) => void;
  clearGuestDraft: () => void;
}

export const useGuestDraftStore = create<GuestDraftStore>()(
  persist(
    (set) => ({
      draft: null,
      setGuestDraft: (draft) => set({ draft }),
      clearGuestDraft: () => set({ draft: null }),
    }),
    {
      name: "guest-draft-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
