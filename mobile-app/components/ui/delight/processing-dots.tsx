/**
 * VoiceDraft Processing Dots
 * A delightful animated loading indicator
 * Brand-aligned: soft, warm, playful
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/design-system';

interface ProcessingDotsProps {
  count?: number;
  size?: number;
}

export function ProcessingDots({ count = 3, size = 12 }: ProcessingDotsProps) {
  const colors = useThemeColors();

  const dots = Array.from({ length: count });

  return (
    <View style={styles.container}>
      {dots.map((_, index) => (
        <Dot key={index} index={index} size={size} color={colors.primary} />
      ))}
    </View>
  );
}

interface DotProps {
  index: number;
  size: number;
  color: string;
}

function Dot({ index, size, color }: DotProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);
  const hasStarted = useRef(false);

  const delay = index * 150;

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Start animation after delay
    const startTimer = setTimeout(() => {
      // Create continuous animation using setInterval
      const animate = () => {
        scale.value = withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0.6, { duration: 400, easing: Easing.in(Easing.cubic) })
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0.4, { duration: 400, easing: Easing.in(Easing.cubic) })
        );
      };

      animate();
      const interval = setInterval(animate, 800);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  dot: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
