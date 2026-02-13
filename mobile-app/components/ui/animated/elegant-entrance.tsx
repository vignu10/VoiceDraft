/**
 * Elegant Entrance Animations
 * Refined, sophisticated entrance animations with spring-based easing
 * for a premium feel that respects accessibility (reduced motion).
 */

import { Duration, Springs } from "@/constants/animations";
import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ============================================
// FADE IN ELEGANT
// ============================================

interface FadeInElegantProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Elegant fade-in with subtle slide up
 * Creates a refined entrance that guides attention
 */
export function FadeInElegant({
  children,
  delay = 0,
  distance = 20,
  style,
}: FadeInElegantProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, Springs.soft));
  }, [delay, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {
        translateY: reducedMotion
          ? 0
          : interpolate(
              progress.value,
              [0, 1],
              [distance, 0],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}

// ============================================
// SLIDE IN ELEGANT
// ============================================

type SlideDirection = "up" | "down" | "left" | "right";

interface SlideInElegantProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  direction?: SlideDirection;
  style?: StyleProp<ViewStyle>;
}

/**
 * Elegant slide-in from specified direction
 * Creates a sense of flow and movement
 */
export function SlideInElegant({
  children,
  delay = 0,
  distance = 30,
  direction = "up",
  style,
}: SlideInElegantProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, Springs.gentle));
  }, [delay, reducedMotion, direction, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: 1 };
    }

    const translate = interpolate(
      progress.value,
      [0, 1],
      [distance, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(progress.value, [0, 0.5], [0, 1]);

    switch (direction) {
      case "up":
        return { opacity, transform: [{ translateY: translate }] };
      case "down":
        return { opacity, transform: [{ translateY: -translate }] };
      case "left":
        return { opacity, transform: [{ translateX: translate }] };
      case "right":
        return { opacity, transform: [{ translateX: -translate }] };
    }
  });

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}

// ============================================
// BOUNCE IN ELEGANT
// ============================================

interface BounceInElegantProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Elegant bounce-in with subtle scale
 * Creates a delightful moment for focal elements
 */
export function BounceInElegant({
  children,
  delay = 0,
  style,
}: BounceInElegantProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
  }, [delay, opacity, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}

// ============================================
// SCALE IN ELEGANT
// ============================================

interface ScaleInElegantProps {
  children: React.ReactNode;
  delay?: number;
  fromScale?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Elegant scale-in with opacity
 * Creates a focused, dramatic entrance
 */
export function ScaleInElegant({
  children,
  delay = 0,
  fromScale = 0.85,
  style,
}: ScaleInElegantProps) {
  const scale = useSharedValue(fromScale);
  const opacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: Duration.normal }),
    );
    scale.value = withDelay(delay, withSpring(1, Springs.gentle));
  }, [delay, fromScale, opacity, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
