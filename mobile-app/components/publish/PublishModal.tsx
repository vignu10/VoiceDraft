/**
 * PublishModal Component
 *
 * A full-screen modal component for publishing drafts to blog posts.
 * Features backdrop blur overlay, URL preview, validation warnings,
 * and loading states during publish operations.
 *
 * @module components/publish/PublishModal
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-color';
import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { FadeIn } from '@/components/ui/animated/animated-wrappers';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Duration, Springs } from '@/constants/animations';
import { generateBlogUrl } from '@/utils/url-utils';
import { countWords } from '@/utils/formatters';
import { publishPost } from '@/services/api/posts';
import type { Draft } from '@/types/draft';
import { MIN_WORD_COUNT_WARNING } from '@/constants/config';

const AnimatedView = Animated.View;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Props for the PublishModal component
 */
export interface PublishModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** The draft to be published (can be null if no draft selected) */
  draft: Draft | null;
  /** The URL prefix for the journal (e.g., 'johns-tech-blog') */
  journalUrlPrefix: string;
  /** Callback function called when publish succeeds with the published post URL */
  onPublishSuccess: (postUrl: string) => void;
  /** Callback function called when publish fails with error details */
  onError?: (error: Error) => void;
  /** Callback function called when publish operation starts */
  onPublishStart?: () => void;
  /** Callback function called when publish operation ends (success or failure) */
  onPublishEnd?: () => void;
}

/**
 * PublishModal Component
 *
 * Displays a modal with:
 * - Modal title "Publish to Blog"
 * - Preview of blog URL where post will appear
 * - Validation warnings for incomplete posts
 * - Cancel and Publish buttons
 * - Loading state during publish operation
 *
 * @example
 * ```tsx
 * <PublishModal
 *   visible={showPublishModal}
 *   onClose={() => setShowPublishModal(false)}
 *   draft={selectedDraft}
 *   journalUrlPrefix="johns-tech-blog"
 *   onPublishSuccess={(url) => console.log('Published to:', url)}
 * />
 * ```
 */
