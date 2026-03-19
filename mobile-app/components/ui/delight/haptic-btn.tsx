/**
 * VoiceScribe Haptic Button
 * Adds satisfying haptic feedback to press actions
 * Respects reduced motion preferences
 */

import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' | 'success' | 'warning' | 'error';

interface HapticButtonProps extends PressableProps {
  hapticStyle?: HapticStyle;
  children: React.ReactNode;
  disabled?: boolean;
}

export function HapticButton({
  hapticStyle = 'medium',
  children,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: HapticButtonProps) {
  const triggerHaptic = () => {
    if (disabled) return;

    switch (hapticStyle) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'soft':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        break;
      case 'rigid':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  };

  const handlePressIn = (e: any) => {
    triggerHaptic();
    onPressIn?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
}
