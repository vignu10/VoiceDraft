/**
 * Waveform View - Clean Implementation
 *
 * A fresh, optimized waveform visualization that:
 * - Shows true silence (flat line when quiet)
 * - Responds dynamically to voice levels
 * - Uses smooth animations
 * - No artificial minimums or padding
 */

import { useThemeColor } from "@/hooks/use-theme-color";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface WaveformViewProps {
  levels: number[];
  isRecording: boolean;
  height?: number;
  barCount?: number;
  barWidth?: number;
  barGap?: number;
}

/**
 * Individual waveform bar with smooth animations
 */
const WaveformBar = memo(function WaveformBar({
  level,
  maxHeight,
  isActive,
}: {
  level: number;
  maxHeight: number;
  isActive: boolean;
}) {
  const height = useSharedValue(0);

  // Update height when level changes
  useDerivedValue(() => {
    const targetHeight = level * maxHeight;
    height.value = withSpring(targetHeight, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
  }, [level, maxHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${Math.max(0, height.value)}px`,
  }));

  const tintColor = useThemeColor({}, isActive ? "recording" : "tint");
  const tintColorLight = useThemeColor({}, isActive ? "recordingLight" : "primaryLight");

  return (
    <Animated.View style={[styles.barContainer, animatedStyle]}>
      <LinearGradient
        colors={[tintColor, tintColorLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.barGradient}
        disableHardwareAcceleration={true}
      />
    </Animated.View>
  );
});

/**
 * Main waveform component
 */
export const WaveformView = memo(function WaveformView({
  levels,
  isRecording,
  height = 120,
  barCount = 32,
  barWidth = 4,
  barGap = 3,
}: WaveformViewProps) {
  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const glowColor = useThemeColor({}, "recordingLight");

  // Prepare display levels - no artificial padding
  const displayLevels = useMemo(() => {
    if (levels.length > 0) {
      // Take the most recent levels
      const recent = levels.slice(-barCount);
      // Pad with zeros (true silence)
      return [...recent, ...Array(barCount - recent.length).fill(0)];
    }
    return Array(barCount).fill(0);
  }, [levels, barCount]);

  return (
    <View style={[styles.container, { height }]} accessible={true}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor }]} />

      {/* Waveform bars */}
      <View style={styles.barsContainer}>
        {displayLevels.map((level, index) => (
          <View
            key={`${index}-${level}`}
            style={[
              styles.barWrapper,
              {
                width: barWidth,
                marginHorizontal: barGap / 2,
              },
            ]}
          >
            <WaveformBar
              level={level}
              maxHeight={height * 0.85}
              isActive={isRecording}
            />
          </View>
        ))}
      </View>

      {/* Recording glow effect */}
      {isRecording && (
        <View style={[styles.glowOverlay, { backgroundColor: glowColor }]} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: "100%",
  },
  barWrapper: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  barContainer: {
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
    minHeight: 0, // Allow true silence
  },
  barGradient: {
    width: "100%",
    height: "100%",
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    pointerEvents: "none",
  },
});
