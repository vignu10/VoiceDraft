import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
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

type Step = 'transcribing' | 'generating' | 'complete' | 'error';

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
          return colors.tint;
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
            <Ionicons name={icon} size={16} color={colors.textMuted} />
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
          <View style={[styles.iconContainer, { backgroundColor: step === 'error' ? colors.errorLight : colors.tint + '15' }]}>
            <Ionicons
              name={step === 'error' ? 'alert-circle' : step === 'complete' ? 'checkmark-circle' : 'sparkles'}
              size={40}
              color={step === 'error' ? colors.error : colors.tint}
            />
          </View>

          <ThemedText style={[styles.title, { color: colors.text }]}>
            {step === 'error' ? 'Something went wrong' : step === 'complete' ? 'All done!' : 'Creating your blog post'}
          </ThemedText>

          <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <StepIndicator label="Transcribing audio" targetStep="transcribing" icon="mic" />
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <StepIndicator label="Generating blog post" targetStep="generating" icon="document-text" />
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <StepIndicator label="Optimizing for SEO" targetStep="complete" icon="trending-up" />
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {error}
              </ThemedText>
            </View>
          )}
        </View>

        {step === 'error' && (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleCancel}
            >
              <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </Pressable>
          </View>
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
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  stepsCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 2,
    height: 20,
    marginLeft: 17,
    marginVertical: 4,
  },
  stepLabel: {
    fontSize: 16,
    flex: 1,
  },
  stepLabelActive: {
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
