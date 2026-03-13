/**
 * PublishSuccessModal Component
 *
 * A modal shown when a draft is successfully published.
 * Features celebration animation, URL preview, View, Share, and Close actions.
 * User must manually dismiss - no auto-dismiss.
 *
 * @module components/publish/PublishSuccessModal
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { Share } from 'react-native';

import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Duration, Springs } from '@/constants/animations';
import { useThemeColors } from '@/hooks/use-theme-color';
import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { FadeIn } from '@/components/ui/animated/animated-wrappers';

/**
 * Props for PublishSuccessModal component
 */
export interface PublishSuccessModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;
  /** The full URL of the published post */
  postUrl: string;
  /** The title of the published post (for sharing) */
  postTitle?: string;
  /** Callback when the View button is pressed */
  onViewPress?: (url: string) => void;
  /** Callback when the Share button is pressed */
  onSharePress?: (url: string, title: string) => void;
  /** Callback when the modal is dismissed (backdrop tap or close button) */
  onDismiss: () => void;
}

/** Duration for showing "Copied!" feedback */
const COPY_FEEDBACK_MS = 2000;

export function PublishSuccessModal({
  visible,
  postUrl,
  postTitle = '',
  onViewPress,
  onSharePress,
  onDismiss,
}: PublishSuccessModalProps) {
  const [copiedText, setCopiedText] = React.useState<'Copied!' | ''>('');
  const colors = useThemeColors();

  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  // Animate in when modal becomes visible
  useEffect(() => {
    if (visible) {
      if (reducedMotion.value === 1) {
        scale.value = 1;
        opacity.value = 1;
        checkmarkScale.value = 1;
        checkmarkOpacity.value = 1;
      } else {
        // Modal entrance
        scale.value = withSpring(1, Springs.modal);
        opacity.value = withTiming(1, { duration: Duration.modalEnter });

        // Checkmark animation - delay slightly for dramatic effect
        setTimeout(() => {
          checkmarkScale.value = withSpring(1, { ...Springs.gentle, damping: 12 });
          checkmarkOpacity.value = withTiming(1, { duration: 300 });
        }, 150);
      }

      // Success haptic on open
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (reducedMotion.value !== 1) {
        scale.value = withTiming(0.8, { duration: Duration.modalExit });
        opacity.value = withTiming(0, { duration: Duration.modalExit });
        checkmarkScale.value = withTiming(0, { duration: 150 });
        checkmarkOpacity.value = withTiming(0, { duration: 150 });
      } else {
        scale.value = 0.8;
        opacity.value = 0;
        checkmarkScale.value = 0;
        checkmarkOpacity.value = 0;
      }
    }
  }, [visible]);

  /**
   * Copies the post URL to clipboard with haptic feedback
   */
  const handleCopyUrl = async () => {
    try {
      await Clipboard.setStringAsync(postUrl);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedText('Copied!');

      // Reset copied text after delay
      setTimeout(() => {
        setCopiedText('');
      }, COPY_FEEDBACK_MS);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  /**
   * Opens the post URL in the default browser
   */
  const handleViewPost = async () => {
    try {
      const canOpen = await Linking.canOpenURL(postUrl);
      if (canOpen) {
        await Linking.openURL(postUrl);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        console.error('Cannot open URL:', postUrl);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
    onViewPress?.(postUrl);
  };

  /**
   * Opens the native share sheet
   */
  const handleShare = async () => {
    try {
      await Share.share({
        message: postUrl,
        url: postUrl,
        title: postTitle || 'Check out my post',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
    onSharePress?.(postUrl, postTitle);
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkOpacity.value,
  }));

  if (!visible) return null;

  // Strip protocol from URL for cleaner display
  const displayUrl = postUrl.replace('https://', '').replace('http://', '');

  return (
    <Pressable style={styles.overlay} onPress={onDismiss}>
      <Animated.View style={[styles.overlay, animatedContainerStyle]}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.modal,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                ...Shadows.xl,
              },
              animatedModalStyle,
            ]}
          >
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.iconBackground,
                  { backgroundColor: colors.successLight },
                  animatedCheckmarkStyle,
                ]}
              >
                <Ionicons name="checkmark" size={48} color={colors.success} />
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>Published!</Text>

            {/* URL Display */}
            <Pressable onPress={handleCopyUrl} style={styles.urlContainer}>
              <Text style={[styles.urlLabel, { color: colors.textSecondary }]}>
                Your post is live at:
              </Text>
              <View
                style={[
                  styles.urlBox,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="link-outline" size={18} color={colors.textTertiary} />
                <Text style={[styles.urlText, { color: colors.text }]} numberOfLines={2}>
                  {displayUrl}
                </Text>
                <Ionicons name="copy-outline" size={16} color={colors.textTertiary} />
              </View>
              <Text style={[styles.copyHint, { color: colors.textTertiary }]}>
                {copiedText || 'Tap to copy URL'}
              </Text>
            </Pressable>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <PressableScale
                onPress={handleViewPost}
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name="open-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
              </PressableScale>

              <PressableScale
                onPress={handleShare}
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Share</Text>
              </PressableScale>
            </View>

            {/* Close Button */}
            <PressableScale
              onPress={onDismiss}
              style={[styles.closeButton, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
            </PressableScale>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    paddingHorizontal: Spacing[6],
  },
  modal: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing[6],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing[4],
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing[5],
    includeFontPadding: false,
  },
  urlContainer: {
    width: '100%',
    marginBottom: Spacing[5],
  },
  urlLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: Spacing[2],
    includeFontPadding: false,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  urlText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  copyHint: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    width: '100%',
    marginBottom: Spacing[4],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.lg,
    gap: Spacing[2],
  },
  actionButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  closeButton: {
    width: '100%',
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});
