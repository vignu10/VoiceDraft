import React, { ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Duration } from '@/constants/animations';

interface GlowEffectProps {
  children: ReactNode;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlowEffect({
  children,
  color,
  intensity = 'medium',
  animated = true,
  style,
}: GlowEffectProps) {
  const colors = useThemeColors();
  const glowOpacity = useSharedValue(animated ? 0.4 : 0.6);

  const glowColor = color || colors.primary;

  const getIntensityConfig = () => {
    switch (intensity) {
      case 'low':
        return { radius: 8, opacity: 0.3 };
      case 'medium':
        return { radius: 16, opacity: 0.5 };
      case 'high':
        return { radius: 24, opacity: 0.7 };
    }
  };

  const config = getIntensityConfig();
  const glowIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (animated) {
      const animateGlow = () => {
        glowOpacity.value = withSequence(
          withTiming(config.opacity, {
            duration: Duration.pulse / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.2, {
            duration: Duration.pulse / 2,
            easing: Easing.inOut(Easing.ease),
          })
        );
      };

      animateGlow();
      glowIntervalRef.current = setInterval(animateGlow, Duration.pulse);
    } else {
      if (glowIntervalRef.current) {
        clearInterval(glowIntervalRef.current);
        glowIntervalRef.current = null;
      }
    }

    return () => {
      if (glowIntervalRef.current) {
        clearInterval(glowIntervalRef.current);
      }
    };
  }, [animated, config.opacity, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  return (
    <View style={style}>
      <Animated.View
        style={[
          styles.glow,
          {
            shadowColor: glowColor,
            shadowRadius: config.radius,
          },
          glowStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// Ring glow that expands outward
interface GlowRingProps {
  size: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function GlowRing({ size, color, style }: GlowRingProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  const ringColor = color || colors.primary;

  useEffect(() => {
    const animateRing = () => {
      scale.value = withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) });
    };

    animateRing();

    // Reset after each animation cycle
    const interval = setInterval(() => {
      scale.value = 1;
      opacity.value = 0.6;
      animateRing();
    }, 1500);

    return () => clearInterval(interval);
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: ringColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
