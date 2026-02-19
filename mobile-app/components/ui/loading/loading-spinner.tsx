/**
 * Loading Spinner - Inline loading indicator
 * Use for inline loading states within components
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/design-system';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  message?: string;
  centerInContainer?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'md',
  message,
  centerInContainer = true,
  style,
}: LoadingSpinnerProps) {
  const colors = useThemeColors();

  const getSizeProps = () => {
    switch (size) {
      case 'sm':
        return {
          indicatorSize: 'small' as const,
          fontSize: Typography.fontSize.sm,
          gap: Spacing[2],
        };
      case 'lg':
        return {
          indicatorSize: 'large' as const,
          fontSize: Typography.fontSize.lg,
          gap: Spacing[4],
        };
      default:
        return {
          indicatorSize: 'small' as const,
          fontSize: Typography.fontSize.base,
          gap: Spacing[3],
        };
    }
  };

  const { indicatorSize, fontSize, gap } = getSizeProps();

  return (
    <View
      style={[
        styles.container,
        centerInContainer && styles.centered,
        style,
      ]}
      testID="loading-spinner"
    >
      <ActivityIndicator
        size={indicatorSize}
        color={colors.primary}
      />
      {message && (
        <ThemedText
          style={[
            styles.message,
            { color: colors.textSecondary, fontSize, marginTop: gap },
          ]}
        >
          {message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing[4],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
