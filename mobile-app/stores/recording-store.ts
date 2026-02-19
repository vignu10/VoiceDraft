import { create } from 'zustand';
import { recordingService } from '@/services/audio/recording-service';

// Circular buffer for efficient metering levels storage
class MeteringBuffer {
  private buffer: number[] = [];
  private capacity: number;
  private writeIndex = 0;
  private size = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(0);
  }

  push(level: number): void {
    this.buffer[this.writeIndex] = level;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  toArray(): number[] {
    if (this.size === 0) return [];

    const result: number[] = [];
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(this.writeIndex - this.size + i + this.capacity) % this.capacity]);
    }
    return result;
  }

  clear(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.size = 0;
  }

  getLength(): number {
    return this.size;
  }
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUri: string | null;
  meteringLevels: number[];
  maxDuration: number;
  hasExistingRecording: boolean;

  // Continue Draft state
  lastDraftId: string | null;
  lastDraftTitle: string | null;
  lastDraftKeyword: string | null;
  lastDraftContent: string | null;

  // Actions
  setRecording: (isRecording: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setDuration: (duration: number) => void;
  setAudioUri: (uri: string | null) => void;
  addMeteringLevel: (level: number) => void;
  getMeteringLevels: () => number[];
  setMeteringLevels: (levels: number[]) => void;
  reset: () => Promise<void>;
  clearExisting: () => void;
  markAsExisting: () => void;

  // Continue Draft actions
  setLastDraft: (draftId: string, title: string | null, keyword: string | null, content: string | null) => void;
  clearLastDraft: () => void;
}

const initialState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUri: null,
  meteringLevels: [],
  maxDuration: 600, // 10 minutes in seconds
  hasExistingRecording: false,

  // Continue Draft state
  lastDraftId: null,
  lastDraftTitle: null,
  lastDraftKeyword: null,
  lastDraftContent: null,
};

// Create circular buffer instance for metering levels (increased capacity for smoother waveform)
const meteringBuffer = new MeteringBuffer(100);

export const useRecordingStore = create<RecordingState>((set, get) => ({
  ...initialState,

  setRecording: (isRecording) => set({ isRecording }),

  setPaused: (isPaused) => set({ isPaused }),

  setDuration: (duration) => {
    set({ duration });
    // If we have duration and no audioUri, mark as existing recording
    if (duration > 0 && !get().audioUri) {
      set({ hasExistingRecording: true });
    }
  },

  setAudioUri: (audioUri) => {
    set({ audioUri, hasExistingRecording: false });
  },

  // Optimized: Uses circular buffer to avoid array creation on every update
  addMeteringLevel: (level) => {
    meteringBuffer.push(level);
    // Only update state periodically or when needed for display
    // This prevents re-renders on every metering update (60x/second)
  },

  // Get current metering levels as array (called when needed)
  getMeteringLevels: () => meteringBuffer.toArray(),

  setMeteringLevels: (levels) => {
    meteringBuffer.clear();
    levels.forEach(l => meteringBuffer.push(l));
    set({ meteringLevels: levels });
  },

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

    // Clear the metering buffer
    meteringBuffer.clear();

    // Reset all state to initial values
    set(initialState);
  },

  clearExisting: () => {
    // Clear the existing recording and start fresh
    meteringBuffer.clear();
    set({
      duration: 0,
      meteringLevels: [],
      hasExistingRecording: false,
    });
  },

  markAsExisting: () => {
    // Mark current recording as existing (for resume scenario)
    set({ hasExistingRecording: true });
  },

  setLastDraft: (draftId, title, keyword, content) => {
    set({
      lastDraftId: draftId,
      lastDraftTitle: title,
      lastDraftKeyword: keyword,
      lastDraftContent: content,
    });
  },

  clearLastDraft: () => {
    set({
      lastDraftId: null,
      lastDraftTitle: null,
      lastDraftKeyword: null,
      lastDraftContent: null,
    });
  },
}));
