/**
 * Theme color hook for accessing theme-aware colors
 */

import { ThemeColors } from '@/constants/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorKey = keyof typeof ThemeColors.light;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return ThemeColors[theme][colorName];
  }
}

// Hook to get multiple theme colors at once - returns all theme colors
export function useThemeColors() {
  const theme = useColorScheme() ?? 'light';
  return ThemeColors[theme];
}

// Alias for backward compatibility
export { ThemeColors as Colors } from '@/constants/design-system';
