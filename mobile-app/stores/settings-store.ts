import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tone, Length } from '@/types/draft';

export type ColorScheme = 'light' | 'dark' | 'auto';

interface SettingsState {
  defaultTone: Tone;
  defaultLength: Length;
  hapticFeedback: boolean;
  colorScheme: ColorScheme;

  // Actions
  setDefaultTone: (tone: Tone) => void;
  setDefaultLength: (length: Length) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  defaultTone: 'professional' as Tone,
  defaultLength: 'medium' as Length,
  hapticFeedback: true,
  colorScheme: 'auto' as ColorScheme,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setDefaultTone: (defaultTone) => set({ defaultTone }),

      setDefaultLength: (defaultLength) => set({ defaultLength }),

      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),

      setColorScheme: (colorScheme) => set({ colorScheme }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'voicedraft-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
