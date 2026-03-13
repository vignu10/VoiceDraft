/**
 * Color scheme hook with manual override support
 * Uses the stored preference from settings, falling back to system preference
 */

import { useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores';

export function useColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const colorScheme = useSettingsStore((state) => state.colorScheme);

  return useMemo(() => {
    if (colorScheme === 'auto') {
      return systemColorScheme ?? 'light';
    }
    return colorScheme;
  }, [colorScheme, systemColorScheme]);
}

// Export the system hook for direct access if needed
export { useColorScheme as useSystemColorScheme } from 'react-native';
