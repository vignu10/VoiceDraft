/**
 * Ambient Orb
 * Slowly morphing, floating gradient orbs that create ambient depth.
 * A refined alternative to static decorative circles.
 */

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { DimensionValue, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AmbientOrbProps {
  size: number;
  position: {
    top?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
  };
  colorStart: string;
  colorEnd: string;
  duration?: number;
  delay?: number;
}

/**
 * An ambient floating orb with gradient and subtle animation
 * Creates depth and visual interest without distraction
 */
export function AmbientOrb({
  size,
  position,
  colorStart,
  colorEnd,
  duration = 8000,
  delay = 0,
}: AmbientOrbProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.15;
      return;
    }

    // Fade in gently
    opacity.value = withDelay(
      delay,
      withTiming(0.15, { duration: 2000, easing: Easing.out(Easing.ease) }),
    );

    // Subtle breathing animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [duration, delay, reducedMotion, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.15 : opacity.value,
    transform: [{ scale: reducedMotion ? 1 : scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, ...position },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[colorStart, colorEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
  },
});
