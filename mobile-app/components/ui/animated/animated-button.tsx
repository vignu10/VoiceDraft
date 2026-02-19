import React, { ReactNode } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './pressable-scale';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AnimatedButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
}: AnimatedButtonProps) {
  const colors = useThemeColors();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primary,
          text: colors.textInverse,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: colors.surface,
          text: colors.text,
          border: colors.border,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: colors.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: colors.error,
          text: colors.textInverse,
          border: 'transparent',
        };
      case 'success':
        return {
          bg: colors.success,
          text: colors.textInverse,
          border: 'transparent',
        };
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing[2],
          paddingHorizontal: Spacing[4],
          fontSize: Typography.fontSize.sm,
          iconSize: 16,
          height: 36,
        };
      case 'md':
        return {
          paddingVertical: Spacing[3],
          paddingHorizontal: Spacing[5],
          fontSize: Typography.fontSize.base,
          iconSize: 20,
          height: 48,
        };
      case 'lg':
        return {
          paddingVertical: Spacing[4],
          paddingHorizontal: Spacing[6],
          fontSize: Typography.fontSize.lg,
          iconSize: 24,
          height: 56,
        };
    }
  };

  const buttonColors = getColors();
  const buttonSizes = getSizes();

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      hapticStyle="medium"
      style={[
        styles.button,
        {
          backgroundColor: buttonColors.bg,
          borderColor: buttonColors.border,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          minHeight: buttonSizes.height,
          paddingVertical: buttonSizes.paddingVertical,
          paddingHorizontal: buttonSizes.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
        variant === 'primary' && Shadows.md,
        (disabled || loading) && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={buttonColors.text}
            style={styles.loader}
          />
        ) : (
          <>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={buttonSizes.iconSize}
                color={buttonColors.text}
                style={styles.leftIcon}
              />
            )}
            <ThemedText
              style={[
                styles.text,
                {
                  color: buttonColors.text,
                  fontSize: buttonSizes.fontSize,
                },
              ]}
            >
              {children}
            </ThemedText>
            {rightIcon && (
              <Ionicons
                name={rightIcon}
                size={buttonSizes.iconSize}
                color={buttonColors.text}
                style={styles.rightIcon}
              />
            )}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
  leftIcon: {
    marginRight: Spacing[2],
  },
  rightIcon: {
    marginLeft: Spacing[2],
  },
  loader: {
    marginHorizontal: Spacing[2],
  },
  disabled: {
    opacity: 0.5,
  },
});
