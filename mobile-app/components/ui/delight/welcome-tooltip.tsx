/**
 * VoiceDraft Welcome Tooltip
 * Simple, non-intrusive onboarding hint
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Duration, Springs } from '@/constants/animations';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

interface WelcomeTooltipProps {
  visible: boolean;
  message: string;
  onComplete?: () => void;
  delay?: number;
}

export function WelcomeTooltip({
  visible,
  message,
  onComplete,
  delay = 500,
}: WelcomeTooltipProps) {
  const [show, setShow] = useState(false);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const colors = useThemeColors();

  const handleHide = useCallback(() => {
    translateY.value = withSpring(-100, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(0, { duration: Duration.fast }, () => {
      'worklet';
      runOnJS(setShow)(false);
      if (onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [onComplete, translateY, opacity]);

  useEffect(() => {
    if (visible && !show) {
      const timer1 = setTimeout(() => {
        setShow(true);
        translateY.value = withSpring(0, Springs.gentle);
        opacity.value = withTiming(1, { duration: Duration.normal });
      }, delay);

      const timer2 = setTimeout(() => {
        handleHide();
      }, delay + 2500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (!visible && show) {
      handleHide();
    }
  }, [visible, show, delay, handleHide, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    bottom: 140,
    left: Spacing[4],
    right: Spacing[4],
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    zIndex: 999,
  }));

  if (!show) return null;

  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <ThemedText style={styles.message}>
              {message}
            </ThemedText>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  gradient: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  message: {
    color: '#fff',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.extrabold,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
});
