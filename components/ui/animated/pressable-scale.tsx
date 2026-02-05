import React, { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Springs } from '@/constants/animations';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  scale?: number;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
}

export function PressableScale({
  children,
  scale = 0.97,
  style,
  onPress,
  haptic = true,
  hapticStyle = 'light',
  disabled,
  ...props
}: PressableScaleProps) {
  const scaleValue = useSharedValue(1);
  const hapticFeedback = useSettingsStore((state) => state.hapticFeedback);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = () => {
    scaleValue.value = withSpring(scale, Springs.press);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, Springs.press);
  };

  const handlePress = (event: any) => {
    if (haptic && hapticFeedback) {
      const style = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticStyle];
      Haptics.impactAsync(style);
    }
    onPress?.(event);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[animatedStyle, style, disabled && { opacity: 0.5 }]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
