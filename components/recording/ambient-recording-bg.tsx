/* eslint-disable import/no-duplicates */
/**
 * Ambient Recording Background
 * Creates a subtle, animated background during recording with the recording color theme.
 * Adds visual depth and makes the recording experience feel more immersive.
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useThemeColors } from "@/hooks/use-theme-color";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { useReducedMotion } from "react-native-reanimated";

interface AmbientRecordingBgProps {
  isRecording: boolean;
  isPaused: boolean;
}

/**
 * Ambient background that activates during recording
 * - Subtle gradient orbs that breathe
 * - Recording-themed colors (coral/pink when active)
 * - Smooth fade in/out based on recording state
 * - Memoized to prevent unnecessary re-renders
 */
export const AmbientRecordingBg = memo(
  function AmbientRecordingBg({
    isRecording,
    isPaused,
  }: AmbientRecordingBgProps) {
    const colors = useThemeColors();
    const reducedMotion = useReducedMotion();

    // Memoize colors to prevent recalculating on every render
    const orb1Colors = useMemo(
      () =>
        [
          colors.recordingLight,
          colors.errorMuted || colors.recordingLight,
        ] as const,
      [colors.recordingLight, colors.errorMuted],
    );
    const orb2Colors = useMemo(
      () =>
        [colors.accentLight, colors.errorMuted || colors.accentLight] as const,
      [colors.accentLight, colors.errorMuted],
    );

    // Animation values for multiple orbs
    const opacity1 = useSharedValue(0);
    const scale1 = useSharedValue(1);
    const opacity2 = useSharedValue(0);
    const scale2 = useSharedValue(1);

    useEffect(() => {
      if (reducedMotion || !isRecording || isPaused) {
        // Fade out when not recording or paused
        opacity1.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.ease),
        });
        opacity2.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.ease),
        });
        return;
      }

      // Fade in when recording starts
      opacity1.value = withTiming(0.12, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      });
      opacity2.value = withDelay(
        400,
        withTiming(0.08, { duration: 800, easing: Easing.out(Easing.ease) }),
      );

      // Breathing animation for orb 1
      scale1.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );

      // Breathing animation for orb 2 (slightly offset)
      scale2.value = withDelay(
        1250,
        withRepeat(
          withSequence(
            withTiming(1.2, {
              duration: 2500,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration: 2500,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          false,
        ),
      );
    }, [
      isRecording,
      isPaused,
      reducedMotion,
      opacity1,
      opacity2,
      scale1,
      scale2,
    ]);

    const orb1Style = useAnimatedStyle(() => ({
      opacity: reducedMotion ? 0 : opacity1.value,
      transform: [{ scale: reducedMotion ? 1 : scale1.value }],
    }));

    const orb2Style = useAnimatedStyle(() => ({
      opacity: reducedMotion ? 0 : opacity2.value,
      transform: [{ scale: reducedMotion ? 1 : scale2.value }],
    }));

    if (reducedMotion) return null;

    return (
      <View style={styles.container} pointerEvents="none">
        {/* Top right orb - recording color */}
        <Animated.View
          style={[
            styles.orb,
            { top: -120, right: -80, width: 320, height: 320 },
            orb1Style,
          ]}
        >
          <LinearGradient
            colors={orb1Colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>

        {/* Bottom left orb - accent color */}
        <Animated.View
          style={[
            styles.orb,
            { bottom: -100, left: -60, width: 280, height: 280 },
            orb2Style,
          ]}
        >
          <LinearGradient
            colors={orb2Colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
    );
  },
  (prev, next) => {
    // Only re-render when recording state actually changes
    return (
      prev.isRecording === next.isRecording && prev.isPaused === next.isPaused
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
  },
});
