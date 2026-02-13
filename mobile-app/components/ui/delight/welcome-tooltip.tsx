/**
 * VoiceDraft Welcome Tooltip
 * Warm, friendly onboarding hints for first-time users
 * Brand-aligned: gentle, not intrusive, encouraging
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Duration, Springs } from '@/constants/animations';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeTooltipProps {
  visible: boolean;
  message: string;
  position?: 'top' | 'bottom';
  onComplete?: () => void;
  delay?: number;
}

export function WelcomeTooltip({
  visible,
  message,
  position = 'bottom',
  onComplete,
  delay = 500,
}: WelcomeTooltipProps) {
  const [show, setShow] = useState(false);
  const translateY = useSharedValue(position === 'top' ? -100 : 100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const wiggle = useSharedValue(0);
  const colors = useThemeColors();

  const handleHide = useCallback(() => {
    translateY.value = withSpring(
      position === 'top' ? -100 : 100,
      { damping: 20, stiffness: 200 }
    );
    opacity.value = withTiming(0, { duration: Duration.fast });
    scale.value = withTiming(0.9, { duration: Duration.fast }, () => {
      'worklet';
      runOnJS(setShow)(false);
      if (onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [position, onComplete, translateY, opacity, scale]);

  useEffect(() => {
    if (visible && !show) {
      // Initial delay before showing
      const timer1 = setTimeout(() => {
        setShow(true);

        // Animate in
        translateY.value = withSpring(0, Springs.gentle);
        opacity.value = withTiming(1, { duration: Duration.normal });
        scale.value = withSpring(1, Springs.bouncy);
      }, delay);

      // Subtle wiggle after appearing
      const timer2 = setTimeout(() => {
        wiggle.value = withSequence(
          withTiming(5, { duration: 100 }),
          withTiming(-5, { duration: 100 }),
          withTiming(3, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
      }, delay + Duration.normal + 200);

      // Auto-hide after 4 seconds
      const timer3 = setTimeout(() => {
        handleHide();
      }, delay + 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else if (!visible && show) {
      handleHide();
    }
  }, [visible, show, delay, handleHide, translateY, opacity, scale, wiggle]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: position === 'top' ? SCREEN_HEIGHT * 0.15 : undefined,
    bottom: position === 'bottom' ? SCREEN_HEIGHT * 0.15 : undefined,
    left: Spacing[6],
    right: Spacing[6],
    transform: [
      { translateY: translateY.value },
      { rotate: `${wiggle.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!show) return null;

  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <View
        style={[
          styles.tooltip,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primaryLight,
            shadowColor: colors.primary,
          },
        ]}
      >
        {/* Gradient accent */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accentBar}
        />

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <ThemedText style={[styles.message, { color: colors.text }]}>
            {message}
          </ThemedText>
        </View>

        {/* Arrow */}
        <View
          style={[
            styles.arrow,
            position === 'top' ? styles.arrowBottom : styles.arrowTop,
            { borderTopColor: position === 'top' ? colors.primaryLight : colors.surface },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  arrow: {
    position: 'absolute',
    left: Spacing[6],
    width: 0,
    height: 0,
    borderLeftWidth: Spacing[3],
    borderLeftColor: 'transparent',
    borderRightWidth: Spacing[3],
    borderRightColor: 'transparent',
  },
  arrowTop: {
    top: -10,
    borderBottomWidth: 10,
  },
  arrowBottom: {
    bottom: -10,
    borderTopWidth: 10,
  },
});
