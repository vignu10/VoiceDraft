import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

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

  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const innerScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Outer pulse ring
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1200 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      );
      // Inner breathing animation
      innerScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(0.95, { duration: 800 })
        ),
        -1,
        true
      );
      // Slow rotation for recording indicator ring
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      cancelAnimation(innerScale);
      cancelAnimation(rotation);
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
      innerScale.value = withTiming(1);
      rotation.value = withTiming(0);
    }
  }, [isRecording, isPaused, pulseScale, pulseOpacity, innerScale, rotation]);

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withSpring(0.92, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    onPress();
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

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
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

  return (
    <View style={[styles.container, { width: size * 1.8, height: size * 1.8 }]}>
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

      {/* Rotating dashed ring when recording */}
      {isRecording && !isPaused && (
        <Animated.View
          style={[
            styles.rotatingRing,
            ringAnimatedStyle,
            {
              width: size * 1.35,
              height: size * 1.35,
              borderRadius: size * 0.675,
              borderColor: getButtonColor(),
            },
          ]}
        />
      )}

      {/* Outer ring */}
      <View
        style={[
          styles.outerRing,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            borderColor: isRecording ? getButtonColor() : colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Main button */}
        <Pressable onPress={handlePress}>
          <Animated.View
            style={[
              styles.button,
              buttonAnimatedStyle,
              {
                width: size,
                height: size,
                borderRadius: isRecording && !isPaused ? size * 0.3 : size / 2,
                backgroundColor: getButtonColor(),
              },
            ]}
          >
            <Animated.View style={innerAnimatedStyle}>
              <Ionicons
                name={getIcon()}
                size={size * 0.4}
                color="#fff"
              />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>

      {/* Status indicator */}
      {isRecording && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isPaused ? colors.paused : colors.recording,
              bottom: 8,
            },
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
  pulseRing: {
    position: 'absolute',
  },
  rotatingRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  outerRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  statusDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
