import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUri: string | null;
  meteringLevels: number[];
  maxDuration: number;

  // Actions
  setRecording: (isRecording: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setDuration: (duration: number) => void;
  setAudioUri: (uri: string | null) => void;
  addMeteringLevel: (level: number) => void;
  reset: () => void;
}

const initialState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUri: null,
  meteringLevels: [],
  maxDuration: 600, // 10 minutes in seconds
};

export const useRecordingStore = create<RecordingState>((set) => ({
  ...initialState,

  setRecording: (isRecording) => set({ isRecording }),

  setPaused: (isPaused) => set({ isPaused }),

  setDuration: (duration) => set({ duration }),

  setAudioUri: (audioUri) => set({ audioUri }),

  addMeteringLevel: (level) =>
    set((state) => ({
      meteringLevels: [...state.meteringLevels.slice(-50), level],
    })),

  reset: () => set(initialState),
}));
