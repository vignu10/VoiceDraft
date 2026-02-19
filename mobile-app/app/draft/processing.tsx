import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  AnimatedButton,
  AnimatedCard,
  FadeIn,
  ScaleIn,
  SlideIn,
} from '@/components/ui/animated';
import { MiniCelebration } from '@/components/ui/delight';
import { MIN_TRANSCRIPT_LENGTH, MIN_TRANSCRIPT_WORDS } from '@/constants/config';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useGenerate } from '@/hooks/use-generate';
import { useGuestTrial } from '@/hooks/use-guest-trial';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useTranscribe, useTranscribeS3 } from '@/hooks/use-transcribe';
import { createPost, type CreatePostData } from '@/services/api/posts';
import { useAchievementsStore, useGuestDraftStore, useRecordingStore } from '@/stores';
import type { Draft, Length, Tone } from '@/types/draft';
import { getProcessingMessage, getSuccessMessage } from '@/utils/delight-messages';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedView = Animated.View;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'transcribing' | 'generating' | 'complete' | 'error';

// Validate transcript has meaningful content
function validateTranscript(text: string): { valid: boolean; reason?: string } {
  const trimmed = text.trim();

  // Check if empty
  if (!trimmed) {
    return { valid: false, reason: 'No speech was detected in your recording. Please try again and speak clearly into the microphone.' };
  }

  // Check minimum length
  if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
    return { valid: false, reason: 'The recording was too short. Please record at least a few sentences for the best results.' };
  }

  // Check minimum word count
  const wordCount = trimmed.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < MIN_TRANSCRIPT_WORDS) {
    return { valid: false, reason: `Only ${wordCount} words were detected. Please speak more content for a meaningful blog post.` };
  }

  return { valid: true };
}

// ============================================
// TWINKLING ICON - Simplified for performance
// ============================================
interface TwinklingIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color: string;
}

