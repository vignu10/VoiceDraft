import { create } from 'zustand';
import { recordingService } from '@/services/audio/recording-service';

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
  reset: () => Promise<void>;
}

const initialState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUri: null,
  meteringLevels: [],
  maxDuration: 600, // 10 minutes in seconds
};

export const useRecordingStore = create<RecordingState>((set, get) => ({
  ...initialState,

  setRecording: (isRecording) => set({ isRecording }),

  setPaused: (isPaused) => set({ isPaused }),

  setDuration: (duration) => set({ duration }),

  setAudioUri: (audioUri) => set({ audioUri }),

  addMeteringLevel: (level) =>
    set((state) => ({
      meteringLevels: [...state.meteringLevels.slice(-50), level],
    })),

  reset: async () => {
    // Cancel any ongoing recording
    try {
      if (recordingService.isRecording()) {
        await recordingService.cancelRecording();
      }
    } catch (e) {
      // Ignore cleanup errors
      console.error('Error during reset:', e);
    }

    // Reset all state to initial values
    set(initialState);
  },
}));