export function PublishModal({
  visible,
  onClose,
  draft,
  journalUrlPrefix,
  onPublishSuccess,
  onError,
  onPublishStart,
  onPublishEnd,
}: PublishModalProps) {
  const colors = useThemeColors();
  const [isPublishing, setIsPublishing] = useState(false);

  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  // Animate in when modal becomes visible
  // Cleanup animations on unmount to prevent memory leaks
  React.useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        // Skip animations for reduced motion
        scale.value = 1;
        opacity.value = 1;
      } else {
        scale.value = withSpring(1, Springs.modal);
        opacity.value = withTiming(1, { duration: Duration.modalEnter });
      }
    } else {
      if (!reducedMotion) {
        scale.value = withTiming(0.9, { duration: Duration.modalExit });
        opacity.value = withTiming(0, { duration: Duration.modalExit });
      } else {
        scale.value = 0.9;
        opacity.value = 0;
      }
    }

    // Cleanup function to cancel ongoing animations
    return () => {
      // Reanimated will automatically clean up animations when component unmounts
      // This return ensures React's cleanup rules are followed
    };
  }, [visible, reducedMotion]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  /**
   * Validates the draft and returns appropriate warning message
   * Returns null if no warnings
   */
  type ValidationWarning = { type: 'warning' | 'error'; message: string };

  const getValidationWarning = (): ValidationWarning | null => {
    // Early return: no draft
    if (!draft) {
      return { type: 'error', message: 'No draft selected' };
    }

    // Early return: empty content
    const hasContent = draft.content && draft.content.trim().length > 0;
    if (!hasContent) {
      return { type: 'error', message: 'Post is empty' };
    }

    // Early return: missing title
    if (!draft.title || draft.title.trim().length === 0) {
      return { type: 'warning', message: 'No title set' };
    }

    // Early return: very short content - calculate from content directly
    const wordCount = countWords(draft.content);
    if (wordCount < MIN_WORD_COUNT_WARNING) {
      return { type: 'warning', message: `Post is very short (${wordCount}/${MIN_WORD_COUNT_WARNING} words)` };
    }

    // No warnings
    return null;
  };

  /**
   * Determines if the publish button should be disabled
   * Disabled when: no draft, empty content, or currently publishing
   */
  const isPublishDisabled = (): boolean => {
    if (!draft || isPublishing) {
      return true;
    }

    const warning = getValidationWarning();
    // Disable only for error-level warnings (empty content)
    return warning?.type === 'error';
  };

  /**
   * Generates the blog URL for the draft
   * Uses draft id as slug fallback
   */
  const getBlogUrl = (): string => {
    if (!draft) return '';

    // Use draft id as slug (backend will generate proper slug)
    const slug = draft.id;
    return generateBlogUrl(journalUrlPrefix, slug);
  };

  /**
   * Handles the publish action
   * - Validates draft
   * - Calls publish API
   * - Triggers haptic feedback on success
   * - Calls onPublishSuccess with published URL
   */
  const handlePublish = async () => {
    if (!draft || isPublishing) return;

    // Check for server ID (required for publishing)
    if (!draft.serverId) {
      console.error('Cannot publish draft: no server ID');
      return;
    }

    onPublishStart?.();
    setIsPublishing(true);

    try {
      // Call publish API
      const publishedPost = await publishPost(draft.serverId);

      // Trigger success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Generate the published post URL
      const postUrl = generateBlogUrl(journalUrlPrefix, publishedPost.slug);

      // Call success callback
      onPublishSuccess(postUrl);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to publish post:', error);
      // Trigger error haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Call error callback with user-friendly error message
      const errorObj = error instanceof Error ? error : new Error('Failed to publish post');
      if (onError) {
        onError(errorObj);
      }
    } finally {
      setIsPublishing(false);
      onPublishEnd?.();
    }
  };

  const validationWarning = getValidationWarning();
  const blogUrl = getBlogUrl();
  const wordCount = draft?.content ? countWords(draft.content) : 0;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <AnimatedView style={[styles.overlay, animatedContainerStyle]}>
        {/* Backdrop blur overlay */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 50 : 20}
          tint="dark"
          style={styles.blurOverlay}
        >
          <Pressable style={styles.pressableOverlay} onPress={onClose}>
            <FadeIn delay={0}>
              <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                <AnimatedView
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
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Publish to Blog</Text>
                    {draft && (
                      <View style={styles.headerMeta}>
                        <Text style={[styles.headerMetaText, { color: colors.textTertiary }]}>
                          {wordCount} words · {draft.title || 'Untitled'}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  </View>

                  {/* Main Content */}
                  <View style={styles.mainContent}>
                    {/* URL Preview */}
                    <View style={styles.urlSection}>
                      <View
                        style={[
                          styles.urlPreview,
                          {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="link-outline"
                          size={18}
                          color={colors.textTertiary}
                        />
                        <Text style={[styles.urlText, { color: colors.text }]} numberOfLines={1}>
                          {blogUrl}
                        </Text>
                      </View>
                    </View>

                    {/* Validation Warning */}
                    {validationWarning && (
                      <View
                        style={[
                          styles.warningBox,
                          {
                            backgroundColor:
                              validationWarning.type === 'error'
                                ? colors.errorLight
                                : colors.warningLight,
                            borderColor:
                              validationWarning.type === 'error'
                                ? colors.errorMuted
                                : colors.warningMuted,
                          },
                        ]}
                      >
                        <Ionicons
                          name={validationWarning.type === 'error' ? 'alert-circle' : 'warning'}
                          size={18}
                          color={
                            validationWarning.type === 'error' ? colors.error : colors.warning
                          }
                        />
                        <Text
                          style={[
                            styles.warningText,
                            {
                              color:
                                validationWarning.type === 'error'
                                  ? colors.error
                                  : colors.warning,
                            },
                          ]}
                        >
                          {validationWarning.message}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Footer with buttons */}
                  <View style={[styles.footer, { borderTopColor: colors.divider }]}>
                    <PressableScale
                      onPress={onClose}
                      disabled={isPublishing}
                      haptic={false}
                      style={[
                        styles.button,
                        styles.cancelButton,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                    </PressableScale>

                    <PressableScale
                      onPress={handlePublish}
                      disabled={isPublishDisabled()}
                      haptic={!isPublishDisabled()}
                      style={[
                        styles.button,
                        styles.publishButton,
                        {
                          backgroundColor:
                            isPublishDisabled() && !isPublishing
                              ? colors.backgroundTertiary
                              : colors.primary,
                          opacity: isPublishDisabled() ? 0.5 : 1,
                          ...(!isPublishDisabled() ? Shadows.md : {}),
                        },
                      ]}
                    >
                      {isPublishing ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.textInverse}
                          style={styles.spinner}
                        />
                      ) : (
                        <>
                          <Text
                            style={[styles.buttonText, styles.publishButtonText, { color: colors.textInverse }]}
                          >
                            Publish
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color={colors.textInverse}
                          />
                        </>
                      )}
                    </PressableScale>
                  </View>
                </AnimatedView>
              </Pressable>
            </FadeIn>
          </Pressable>
        </BlurView>
      </AnimatedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurOverlay: {
    flex: 1,
    width: '100%',
  },
  pressableOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH * 0.92,
    alignSelf: 'center',
  },
  modal: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Spacing[5],
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  headerMeta: {
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  headerMetaText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    marginTop: Spacing[4],
  },
  mainContent: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[4],
  },
  urlSection: {
    gap: Spacing[2],
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing[2],
  },
  urlText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing[2],
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[5],
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    minHeight: 48,
    gap: Spacing[2],
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  publishButton: {
    // backgroundColor uses theme colors from inline style
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  publishButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.extrabold,
  },
  spinner: {
    transform: [{ scale: 0.8 }],
  },
});
