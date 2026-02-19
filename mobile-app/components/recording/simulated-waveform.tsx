/**
 * Simulated Waveform - Simple, Reliable Recording Visualization
 *
 * Uses plain React state and CSS-like transitions for maximum reliability.
 */

import { useThemeColor } from "@/hooks/use-theme-color";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface SimulatedWaveformProps {
  isRecording: boolean;
  height?: number;
  barCount?: number;
  barWidth?: number;
  barGap?: number;
}

/**
 * Individual waveform bar
 */
const WaveformBar = memo(function WaveformBar({
  isActive,
  maxHeight,
}: {
  isActive: boolean;
  maxHeight: number;
}) {
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    if (isActive) {
      // Create animation interval
      const interval = setInterval(() => {
        // Random height between 20% and 85% of max
        const newHeight = Math.random() * 0.65 + 0.20;
        setBarHeight(newHeight);
      }, 150 + Math.random() * 100); // Random timing for each bar

      return () => clearInterval(interval);
    } else {
      setBarHeight(0);
    }
  }, [isActive]);

  const tintColor = useThemeColor({}, isActive ? "recording" : "tint");
  const tintColorLight = useThemeColor({}, isActive ? "recordingLight" : "primaryLight");

  // Calculate actual height in pixels (minimum 8px for visibility)
  const actualHeight = Math.max(8, barHeight * maxHeight);

  return (
    <View style={[styles.barContainer, { height: actualHeight }]}>
      <LinearGradient
        colors={[tintColor, tintColorLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.barGradient}
        disableHardwareAcceleration={true}
      />
    </View>
  );
});

/**
 * Main simulated waveform component
 */
export const SimulatedWaveform = memo(function SimulatedWaveform({
  isRecording,
  height = 120,
  barCount = 40,
  barWidth = 4,
  barGap = 2,
}: SimulatedWaveformProps) {
  const backgroundColor = useThemeColor({}, "backgroundSecondary");
  const glowColor = useThemeColor({}, "recordingLight");

  return (
    <View style={[styles.container, { height }]} accessible={true}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor }]} />

      {/* Waveform bars */}
      <View style={styles.barsContainer}>
        {Array.from({ length: barCount }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.barWrapper,
              {
                width: barWidth,
                marginHorizontal: barGap / 2,
              },
            ]}
          >
            <WaveformBar
              isActive={isRecording}
              maxHeight={height * 0.85}
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
    minHeight: 0,
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
