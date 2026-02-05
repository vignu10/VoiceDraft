import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  cancelAnimation,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { Springs, Duration } from '@/constants/animations';

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

  // Animation values
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const innerScale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);

  // Recording state animations
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Outer expanding pulse rings (multi-wave effect)
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      );

      // Inner breathing animation (gentle heartbeat)
      innerScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Glow effect behind button
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1200 }),
          withTiming(0.3, { duration: 1200 })
        ),
        -1,
        true
      );

      // Ripple effect (expanding rings) - delayed start
      rippleScale.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1.8, { duration: 2000, easing: Easing.out(Easing.ease) }),
            withTiming(0.1, { duration: 200 })
          ),
          -1,
          false
        )
      );

    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      cancelAnimation(innerScale);
      cancelAnimation(glowScale);
      cancelAnimation(glowOpacity);
      cancelAnimation(rippleScale);

      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
      innerScale.value = withTiming(1);
      glowScale.value = withTiming(1);
      glowOpacity.value = withTiming(isPaused ? 0.3 : 0);
      rippleScale.value = withTiming(0);
    }
  }, [isRecording, isPaused]);

  const handlePressIn = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Quick press down animation
    scale.value = withSpring(0.92, Springs.press);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Springs.snappy);
  };

  const handlePress = () => {
    handlePressIn();
    onPress();
    setTimeout(() => handlePressOut(), 100);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const innerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: interpolate(rippleScale.value, [0, 1], [0.4, 0]),
  }));

  const getButtonColor = () => {
    if (isRecording && !isPaused) return colors.recording;
    if (isPaused) return colors.paused;
    return colors.tint;
  };

  const getIcon = () => {
    if (isPaused) return 'play';
    if (isRecording) return 'pause';
    return 'mic';
  };

  const getButtonShape = () => {
    if (isRecording && !isPaused) return size * 0.35; // Square when recording
    if (isPaused) return size * 0.4; // Slightly rounded square when paused
    return size / 2; // Circle when not recording
  };

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {/* Background glow */}
      <Animated.View
        style={[
          styles.glow,
          glowAnimatedStyle,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: getButtonColor(),
          },
        ]}
      />

      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          pulseAnimatedStyle,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: getButtonColor(),
          },
        ]}
      />

      {/* Expanding ripple rings */}
      {(isRecording && !isPaused) && (
        <Animated.View
          style={[
            styles.rippleRing,
            rippleAnimatedStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: getButtonColor(),
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
            borderColor: isRecording ? getButtonColor() : colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Pressable button */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <Animated.View
            style={[
              styles.button,
              buttonAnimatedStyle,
              {
                width: size,
                height: size,
                borderRadius: getButtonShape(),
                backgroundColor: getButtonColor(),
              },
            ]}
          >
            <Animated.View style={innerAnimatedStyle}>
              <Ionicons
                name={getIcon()}
                size={size * 0.42}
                color="#fff"
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
  },
  pulseRing: {
    position: 'absolute',
  },
  rippleRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  statusDot: {
    position: 'absolute',
    bottom: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
