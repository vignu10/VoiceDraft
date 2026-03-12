import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
  audioBlob: Blob | null;
  error: string | null;

  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  setDuration: (duration: number) => void;
  setAudioLevel: (level: number) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>()((set) => ({
  isRecording: false,
  duration: 0,
  audioLevel: 0,
  audioBlob: null,
  error: null,

  startRecording: () => {
    set({ isRecording: true, duration: 0, audioLevel: 0, audioBlob: null, error: null });
  },

  stopRecording: () => {
    set({ isRecording: false });
  },

  setDuration: (duration) => set({ duration }),

  setAudioLevel: (audioLevel) => set({ audioLevel }),

  setAudioBlob: (audioBlob) => set({ audioBlob }),

  setError: (error) => set({ error }),

  reset: () => {
    set({
      isRecording: false,
      duration: 0,
      audioLevel: 0,
      audioBlob: null,
      error: null,
    });
  },
}));
