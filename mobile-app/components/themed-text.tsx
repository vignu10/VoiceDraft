import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Typography, Palette } from '@/constants/design-system';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

// Map fontWeight to Nunito font family
function getNunitoFamily(weight?: TextStyle['fontWeight']): string {
  switch (weight) {
    case '800':
    case 'bold':
      return 'Nunito_700Bold';
    case '700':
      return 'Nunito_700Bold';
    case '600':
      return 'Nunito_600SemiBold';
    case '500':
      return 'Nunito_500Medium';
    case '400':
    case 'normal':
    default:
      return 'Nunito_400Regular';
  }
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // Resolve the type-based style
  const typeStyle = type !== 'default' ? styles[type] : styles.default;

  // Flatten all styles to extract the effective fontWeight
  const flatStyle = (StyleSheet.flatten([typeStyle, style]) || {}) as TextStyle;
  const fontFamily = getNunitoFamily(flatStyle.fontWeight);

  return (
    <Text
      style={[
        { color },
        typeStyle,
        style,
        { fontFamily },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  defaultSemiBold: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    fontWeight: Typography.fontWeight.semibold,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  link: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    color: Palette.periwinkle[500],
  },
});