// Simplified sparkle with fewer particles for better performance
function Sparkle({
  index,
  total,
  size,
  colors,
}: {
  index: number;
  total: number;
  size: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const offset = index * 0.2;
  const angle = (index / total) * Math.PI * 2;

  useEffect(() => {
    progress.value = withRepeat(
      withDelay(offset * 600, withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })),
      -1,
      true
    );

    scale.value = withRepeat(
      withDelay(
        offset * 600,
        withSequence(
          withTiming(1.3, { duration: 500, easing: Easing.out(Easing.quad) }),
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
        )
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withDelay(
        offset * 600,
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 800 })
        )
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const sparkleStyle = useAnimatedStyle(() => {
    'worklet';
    const t = progress.value;
    const radius = size * 0.5;

    const x = Math.sin(t * Math.PI * 2 + angle) * radius;
    const y = Math.cos(t * Math.PI * 2 + angle * 0.7) * radius * 0.6;

    const sparkleColor = interpolateColor(
      (t + offset) % 1,
      [0, 0.33, 0.66, 1],
      [colors.accent, colors.primary, colors.teal, colors.accent]
    );

    return {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: sparkleColor,
      transform: [
        { translateX: x + size / 2 - 3 },
        { translateY: y + size / 2 - 3 },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return <Animated.View style={sparkleStyle} />;
}

// Main Twinkling Icon
function TwinklingIcon({ name, size = 56 }: TwinklingIconProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  const breatheScale = useSharedValue(1);
  const iconScale = useSharedValue(0.9);

  useEffect(() => {
    if (reducedMotion) {
      breatheScale.value = 1;
      iconScale.value = 1;
      return;
    }

    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });

    return () => {
      cancelAnimation(breatheScale);
      cancelAnimation(iconScale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const sparkles = reducedMotion ? null : (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <Sparkle key={i} index={i} total={8} size={size} colors={colors} />
      ))}
    </>
  );

  const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : breatheScale.value }],
    opacity: reducedMotion ? 1 : iconScale.value,
  }));

  return (
    <AnimatedView style={{ position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {sparkles}
      <Animated.View style={containerStyle}>
        <AnimatedIcon name={name} size={size} color={colors.primary} />
      </Animated.View>
    </AnimatedView>
  );
}

export default function ProcessingScreen() {
  const params = useLocalSearchParams<{
    audioUri?: string;
    audioFileUrl?: string;
    audioS3Key?: string;
    duration: string;
    keyword?: string;
    tone: string;
    length: string;
    fileSize?: string;
    mimeType?: string;
    isGuestFlow?: string;
  }>();

  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('transcribing');
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const hasStarted = useRef(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const colors = useThemeColors();

  // Achievements tracking
  const recordDraftCreated = useAchievementsStore((state) => state.recordDraftCreated);
  const recordWordsWritten = useAchievementsStore((state) => state.recordWordsWritten);

  // Recording store for Continue Draft feature
  const { setLastDraft } = useRecordingStore();

  // Guest draft store and trial hook
  const { setGuestDraft } = useGuestDraftStore();
  const {
    markTrialCompleted,
    decrementRemainingDrafts,
    getGuestId,
  } = useGuestTrial();

  const transcribeMutation = useTranscribe();
  const transcribeS3Mutation = useTranscribeS3();
  const generateMutation = useGenerate();

  // Determine if we're using S3 (new) or local audio (legacy)
  const isUsingS3 = !!params.audioFileUrl && !!params.audioS3Key;

  // Determine if this is a guest flow
  const isGuestFlow = params.isGuestFlow === 'true';

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Rotate processing messages for delight
    const messageInterval = setInterval(() => {
      setProcessingMessageIndex((prev) => prev + 1);
    }, 2500);

    const processRecording = async () => {
      try {
        setStep('transcribing');

        // Use S3 transcription if S3 params are available, otherwise use legacy base64
        const transcription = isUsingS3
          ? await transcribeS3Mutation.mutateAsync({
              audioUrl: params.audioFileUrl!,
              audioKey: params.audioS3Key!,
            })
          : await transcribeMutation.mutateAsync(params.audioUri!);

        // Validate transcription before calling generate API
        const validation = validateTranscript(transcription.text);
        if (!validation.valid) {
          throw new Error(validation.reason);
        }

        setStep('generating');
        const blog = await generateMutation.mutateAsync({
          transcript: transcription.text,
          targetKeyword: params.keyword,
          tone: params.tone as Tone,
          length: params.length as Length,
        });

        if (isGuestFlow) {
          // Guest flow: save draft locally, skip createPost()
          setGuestDraft({
            id: 'guest-draft',
            guestId: getGuestId(),
            title: blog.title,
            content: blog.content,
            transcription: transcription.text,
            keywords: params.keyword ? [params.keyword] : [],
            createdAt: new Date().toISOString(),
            audioUri: params.audioUri,
            // Save S3 info if available (for later sync)
            audioS3Key: params.audioS3Key,
            audioFileUrl: params.audioFileUrl,
            audioDuration: transcription.duration,
            tone: params.tone,
            length: params.length,
          });

          // Mark trial as completed after successful draft generation
          markTrialCompleted();
          decrementRemainingDrafts();

          setCelebrationMessage(getSuccessMessage('draftCreated'));
          setShowCelebration(true);
          setStep('complete');

          setTimeout(() => {
            router.replace({
              pathname: '/(tabs)/draft/[id]',
              params: { id: 'guest', isGuestFlow: 'true' },
            });
          }, 1000);
          return;
        }

        // Authenticated flow: create post via API
        // Use S3 URL if available, otherwise fall back to local URI
        const audioFileUrl = params.audioFileUrl || params.audioUri;

        // Derive audio format from mime type
        const getAudioFormat = (mimeType?: string): 'm4a' | 'mp3' | 'wav' | 'webm' | undefined => {
          if (!mimeType) return undefined;
          if (mimeType.includes('m4a') || mimeType.includes('mp4')) return 'm4a';
          if (mimeType.includes('mpeg')) return 'mp3';
          if (mimeType.includes('wav')) return 'wav';
          if (mimeType.includes('webm')) return 'webm';
          return undefined;
        };

        // Create post via API with S3 fields
        const createData: CreatePostData = {
          title: blog.title,
          content: blog.content,
          meta_description: blog.metaDescription,
          transcript: transcription.text,
          target_keyword: params.keyword,
          tone: params.tone as Tone,
          length: params.length as Length,
          audio_file_url: params.audioFileUrl,
          audio_s3_key: params.audioS3Key,
          audio_duration_seconds: parseInt(params.duration!, 10),
          audio_file_size_bytes: params.fileSize ? parseInt(params.fileSize, 10) : undefined,
          audio_mime_type: params.mimeType,
          audio_format: getAudioFormat(params.mimeType),
        };

        const post = await createPost(createData);
        const id = post.id;

        // Create local draft reference only for Continue Draft feature (temporary cache)
        const draft: Draft = {
          id,
          status: 'ready',
          audioUri: audioFileUrl,
          audioFileUrl: params.audioFileUrl,
          audioS3Key: params.audioS3Key,
          audioDuration: parseInt(params.duration!, 10),
          transcript: transcription.text,
          targetKeyword: params.keyword,
          tone: params.tone as Tone,
          length: params.length as Length,
          title: blog.title,
          metaDescription: blog.metaDescription,
          content: blog.content,
          wordCount: blog.wordCount,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to AsyncStorage only for Continue Draft feature (temporary cache)
        const existingDrafts = await AsyncStorage.getItem('drafts');
        const drafts = existingDrafts ? JSON.parse(existingDrafts) : [];
        const isFirstDraft = drafts.length === 0;
        drafts.unshift(draft);
        await AsyncStorage.setItem('drafts', JSON.stringify(drafts));

        // Track in achievements
        recordDraftCreated();
        recordWordsWritten(draft.wordCount || 0);

        // Save draft to recording store for Continue Draft feature
        setLastDraft(id, draft.title || null, draft.targetKeyword || null, draft.content || null);

        // Set celebration message for first draft
        if (isFirstDraft) {
          setCelebrationMessage(getSuccessMessage('draftCreated'));
        } else {
          setCelebrationMessage(getSuccessMessage('draftSaved'));
        }
        setShowCelebration(true);

        setStep('complete');

        setTimeout(() => {
          router.replace({
            pathname: '/(tabs)/draft/[id]',
            params: { id },
          });
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStep('error');
      } finally {
        clearInterval(messageInterval);
      }
    };

    processRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUsingS3, isGuestFlow]);

  const handleRetry = () => {
    setError(null);
    hasStarted.current = false;
    setProcessingMessageIndex(0);

    // Rotate processing messages for delight
    const messageInterval = setInterval(() => {
      setProcessingMessageIndex((prev) => prev + 1);
    }, 2500);

    const retryProcessing = async () => {
      try {
        setStep('transcribing');

        // Use S3 transcription if S3 params are available, otherwise use legacy base64
        const transcription = isUsingS3
          ? await transcribeS3Mutation.mutateAsync({
              audioUrl: params.audioFileUrl!,
              audioKey: params.audioS3Key!,
            })
          : await transcribeMutation.mutateAsync(params.audioUri!);

        // Validate transcription before calling generate API
        const validation = validateTranscript(transcription.text);
        if (!validation.valid) {
          throw new Error(validation.reason);
        }

        setStep('generating');
        const blog = await generateMutation.mutateAsync({
          transcript: transcription.text,
          targetKeyword: params.keyword,
          tone: params.tone as Tone,
          length: params.length as Length,
        });

        if (isGuestFlow) {
          // Guest flow: save draft locally, skip createPost()
          setGuestDraft({
            id: 'guest-draft',
            guestId: getGuestId(),
            title: blog.title,
            content: blog.content,
            transcription: transcription.text,
            keywords: params.keyword ? [params.keyword] : [],
            createdAt: new Date().toISOString(),
            audioUri: params.audioUri,
            // Save S3 info if available (for later sync)
            audioS3Key: params.audioS3Key,
            audioFileUrl: params.audioFileUrl,
            audioDuration: transcription.duration,
            tone: params.tone,
            length: params.length,
          });

          // Mark trial as completed after successful draft generation
          markTrialCompleted();
          decrementRemainingDrafts();

          setCelebrationMessage(getSuccessMessage('draftCreated'));
          setShowCelebration(true);
          setStep('complete');

          setTimeout(() => {
            router.replace({
              pathname: '/(tabs)/draft/[id]',
              params: { id: 'guest', isGuestFlow: 'true' },
            });
          }, 1000);
          return;
        }

        // Authenticated flow: create post via API
        // Use S3 URL if available, otherwise fall back to local URI
        const audioFileUrl = params.audioFileUrl || params.audioUri;

        // Derive audio format from mime type
        const getAudioFormat = (mimeType?: string): 'm4a' | 'mp3' | 'wav' | 'webm' | undefined => {
          if (!mimeType) return undefined;
          if (mimeType.includes('m4a') || mimeType.includes('mp4')) return 'm4a';
          if (mimeType.includes('mpeg')) return 'mp3';
          if (mimeType.includes('wav')) return 'wav';
          if (mimeType.includes('webm')) return 'webm';
          return undefined;
        };

        // Create post via API with S3 fields
        const createData: CreatePostData = {
          title: blog.title,
          content: blog.content,
          meta_description: blog.metaDescription,
          transcript: transcription.text,
          target_keyword: params.keyword,
          tone: params.tone as Tone,
          length: params.length as Length,
          audio_file_url: params.audioFileUrl,
          audio_s3_key: params.audioS3Key,
          audio_duration_seconds: parseInt(params.duration!, 10),
          audio_file_size_bytes: params.fileSize ? parseInt(params.fileSize, 10) : undefined,
          audio_mime_type: params.mimeType,
          audio_format: getAudioFormat(params.mimeType),
        };

        const post = await createPost(createData);
        const id = post.id;

        // Create local draft reference only for Continue Draft feature (temporary cache)
        const draft: Draft = {
          id,
          status: 'ready',
          audioUri: audioFileUrl,
          audioFileUrl: params.audioFileUrl,
          audioS3Key: params.audioS3Key,
          audioDuration: parseInt(params.duration!, 10),
          transcript: transcription.text,
          targetKeyword: params.keyword,
          tone: params.tone as Tone,
          length: params.length as Length,
          title: blog.title,
          metaDescription: blog.metaDescription,
          content: blog.content,
          wordCount: blog.wordCount,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to AsyncStorage only for Continue Draft feature (temporary cache)
        const existingDrafts = await AsyncStorage.getItem('drafts');
        const drafts = existingDrafts ? JSON.parse(existingDrafts) : [];
        const isFirstDraft = drafts.length === 0;
        drafts.unshift(draft);
        await AsyncStorage.setItem('drafts', JSON.stringify(drafts));

        // Track in achievements
        recordDraftCreated();
        recordWordsWritten(draft.wordCount || 0);

        // Save draft to recording store for Continue Draft feature
        setLastDraft(id, draft.title || null, draft.targetKeyword || null, draft.content || null);

        // Set celebration message for first draft
        if (isFirstDraft) {
          setCelebrationMessage(getSuccessMessage('draftCreated'));
        } else {
          setCelebrationMessage(getSuccessMessage('draftSaved'));
        }
        setShowCelebration(true);

        setStep('complete');

        setTimeout(() => {
          router.replace({
            pathname: '/(tabs)/draft/[id]',
            params: { id },
          });
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStep('error');
      } finally {
        clearInterval(messageInterval);
      }
    };
    retryProcessing();
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  const getStepStatus = (targetStep: Step) => {
    const order: Step[] = ['transcribing', 'generating', 'complete'];
    const currentIndex = order.indexOf(step);
    const targetIndex = order.indexOf(targetStep);

    if (step === 'error') {
      return targetIndex <= order.indexOf('transcribing') ? 'error' : 'pending';
    }
    if (targetIndex < currentIndex) return 'complete';
    if (targetIndex === currentIndex) return 'active';
    return 'pending';
  };

  const StepIndicator = ({
    label,
    targetStep,
    icon,
  }: {
    label: string;
    targetStep: Step;
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const status = getStepStatus(targetStep);

    const getBackgroundColor = () => {
      switch (status) {
        case 'complete':
          return colors.success;
        case 'active':
          return colors.primary;
        case 'error':
          return colors.error;
        default:
          return colors.border;
      }
    };

    return (
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, { backgroundColor: getBackgroundColor() }]} accessibilityLabel={`${label} ${status} step`}>
          {status === 'complete' && (
            <Ionicons name="checkmark" size={16} color={colors.textInverse} />
          )}
          {status === 'active' && (
            <ActivityIndicator size="small" color={colors.textInverse} />
          )}
          {status === 'error' && (
            <Ionicons name="close" size={16} color={colors.textInverse} />
          )}
          {status === 'pending' && (
            <Ionicons name={icon} size={14} color={colors.textTertiary} />
          )}
        </View>
        <ThemedText
          style={[
            styles.stepLabel,
            { color: status === 'active' ? colors.text : colors.textSecondary },
            status === 'active' && styles.stepLabelActive,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Celebration overlay */}
      <MiniCelebration
        visible={showCelebration}
        message={celebrationMessage}
        icon={step === 'complete' ? 'trophy' : 'checkmark-circle'}
        onComplete={() => setShowCelebration(false)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing[8] }]}
        bounces={false}
      >
        <View style={styles.content}>
          {/* Icon with twinkling animation */}
          <ScaleIn>
            <View style={[styles.iconContainer, { backgroundColor: step === 'error' ? colors.errorLight : colors.primaryLight }]}>
              <TwinklingIcon
                name={step === 'error' ? 'alert-circle' : step === 'complete' ? 'checkmark-circle' : 'sparkles'}
                color={step === 'error' ? colors.error : colors.primary}
              />
            </View>
          </ScaleIn>

          <FadeIn delay={100}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {step === 'error' ? 'Something went wrong' : step === 'complete' ? 'All done!' : 'Creating your blog post'}
            </ThemedText>
          </FadeIn>

          {step !== 'error' && step !== 'complete' && (
            <FadeIn delay={200}>
              <ThemedText style={[styles.processingMessage, { color: colors.textSecondary }]}>
                {getProcessingMessage(step === 'transcribing' ? 'transcribing' : 'generating', processingMessageIndex)}
              </ThemedText>
            </FadeIn>
          )}

          <SlideIn direction="up" delay={200}>
            <AnimatedCard
              variant="outlined"
              style={styles.stepsCard}
            >
              <View style={styles.stepsContainer}>
                <View style={styles.stepItem}>
                  <StepIndicator label="Transcribing audio" targetStep="transcribing" icon="mic" />
                </View>
                <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                <View style={styles.stepItem}>
                  <StepIndicator label="Generating blog post" targetStep="generating" icon="document-text" />
                </View>
                <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                <View style={styles.stepItem}>
                  <StepIndicator label="Optimizing for SEO" targetStep="complete" icon="trending-up" />
                </View>
              </View>
            </AnimatedCard>
          </SlideIn>

          {error && (
            <FadeIn>
              <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Ionicons name="warning" size={20} color={colors.error} style={styles.errorIcon} />
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </ThemedText>
              </View>
            </FadeIn>
          )}

          {step === 'error' && (
            <FadeIn>
              <View style={styles.actions}>
                <View style={styles.cancelButton}>
                  <AnimatedButton variant="secondary" onPress={handleCancel}>
                    Cancel
                  </AnimatedButton>
                </View>
                <View style={styles.retryButton}>
                  <AnimatedButton
                    variant="primary"
                    onPress={handleRetry}
                    leftIcon="refresh"
                    fullWidth
                  >
                    Try Again
                  </AnimatedButton>
                </View>
              </View>
            </FadeIn>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing[8],
  },
  content: {
    paddingHorizontal: Spacing[6],
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
    ...Shadows.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing[3],
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.tight,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
    includeFontPadding: false,
  },
  processingMessage: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[4],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  stepsCard: {
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  stepsContainer: {
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    width: Math.min(SCREEN_WIDTH * 0.7, 220),
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...Shadows.sm,
  },
  stepLine: {
    width: 2,
    height: 16,
    marginVertical: Spacing[1],
  },
  stepLabel: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.tight,
    flex: 1,
    includeFontPadding: false,
  },
  stepLabelActive: {
    fontWeight: Typography.fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    marginTop: Spacing[4],
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    width: '100%',
  },
  errorIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    width: '100%',
    marginTop: Spacing[6],
  },
  cancelButton: {
    flex: 1,
  },
  retryButton: {
    flex: 1,
  },
});
