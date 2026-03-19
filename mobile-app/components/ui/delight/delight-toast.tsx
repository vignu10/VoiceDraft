/**
 * VoiceScribe Delight Toast
 * Subtle, warm feedback for micro-interactions
 * Brand-aligned: quick (< 1 second), refined, accessible
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Duration, Springs } from '@/constants/animations';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

export type DelightToastType = 'success' | 'info' | 'celebration';

interface DelightToastProps {
  visible: boolean;
  message: string;
  type?: DelightToastType;
  duration?: number;
  onComplete?: () => void;
}

export function DelightToast({
  visible,
  message,
  type = 'success',
  duration = 1200,
  onComplete,
}: DelightToastProps) {
  const [show, setShow] = useState(false);
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const colors = useThemeColors();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cleanup any existing timer on unmount or when visibility changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible && !show) {
      setShow(true);

      // Animate in with spring
      translateY.value = withSpring(0, Springs.gentle);
      opacity.value = withTiming(1, { duration: Duration.fast });
      scale.value = withSpring(1, Springs.bouncy);

      // Animate out and complete - track timer for cleanup
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        translateY.value = withTiming(-20, { duration: Duration.normal });
        opacity.value = withTiming(0, { duration: Duration.fast }, () => {
          'worklet';
          runOnJS(setShow)(false);
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, duration);
    } else if (!visible) {
      setShow(false);
      translateY.value = 50;
      opacity.value = 0;
      scale.value = 0.8;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration, show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'celebration':
        return 'sparkles';
      case 'info':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'celebration':
        return colors.accent;
      case 'info':
        return colors.info;
      default:
        return colors.success;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'celebration':
        return colors.accentLight;
      case 'info':
        return colors.infoLight;
      default:
        return colors.successLight;
    }
  };

  if (!show) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: getBgColor(),
            borderColor: getIconColor(),
          },
          animatedStyle,
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: getBgColor() }]}>
          <Ionicons name={getIcon()} size={20} color={getIconColor()} />
        </View>
        <ThemedText style={[styles.message, { color: colors.text }]}>
          {message}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: Spacing[6],
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    ...Shadows.md,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
});

// ============================================
// HOOK FOR EASY TOAST USAGE
// ============================================

interface ToastState {
  visible: boolean;
  message: string;
  type: DelightToastType;
}

let toastSetter: React.Dispatch<React.SetStateAction<ToastState>> | null = null;

export function useDelightToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    toastSetter = setToast;
    return () => {
      toastSetter = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showToast = (message: string, type: DelightToastType = 'success') => {
    if (toastSetter) {
      toastSetter({ visible: true, message, type });
      // Auto-hide after duration - track timer for cleanup
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        if (toastSetter) {
          toastSetter((prev) => ({ ...prev, visible: false }));
        }
      }, 1200);
    }
  };

  return {
    toast,
    showToast,
  };
}

/**
 * Convenience function to show toast from anywhere
 * Note: Only works if a component using useDelightToast is mounted
 * WARNING: setTimeout is not tracked here - for component-level use, prefer useDelightToast hook
 */
export function showDelightToast(message: string, type: DelightToastType = 'success') {
  if (toastSetter) {
    toastSetter({ visible: true, message, type });
    // Note: This timeout cannot be tracked globally, but it's acceptable for a singleton toast
    setTimeout(() => {
      if (toastSetter) {
        toastSetter((prev) => ({ ...prev, visible: false }));
      }
    }, 1200);
  }
}
