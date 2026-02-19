import { Springs } from "@/constants/animations";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useSettingsStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState, useRef } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface RecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  onPress: () => void;
  size?: number;
}

export function RecordButton({
  isRecording,
  isPaused,
  onPress,
  size = 88,
}: RecordButtonProps) {
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

  // Animation values - reduced from 7 to 3
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const innerScale = useSharedValue(1);

  // Recording state animations - optimized to use only 2 animations
  const pulseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const innerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Skip all animations if reduce motion is enabled
    if (reduceMotion) {
      pulseScale.value = 1;
      innerScale.value = 1;
      return;
    }

    if (isRecording && !isPaused) {
      // Single combined pulse animation
      const animatePulse = () => {
        pulseScale.value = withSequence(
          withTiming(1.15, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        );
      };

      // Gentle inner breathing
      const animateInner = () => {
        innerScale.value = withSequence(
          withTiming(1.05, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.98, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
        );
      };

      animatePulse();
      animateInner();

      pulseIntervalRef.current = setInterval(animatePulse, 3000);
      innerIntervalRef.current = setInterval(animateInner, 2000);
    } else {
      // Cleanup animations properly
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      if (innerIntervalRef.current) {
        clearInterval(innerIntervalRef.current);
        innerIntervalRef.current = null;
      }

      cancelAnimation(pulseScale);
      cancelAnimation(innerScale);

      pulseScale.value = withTiming(1, { duration: 200 });
      innerScale.value = withTiming(1, { duration: 200 });
    }

    // Cleanup on unmount
    return () => {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
      if (innerIntervalRef.current) {
        clearInterval(innerIntervalRef.current);
      }
      cancelAnimation(pulseScale);
      cancelAnimation(innerScale);
    };
  }, [isRecording, isPaused, reduceMotion, pulseScale, innerScale]);

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
      scale.value = withSpring(1, Springs.snappy);
    }
  }, [reduceMotion, scale]);

  const handlePress = useCallback(() => {
    handlePressIn();
    onPress();
    if (!reduceMotion) {
      setTimeout(() => handlePressOut(), 100);
    }
  }, [onPress, handlePressIn, handlePressOut, reduceMotion]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: reduceMotion
      ? 0
      : withTiming(isRecording && !isPaused ? 0.4 : 0, { duration: 200 }),
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  // Memoize style calculations
  const buttonColor = useCallback(() => {
    if (isRecording && !isPaused) return colors.recording;
    if (isPaused) return colors.paused;
    return colors.tint;
  }, [isRecording, isPaused, colors.recording, colors.paused, colors.tint]);

  const iconName = useCallback(() => {
    if (isPaused) return "play";
    if (isRecording) return "pause";
    return "mic";
  }, [isPaused, isRecording]);

  const buttonShape = useCallback(() => {
    if (isRecording && !isPaused) return size * 0.35;
    if (isPaused) return size * 0.4;
    return size / 2;
  }, [isRecording, isPaused, size]);


  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {/* Single optimized pulse ring */}
      {isRecording && !isPaused && (
        <Animated.View
          style={[
            styles.pulseRing,
            pulseAnimatedStyle,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size * 0.75,
              backgroundColor: buttonColor(),
            },
          ]}
        />
      )}

      {/* Main button container */}
      <View
        style={[
          styles.buttonContainer,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            borderColor: isRecording ? buttonColor() : colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Pressable button */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityState={{
            selected: isRecording,
          }}
          accessibilityLabel={
            isRecording
              ? isPaused
                ? "Resume recording"
                : "Pause recording"
              : "Start recording"
          }
        >
          <Animated.View
            style={[
              styles.button,
              buttonAnimatedStyle,
              {
                width: size,
                height: size,
                borderRadius: buttonShape(),
                backgroundColor: buttonColor(),
                shadowColor: colors.shadowColorStrong,
              },
            ]}
          >
            <Animated.View style={innerAnimatedStyle}>
              <Ionicons
                name={iconName()}
                size={size * 0.42}
                color={colors.textInverse}
              />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>

      {/* Status indicator dot */}
      {isRecording && (
        <Animated.View
          style={[
            styles.statusDot,
            {
              backgroundColor: isPaused ? colors.paused : colors.recording,
            },
            innerAnimatedStyle,
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
  pulseRing: {
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
