import React, { ReactNode, useEffect, useRef } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';
import { Duration, Easings, Springs } from '@/constants/animations';

// ============================================
// FADE IN WRAPPER
// ============================================
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({
  children,
  delay = 0,
  duration = Duration.normal,
  style,
}: FadeInProps) {
  const opacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easings.easeOut })
    );
  }, [delay, duration, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// SLIDE IN WRAPPER
// ============================================
type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface SlideInProps {
  children: ReactNode;
  direction?: SlideDirection;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  distance = 30,
  style,
}: SlideInProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, Springs.default));
  }, [delay, reducedMotion]);

  const isVertical = direction === 'up' || direction === 'down';
  const sign = direction === 'up' || direction === 'left' ? 1 : -1;

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const offset = interpolate(progress.value, [0, 1], [distance * sign, 0]);
    return {
      opacity: reducedMotion ? 1 : interpolate(progress.value, [0, 1], [0, 1]),
      transform: isVertical
        ? [{ translateY: reducedMotion ? 0 : offset }]
        : [{ translateX: reducedMotion ? 0 : offset }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// SCALE IN WRAPPER
// ============================================
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  initialScale?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScaleIn({
  children,
  delay = 0,
  initialScale = 0.9,
  style,
}: ScaleInProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, Springs.bouncy));
  }, [delay, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {
        scale: reducedMotion ? 1 : interpolate(
          progress.value,
          [0, 1],
          [initialScale, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// ZOOM IN WRAPPER
// ============================================
interface ZoomInProps {
  children: ReactNode;
  delay?: number;
  initialScale?: number;
  style?: StyleProp<ViewStyle>;
}

export function ZoomIn({
  children,
  delay = 0,
  initialScale = 0.8,
  style,
}: ZoomInProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, Springs.bouncy));
  }, [delay, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {
        scale: reducedMotion ? 1 : interpolate(
          progress.value,
          [0, 1],
          [initialScale, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// STAGGERED CHILDREN WRAPPER
// ============================================
interface StaggerProps {
  children: ReactNode[];
  staggerDelay?: number;
  direction?: SlideDirection;
  style?: StyleProp<ViewStyle>;
}

export function Stagger({
  children,
  staggerDelay = 50,
  direction = 'up',
  style,
}: StaggerProps) {
  return (
    <Animated.View style={style}>
      {React.Children.map(children, (child, index) => (
        <SlideIn
          key={index}
          direction={direction}
          delay={index * staggerDelay}
        >
          {child}
        </SlideIn>
      ))}
    </Animated.View>
  );
}

// ============================================
// BOUNCE WRAPPER
// ============================================
interface BounceProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function Bounce({
  children,
  delay = 0,
  style,
}: BounceProps) {
  const scale = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 8,
        stiffness: 200,
        mass: 0.8,
      })
    );
  }, [delay, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// PULSE WRAPPER
// ============================================
interface PulseProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

export function Pulse({
  children,
  style,
  minScale = 1,
  maxScale = 1.05,
  duration = 1000,
}: PulseProps) {
  const scale = useSharedValue(minScale);
  const hasStarted = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    if (hasStarted.current) return;
    hasStarted.current = true;

    const animate = () => {
      scale.value = withSequence(
        withTiming(maxScale, { duration: duration / 2 }),
        withTiming(minScale, { duration: duration / 2 })
      );
    };

    animate();
    const interval = setInterval(animate, duration);

    return () => clearInterval(interval);
  }, [maxScale, minScale, duration, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
