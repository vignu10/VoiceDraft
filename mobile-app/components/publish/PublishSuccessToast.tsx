/**
 * PublishSuccessToast Component
 *
 * A toast notification shown when a draft is successfully published.
 * Displays the published post URL with options to copy, view, and share.
 *
 * Features:
 * - Auto-dismiss after 5 seconds
 * - Copy URL to clipboard with haptic feedback
 * - View and Share action buttons
 * - Smooth slide-in/slide-out animations
 * - Theme-aware colors
 * - Memory leak prevention with proper timer cleanup
 *
 * @example
 * ```tsx
 * <PublishSuccessToast
 *   visible={showToast}
 *   postUrl="https://vogn.ai/posts/abc123"}
 *   onViewPress={() => router.push(postUrl)}
 *   onSharePress={() => share(postUrl)}
 *   onDismiss={() => setShowToast(false)}
 * />
 * ```
 */

import { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Duration, Springs } from '@/constants/animations';
import { useThemeColors } from '@/hooks/use-theme-color';
import { PressableScale } from '@/components/ui/animated/pressable-scale';

/**
 * Props for PublishSuccessToast component
 */
export interface PublishSuccessToastProps {
  /** Whether the toast is currently visible */
  visible: boolean;
  /** The full URL of the published post */
  postUrl: string;
  /** Callback when the View button is pressed */
  onViewPress: () => void;
  /** Callback when the Share button is pressed */
  onSharePress: () => void;
  /** Callback when the toast is dismissed (auto-dismiss or manual) */
  onDismiss: () => void;
}

/** Auto-dismiss duration in milliseconds */
const AUTO_DISMISS_MS = 5000;

/** Duration for showing "Copied!" feedback */
const COPY_FEEDBACK_MS = 2000;

export function PublishSuccessToast({
  visible,
  postUrl,
  onViewPress,
  onSharePress,
  onDismiss,
}: PublishSuccessToastProps) {
  const [copiedText, setCopiedText] = useState<'Copied!' | ''>('');
  const colors = useThemeColors();

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  // Timer refs for cleanup to prevent memory leaks
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // Animate in
      translateY.value = withSpring(0, Springs.gentle);
      opacity.value = withTiming(1, { duration: Duration.fast });

      // Set up auto-dismiss timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      autoDismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
    } else {
      // Reset animation state
      handleDismiss();
    }
  }, [visible]);

  /**
   * Handles toast dismissal with slide-out animation
   * Properly wrapped for use in worklets and callbacks
   */
  const handleDismiss = () => {
    'worklet';
    translateY.value = withSpring(-100, Springs.gentle);
    opacity.value = withTiming(0, { duration: Duration.fast }, () => {
      runOnJS(onDismiss)();
    });
  };

  /**
   * Copies the post URL to clipboard with haptic feedback
   * Shows "Copied!" confirmation for 2 seconds
   */
  const handleCopyUrl = async () => {
    try {
      await Clipboard.setStringAsync(postUrl);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedText('Copied!');

      // Clear previous timer if exists
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }

      // Reset copied text after delay
      copyFeedbackTimerRef.current = setTimeout(() => {
        setCopiedText('');
      }, COPY_FEEDBACK_MS);
    } catch (error) {
      // Silently fail if clipboard access is denied
      console.error('Failed to copy URL:', error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  // Strip protocol from URL for cleaner display
  const displayUrl = postUrl.replace('https://', '').replace('http://', '');

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <PressableScale
        onPress={handleCopyUrl}
        style={[styles.toastContent, { backgroundColor: colors.surface }]}
        haptic
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.success }]}>Published!</Text>
          <Text style={[styles.url, { color: colors.text }]} numberOfLines={2}>
            {displayUrl}
          </Text>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {copiedText || 'Tap to copy URL'}
          </Text>
        </View>
        <View style={styles.actions}>
          <PressableScale onPress={onViewPress} style={styles.actionButton}>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
          </PressableScale>
          <PressableScale onPress={onSharePress} style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Share</Text>
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: Spacing[4],
  },
  toastContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.xl,
  },
  successIcon: {
    marginRight: Spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  url: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[1],
  },
  hint: {
    fontSize: Typography.fontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
