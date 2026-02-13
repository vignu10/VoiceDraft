import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

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
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#8B5CF6',
  },
});
