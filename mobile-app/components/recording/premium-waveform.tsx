/**
 * Premium Waveform
 * Enhanced waveform with glow effects, smooth animations,
 * and a more polished visual presentation during recording.
 */

import { useThemeColor } from "@/hooks/use-theme-color";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface PremiumWaveformProps {
  levels: number[];
  isRecording: boolean;
  isPaused?: boolean;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barCount?: number;
}

/**
 * Enhanced waveform bar with gradient and glow
 * Memoized with custom comparison for level changes only
 */
const WaveformBar = memo(
  function WaveformBar({
    level,
    maxHeight,
    isRecording,
  }: {
    level: number;
    maxHeight: number;
    isRecording: boolean;
  }) {
    const tintColor = useThemeColor({}, isRecording ? "recording" : "tint");
    const tintColorLight = useThemeColor(
      {},
      isRecording ? "recordingLight" : "primaryLight",
    );
    const reducedMotion = useReducedMotion();

    const animatedStyle = useAnimatedStyle(() => {
      // Remove minimum height - allow true silence (0) to be represented
      // Use a small minimum (2px) for visibility of very quiet sounds
      const height = Math.max(2, level * maxHeight);
      if (reducedMotion) {
        return {
          height,
        };
      }
      return {
        height: withSpring(height, {
          damping: 15,
          stiffness: 300,
        }),
      };
    });

    return (
      <Animated.View style={[styles.barWrapper, animatedStyle]}>
        <LinearGradient
          colors={[tintColor, tintColorLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.barGradient}
          disableHardwareAcceleration={true}
        />
      </Animated.View>
    );
  },
  (prev, next) => {
    // Only re-render if level changes significantly (more than 1% difference)
    return (
      Math.abs(prev.level - next.level) < 0.01 &&
      prev.isRecording === next.isRecording
    );
  },
);

/**
 * Premium waveform with:
 * - Gradient bars for visual depth
 * - Glow effect during recording
 * - Smooth spring-based animations
 * - Optimized with useMemo to prevent unnecessary array recreations
 */
export const PremiumWaveform = memo(
  function PremiumWaveform({
    levels,
    isRecording,
    isPaused = false,
    height = 120,
    barWidth = 5,
    barGap = 3,
    barCount = 24,
  }: PremiumWaveformProps) {
    const backgroundColor = useThemeColor({}, "backgroundSecondary");
    const glowColor = useThemeColor({}, "recordingLight");
    const reducedMotion = useReducedMotion();

    // Memoize display levels to prevent unnecessary re-renders of WaveformBar children
    // Remove artificial minimums - allow true silence (0) to be represented
    const displayLevels = useMemo(() => {
      if (levels.length > 0) {
        return levels
          .slice(-barCount)
          .concat(
            Array(Math.max(0, barCount - levels.length)).fill(0), // No minimum padding
          );
      }
      return Array(barCount).fill(0); // No minimum padding
    }, [levels, barCount, isRecording]);

    // Glow animation during recording
    const glowOpacity = React.useMemo(
      () => (isRecording && !isPaused && !reducedMotion ? 0.6 : 0),
      [isRecording, isPaused, reducedMotion],
    );
    const glowAnimatedStyle = useAnimatedStyle(() => ({
      opacity: withTiming(glowOpacity, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }),
    }));

    return (
      <View style={[styles.container, { height }]}>
        {/* Glow layer during recording */}
        {isRecording && !isPaused && !reducedMotion && (
          <Animated.View
            style={[
              styles.glowLayer,
              { backgroundColor: glowColor },
              glowAnimatedStyle,
            ]}
          />
        )}

        {/* Background */}
        <View style={[styles.background, { backgroundColor }]} />

        {/* Waveform bars */}
        <View style={styles.barsContainer}>
          {displayLevels.map((level, index) => (
            <View
              key={index}
              style={[
                styles.barOuter,
                { width: barWidth, marginHorizontal: barGap / 2 },
              ]}
            >
              <WaveformBar
                level={level}
                maxHeight={height * 0.9}
                isRecording={isRecording && !isPaused}
              />
            </View>
          ))}
        </View>
      </View>
    );
  },
  (prev, next) => {
    // Only re-render if these props change
    return (
      prev.isRecording === next.isRecording &&
      prev.isPaused === next.isPaused &&
      prev.height === next.height &&
      prev.barWidth === next.barWidth &&
      prev.barGap === next.barGap &&
      prev.barCount === next.barCount &&
      // Compare levels array by length and significant changes
      prev.levels.length === next.levels.length
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  barOuter: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  barWrapper: {
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  barGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 3,
  },
});
