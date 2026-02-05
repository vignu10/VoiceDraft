import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing, BorderRadius } from '@/constants/design-system';
import { Springs, Duration } from '@/constants/animations';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md';

interface AnimatedBadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  pulse?: boolean;
  animateEntry?: boolean;
}

export function AnimatedBadge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  pulse = false,
  animateEntry = true,
}: AnimatedBadgeProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(animateEntry ? 0 : 1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (animateEntry) {
      scale.value = withSpring(1, Springs.bouncy);
    }
  }, [animateEntry, scale]);

  useEffect(() => {
    if (pulse) {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: Duration.slow }),
        withTiming(1, { duration: Duration.slow })
      );
      const interval = setInterval(() => {
        pulseScale.value = withSequence(
          withTiming(1.1, { duration: Duration.slow }),
          withTiming(1, { duration: Duration.slow })
        );
      }, Duration.pulse);
      return () => clearInterval(interval);
    }
  }, [pulse, pulseScale]);

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'error':
        return { bg: colors.errorLight, text: colors.error };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      case 'primary':
        return { bg: colors.primaryLight, text: colors.primary };
      default:
        return { bg: colors.backgroundSecondary, text: colors.textSecondary };
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing[0.5],
          paddingHorizontal: Spacing[2],
          fontSize: Typography.fontSize.xs,
          iconSize: 12,
        };
      case 'md':
        return {
          paddingVertical: Spacing[1],
          paddingHorizontal: Spacing[3],
          fontSize: Typography.fontSize.sm,
          iconSize: 14,
        };
    }
  };

  const badgeColors = getColors();
  const badgeSizes = getSizes();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.bg,
          paddingVertical: badgeSizes.paddingVertical,
          paddingHorizontal: badgeSizes.paddingHorizontal,
        },
        animatedStyle,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={badgeSizes.iconSize}
          color={badgeColors.text}
          style={styles.icon}
        />
      )}
      <ThemedText
        style={[
          styles.text,
          {
            color: badgeColors.text,
            fontSize: badgeSizes.fontSize,
          },
        ]}
      >
        {children}
      </ThemedText>
    </Animated.View>
  );
}

// Dot indicator badge
export function BadgeDot({
  color,
  size = 8,
  pulse = false,
}: {
  color?: string;
  size?: number;
  pulse?: boolean;
}) {
  const colors = useThemeColors();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      const interval = setInterval(() => {
        pulseOpacity.value = withSequence(
          withTiming(0.4, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pulse, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || colors.primary,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  icon: {
    marginRight: Spacing[1],
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
});
