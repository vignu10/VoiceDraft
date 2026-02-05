import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranscribe } from '@/hooks/use-transcribe';
import { useGenerate } from '@/hooks/use-generate';
import { useThemeColors } from '@/hooks/use-theme-color';
import { generateId } from '@/utils/formatters';
import type { Tone, Length, Draft } from '@/types/draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TRANSCRIPT_LENGTH, MIN_TRANSCRIPT_WORDS } from '@/constants/config';
import { FadeIn, SlideIn, ScaleIn } from '@/components/ui/animated/animated-wrappers';
import { AnimatedButton } from '@/components/ui/animated/animated-button';
import { AnimatedCard } from '@/components/ui/animated/animated-card';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

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

export default function ProcessingScreen() {
  const params = useLocalSearchParams<{
    audioUri: string;
    duration: string;
    keyword?: string;
    tone: string;
    length: string;
  }>();

  const [step, setStep] = useState<Step>('transcribing');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const colors = useThemeColors();

  const transcribeMutation = useTranscribe();
  const generateMutation = useGenerate();

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const processRecording = async () => {
      try {
        setStep('transcribing');
        const transcription = await transcribeMutation.mutateAsync(params.audioUri!);

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

        const id = generateId();
        const draft: Draft = {
          id,
          status: 'ready',
          audioUri: params.audioUri,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const existingDrafts = await AsyncStorage.getItem('drafts');
        const drafts = existingDrafts ? JSON.parse(existingDrafts) : [];
        drafts.unshift(draft);
        await AsyncStorage.setItem('drafts', JSON.stringify(drafts));

        setStep('complete');

        setTimeout(() => {
          router.replace({
            pathname: '/draft/[id]',
            params: { id },
          });
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStep('error');
      }
    };

    processRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setError(null);
    hasStarted.current = false;
    const retryProcessing = async () => {
      try {
        setStep('transcribing');
        const transcription = await transcribeMutation.mutateAsync(params.audioUri!);

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

        const id = generateId();
        const draft: Draft = {
          id,
          status: 'ready',
          audioUri: params.audioUri,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const existingDrafts = await AsyncStorage.getItem('drafts');
        const drafts = existingDrafts ? JSON.parse(existingDrafts) : [];
        drafts.unshift(draft);
        await AsyncStorage.setItem('drafts', JSON.stringify(drafts));

        setStep('complete');

        setTimeout(() => {
          router.replace({
            pathname: '/draft/[id]',
            params: { id },
          });
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStep('error');
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
        <View style={[styles.stepDot, { backgroundColor: getBackgroundColor() }]}>
          {status === 'complete' && (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
          {status === 'active' && (
            <ActivityIndicator size="small" color="#fff" />
          )}
          {status === 'error' && (
            <Ionicons name="close" size={18} color="#fff" />
          )}
          {status === 'pending' && (
            <Ionicons name={icon} size={16} color={colors.textTertiary} />
          )}
        </View>
        <ThemedText
          style={[
            styles.stepLabel,
            { color: status === 'active' ? colors.text : colors.textSecondary },
            status === 'active' && styles.stepLabelActive,
          ]}
        >
          {label}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Icon */}
          <ScaleIn>
            <View style={[styles.iconContainer, { backgroundColor: step === 'error' ? colors.errorLight : colors.primaryLight }]}>
              <Ionicons
                name={step === 'error' ? 'alert-circle' : step === 'complete' ? 'checkmark-circle' : 'sparkles'}
                size={40}
                color={step === 'error' ? colors.error : colors.primary}
              />
            </View>
          </ScaleIn>

          <FadeIn delay={100}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {step === 'error' ? 'Something went wrong' : step === 'complete' ? 'All done!' : 'Creating your blog post'}
            </ThemedText>
          </FadeIn>

          <SlideIn direction="up" delay={200}>
            <AnimatedCard
              variant="outlined"
              style={styles.stepsCard}
              animateEntry={false}
            >
              <StepIndicator label="Transcribing audio" targetStep="transcribing" icon="mic" />
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              <StepIndicator label="Generating blog post" targetStep="generating" icon="document-text" />
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              <StepIndicator label="Optimizing for SEO" targetStep="complete" icon="trending-up" />
            </AnimatedCard>
          </SlideIn>

          {error && (
            <FadeIn>
              <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </ThemedText>
              </View>
            </FadeIn>
          )}
        </View>

        {step === 'error' && (
          <FadeIn>
            <View style={styles.actions}>
              <AnimatedButton variant="secondary" onPress={handleCancel}>
                Cancel
              </AnimatedButton>
              <View style={styles.retryWrapper}>
                <AnimatedButton
                  variant="primary"
                  onPress={handleRetry}
                  leftIcon="refresh"
                  fullWidth
                >
                  Retry
                </AnimatedButton>
              </View>
            </View>
          </FadeIn>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing[6],
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[8],
    ...Shadows.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing[10],
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.tight,
  },
  stepsCard: {
    width: '100%',
    maxWidth: 320,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  stepLine: {
    width: 2,
    height: 24,
    marginLeft: 19,
    marginVertical: Spacing[1.5],
  },
  stepLabel: {
    fontSize: Typography.fontSize.md,
    flex: 1,
  },
  stepLabelActive: {
    fontWeight: Typography.fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: Spacing[8],
    padding: Spacing[5],
    borderRadius: BorderRadius.xl,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[6],
  },
  retryWrapper: {
    flex: 1,
  },
});
