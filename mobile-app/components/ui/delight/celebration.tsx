/**
 * VoiceScribe Celebration Component
 * Lightweight, accessible celebration animation for achievements
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPieceProps {
  index: number;
  colors: string[];
  onComplete?: () => void;
}

function ConfettiPiece({ index, colors }: ConfettiPieceProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Random starting position (centered)
  const startX = SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100;
  const startY = SCREEN_HEIGHT / 3;

  // Random spread
  const spreadX = (Math.random() - 0.5) * 400;
  const spreadY = 200 + Math.random() * 200;

  // Random properties
  const color = colors[index % colors.length];
  const size = 6 + Math.random() * 8;
  const rotationSpeed = 360 + Math.random() * 720;

  useEffect(() => {
    // Stagger start based on index
    const delay = index * 20;

    // Animation sequence
    translateX.value = withDelay(
      delay,
      withTiming(startX + spreadX, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(startY + spreadY, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    rotate.value = withDelay(
      delay,
      withSequence(
        withTiming(rotationSpeed, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(rotationSpeed + 180, { duration: 400 })
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(0.8, { duration: 600 })
      )
    );

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(500, withTiming(0, { duration: 200 }))
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle} />;
}

interface CelebrationProps {
  visible: boolean;
  duration?: number;
  intensity?: 'light' | 'medium' | 'full';
  onComplete?: () => void;
  children?: React.ReactNode;
}

export function Celebration({
  visible,
  duration = 800,
  intensity = 'medium',
  onComplete,
  children,
}: CelebrationProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const colors = useThemeColors();

  // Brand colors for celebration
  const celebrationColors = [
    colors.primary,
    colors.accent,
    colors.teal,
    colors.primaryLight,
    colors.accentLight,
    colors.tealLight,
  ];

  // Number of confetti pieces based on intensity
  const pieceCount = {
    light: 12,
    medium: 24,
    full: 40,
  }[intensity];

  useEffect(() => {
    if (visible && !shouldAnimate) {
      setShouldAnimate(true);

      // Reset after animation completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else if (!visible) {
      setShouldAnimate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration]);

  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: pieceCount }).map((_, i) => (
        <ConfettiPiece
          key={i}
          index={i}
          colors={celebrationColors}
        />
      ))}
      {children}
    </View>
  );
}

// ============================================
// MINI CELEBRATION - Subtle version
// ============================================

interface MiniCelebrationProps {
  visible: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export function MiniCelebration({
  visible,
  icon = 'checkmark-circle',
  message,
  duration = 1000,
  onComplete,
}: MiniCelebrationProps) {
  const [show, setShow] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const colors = useThemeColors();

  useEffect(() => {
    if (visible && !show) {
      setShow(true);

      // Animate in
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      opacity.value = withTiming(1, { duration: 150 });

      // Animate out and complete
      const timer = setTimeout(() => {
        scale.value = withTiming(0.8, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          'worklet';
          runOnJS(setShow)(false);
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, duration);

      return () => clearTimeout(timer);
    } else if (!visible) {
      setShow(false);
      scale.value = 0;
      opacity.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!show) return null;

  return (
    <View style={styles.miniContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.miniContent,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primaryLight,
            shadowColor: colors.primary,
          },
          animatedStyle,
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={icon} size={32} color={colors.primary} />
        </View>
        {message && (
          <Animated.Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  miniContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  miniContent: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
