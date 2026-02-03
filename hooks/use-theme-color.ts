/**
 * Theme color hook for accessing theme-aware colors
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorKey = keyof typeof Colors.light;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

// Hook to get multiple theme colors at once
export function useThemeColors() {
  const theme = useColorScheme() ?? 'light';
  return Colors[theme];
}
