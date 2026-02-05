import { useEffect, useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RecordButton, Waveform, Timer } from '@/components/recording';
import { useRecordingStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import { recordingService } from '@/services/audio/recording-service';
import { MAX_RECORDING_DURATION, MIN_RECORDING_DURATION } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { FadeIn, SlideIn } from '@/components/ui/animated/animated-wrappers';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

// Check if audio has meaningful sound levels
function hasAudioActivity(levels: number[]): boolean {
  if (levels.length < 10) return false;
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  return avgLevel > 0.05; // Adjusted threshold for 0-1 range
}

export default function RecordingScreen() {
  const {
    isRecording,
    isPaused,
    duration,
    meteringLevels,
    setRecording,
    setPaused,
    setDuration,
    setAudioUri,
    addMeteringLevel,
    reset: resetStore,
  } = useRecordingStore();

  const colors = useThemeColors();

  const processRecording = useCallback(async () => {
    try {
      const result = await recordingService.stopRecording();

      setAudioUri(result.uri);
      setRecording(false);
      setPaused(false);

      router.push({
        pathname: '/keyword',
        params: { audioUri: result.uri, duration: result.duration },
      });
    } catch (error) {
      console.error('Recording error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';

      Alert.alert(
        'Recording Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: async () => {
              await resetStore();
            },
          },
        ]
      );
    }
  }, [setAudioUri, setRecording, setPaused, resetStore]);

  const handleStop = useCallback(async () => {
    // Validate minimum duration
    if (duration < MIN_RECORDING_DURATION) {
      Alert.alert(
        'Recording Too Short',
        `Please record for at least ${MIN_RECORDING_DURATION} seconds to ensure we can transcribe your voice properly.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check for audio activity
    if (!hasAudioActivity(meteringLevels)) {
      Alert.alert(
        'No Audio Detected',
        'We didn\'t detect any speech in your recording. Please make sure your microphone is working and speak clearly.',
        [
          { text: 'Try Again', style: 'cancel' },
          {
            text: 'Continue Anyway',
            onPress: async () => {
              await processRecording();
            },
          },
        ]
      );
      return;
    }

    await processRecording();
  }, [duration, meteringLevels, processRecording]);

  useEffect(() => {
    if (duration >= MAX_RECORDING_DURATION) {
      handleStop();
    }
  }, [duration, handleStop]);

  const handleStartRecording = useCallback(async () => {
    try {
      await recordingService.startRecording(
        (level) => addMeteringLevel(level),
        (seconds) => setDuration(seconds)
      );
      setRecording(true);
      setPaused(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';

      Alert.alert(
        'Recording Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: async () => {
              await resetStore();
            },
          },
        ]
      );
    }
  }, [addMeteringLevel, setDuration, setRecording, setPaused, resetStore]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await recordingService.resumeRecording();
        setPaused(false);
      } else {
        await recordingService.pauseRecording();
        setPaused(true);
      }
    } catch (error) {
      console.error('Error pausing/resuming:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause/resume recording';

      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: async () => {
              await resetStore();
            },
          },
        ]
      );
    }
  }, [isPaused, setPaused, resetStore]);

  const handleCancel = useCallback(async () => {
    if (isRecording) {
      Alert.alert(
        'Discard Recording?',
        'Your recording will be lost.',
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              await recordingService.cancelRecording();
              await resetStore();
              router.back();
            },
          },
        ]
      );
    } else {
      await resetStore();
      router.back();
    }
  }, [isRecording, resetStore]);

  const handleReset = useCallback(async () => {
    Alert.alert(
      'Reset Recording?',
      'This will discard your current recording and you can start fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await recordingService.cancelRecording();
            await resetStore();
          },
        },
      ]
    );
  }, [resetStore]);

  const handleRecordPress = useCallback(() => {
    if (!isRecording) {
      handleStartRecording();
    } else {
      handlePauseResume();
    }
  }, [isRecording, handleStartRecording, handlePauseResume]);

  const getTipText = () => {
    if (!isRecording) return 'Tap the button to start recording';
    if (isPaused) return 'Tap to resume or reset your recording';
    return 'Speak naturally, we\'ll handle the structure';
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <FadeIn>
          <View style={styles.header}>
            <PressableScale onPress={handleCancel} hapticStyle="light">
              <ThemedText style={[styles.cancelButton, { color: colors.primary }]}>
                Cancel
              </ThemedText>
            </PressableScale>
            <View style={styles.titleContainer}>
              {isRecording && !isPaused && (
                <View style={[styles.recordingDot, { backgroundColor: colors.recording }]} />
              )}
              {isRecording && isPaused && (
                <View style={[styles.recordingDot, { backgroundColor: colors.paused }]} />
              )}
              <ThemedText style={[styles.title, { color: colors.text }]}>
                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
              </ThemedText>
            </View>
            <View style={styles.placeholder} />
          </View>
        </FadeIn>

        {/* Content */}
        <View style={styles.content}>
          {/* Waveform */}
          <SlideIn direction="up" delay={100}>
            <View style={[styles.waveformContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Waveform
                levels={meteringLevels}
                isRecording={isRecording && !isPaused}
                height={120}
              />
            </View>
          </SlideIn>

          {/* Timer */}
          <SlideIn direction="up" delay={200}>
            <View style={styles.timerContainer}>
              <Timer
                seconds={duration}
                isRecording={isRecording}
                isPaused={isPaused}
              />
            </View>
          </SlideIn>

          {/* Tip */}
          <FadeIn delay={300}>
            <ThemedText style={[styles.tip, { color: colors.textSecondary }]}>
              {getTipText()}
            </ThemedText>
          </FadeIn>
        </View>

        {/* Controls */}
        <SlideIn direction="up" delay={150}>
          <View style={styles.controls}>
            {/* Main Record/Pause Button */}
            <RecordButton
              isRecording={isRecording}
              isPaused={isPaused}
              onPress={handleRecordPress}
              size={80}
            />

            {/* Action Buttons */}
            {isRecording && (
              <FadeIn delay={100}>
                <View style={styles.actionButtons}>
                  {/* Reset Button */}
                  <PressableScale
                    onPress={handleReset}
                    hapticStyle="medium"
                    style={[
                      styles.resetButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="refresh" size={20} color={colors.text} />
                    <ThemedText style={[styles.resetButtonText, { color: colors.text }]}>
                      Reset
                    </ThemedText>
                  </PressableScale>

                  {/* Done Button */}
                  <PressableScale
                    onPress={handleStop}
                    hapticStyle="medium"
                    style={[
                      styles.doneButton,
                      {
                        backgroundColor: colors.success,
                        ...Shadows.md,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark" size={22} color="#fff" />
                    <ThemedText style={styles.doneButtonText}>
                      Done
                    </ThemedText>
                  </PressableScale>
                </View>
              </FadeIn>
            )}
          </View>
        </SlideIn>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[5],
    minHeight: 60,
  },
  cancelButton: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  waveformContainer: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing[12],
    ...Shadows.sm,
  },
  timerContainer: {
    marginBottom: Spacing[6],
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tip: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing[4],
  },
  controls: {
    alignItems: 'center',
    paddingBottom: Spacing[14],
    gap: Spacing[6],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing[4],
    width: '100%',
    paddingHorizontal: Spacing[6],
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  resetButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  doneButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[7],
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.xl,
  },
  doneButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
});
