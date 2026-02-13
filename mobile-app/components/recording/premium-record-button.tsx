/**
 * Premium Record Button
 * Enhanced record button with multi-layer glow, audio-reactive pulse,
 * and satisfying physics-based interactions for the recording screen.
 */

import { Springs } from "@/constants/animations";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useSettingsStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  createAnimatedComponent,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = createAnimatedComponent(Pressable);

interface PremiumRecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  onPress: () => void;
  size?: number;
}

/**
 * Premium record button with:
 * - Multi-layer glow effect (outer glow + inner accent)
 * - Expanding ring animation on press
 * - Audio-reactive breathing during recording
 * - Smooth shape morphing transitions
 * - Haptic feedback integration
 */
export function PremiumRecordButton({
  isRecording,
  isPaused,
  onPress,
  size = 88,
}: PremiumRecordButtonProps) {
  const hapticFeedback = useSettingsStore((state) => state.hapticFeedback);
  const colors = useThemeColors();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Check for reduce motion preference
  useEffect(() => {
    const checkReduceMotion = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isEnabled);
    };
    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription?.remove();
  }, []);

  // Animation values
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const buttonShape = useSharedValue(1); // 1 = circle, 0.35 = rounded square

  // Recording animation refs
  const pulseIntervalRef = useRef<number | null>(null);

  // Recording state animations
  useEffect(() => {
    if (reduceMotion) {
      glowOpacity.value = isRecording && !isPaused ? 0.3 : 0;
      buttonShape.value = withSpring(isRecording && !isPaused ? 0.35 : 1, {
        damping: 20,
        stiffness: 150,
      });
      return;
    }

    if (isRecording && !isPaused) {
      // Fade in glow
      glowOpacity.value = withTiming(0.4, { duration: 300 });

      // Morph to rounded square
      buttonShape.value = withSpring(0.35, { damping: 18, stiffness: 150 });

      // Breathing animation for glow
      const animatePulse = () => {
        glowScale.value = withSequence(
          withTiming(1.1, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        );
      };

      animatePulse();
      pulseIntervalRef.current = setInterval(animatePulse, 3000);
    } else {
      // Clear interval
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }

      // Fade out glow
      glowOpacity.value = withTiming(0, { duration: 200 });

      // Morph back to circle
      buttonShape.value = withSpring(1, { damping: 20, stiffness: 180 });
    }

    return () => {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, [
    isRecording,
    isPaused,
    reduceMotion,
    glowOpacity,
    buttonShape,
    glowScale,
  ]);

  const handlePressIn = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!reduceMotion) {
      scale.value = withSpring(0.92, Springs.press);
    }
  }, [hapticFeedback, reduceMotion, scale]);

  const handlePressOut = useCallback(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, Springs.gentle);

      // Trigger expanding ring effect
      ringOpacity.value = withSequence(
        withTiming(0.5, { duration: 50 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }),
      );
      ringScale.value = withSequence(
        withTiming(1.4, { duration: 500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }),
      );
    }
  }, [reduceMotion, ringOpacity, ringScale, scale]);

  const handlePress = useCallback(() => {
    handlePressIn();
    onPress();
    if (!reduceMotion) {
      setTimeout(() => handlePressOut(), 100);
    }
  }, [onPress, handlePressIn, handlePressOut, reduceMotion]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? isRecording && !isPaused
        ? 0.3
        : 0
      : glowOpacity.value,
    transform: [{ scale: reduceMotion ? 1 : glowScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const shapeStyle = useAnimatedStyle(() => ({
    borderRadius: size * 0.5 * buttonShape.value,
  }));

  // Determine colors
  const buttonColor =
    isRecording && !isPaused
      ? colors.recording
      : isPaused
        ? colors.paused
        : colors.tint;
  const glowColor =
    isRecording && !isPaused ? colors.recordingLight : colors.primaryLight;

  const iconName = isPaused ? "play" : isRecording ? "pause" : "mic";

  return (
    <View style={[styles.container, { width: size * 2.2, height: size * 2.2 }]}>
      {/* Outer expanding ring */}
      {!reduceMotion && (
        <Animated.View
          style={[
            styles.expandingRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              borderColor: buttonColor,
            },
            ringStyle,
          ]}
        />
      )}

      {/* Multi-layer glow */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: size + 50,
            height: size + 50,
            borderRadius: (size + 50) / 2,
            backgroundColor: glowColor,
          },
          glowStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.glowLayer,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            backgroundColor: buttonColor,
            opacity: 0.15,
          },
          glowStyle,
        ]}
      />

      {/* Main button with shape morphing */}
      <View
        style={[
          styles.buttonContainer,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: size * 0.575,
            borderColor: isRecording ? buttonColor : colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityState={{ selected: isRecording }}
          accessibilityLabel={
            isRecording
              ? isPaused
                ? "Resume recording"
                : "Pause recording"
              : "Start recording"
          }
          style={[styles.button, { width: size, height: size }, buttonStyle]}
        >
          <Animated.View
            style={[
              styles.buttonInner,
              {
                backgroundColor: buttonColor,
                shadowColor: buttonColor,
              },
              shapeStyle,
            ]}
          >
            <Ionicons
              name={iconName}
              size={size * 0.42}
              color={colors.textInverse}
            />
          </Animated.View>
        </AnimatedPressable>
      </View>

      {/* Status indicator dot */}
      {isRecording && (
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isPaused ? colors.paused : colors.recording },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  expandingRing: {
    position: "absolute",
    borderWidth: 2,
  },
  glowLayer: {
    position: "absolute",
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  statusDot: {
    position: "absolute",
    bottom: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
