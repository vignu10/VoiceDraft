import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { PressableScale } from './pressable-scale';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Shadows } from '@/constants/design-system';
import { Springs } from '@/constants/animations';

type CardVariant = 'flat' | 'elevated' | 'outlined';

interface AnimatedCardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  pressable?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  delay?: number;
  animateEntry?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'text' | 'none' | 'link' | 'header' | 'adjustable' | 'image' | 'keyboardkey' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'search' | 'spinbutton' | 'summary' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar' | 'list' | undefined;
}

export function AnimatedCard({
  children,
  variant = 'elevated',
  style,
  pressable = false,
  onPress,
  onLongPress,
  delay = 0,
  animateEntry = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}: AnimatedCardProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(animateEntry ? 0 : 1);

  useEffect(() => {
    if (animateEntry) {
      progress.value = withDelay(
        delay,
        withSpring(1, Springs.list)
      );
    }
  }, [animateEntry, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [20, 0]) },
        { scale: interpolate(progress.value, [0, 1], [0.95, 1]) },
      ],
    };
  });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: colors.surface,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          ...Shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        getVariantStyles(),
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (pressable && onPress) {
    return (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        scale={0.98}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
      >
        {cardContent}
      </PressableScale>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
  },
});
