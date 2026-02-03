import { useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RecordButton, Waveform, Timer } from '@/components/recording';
import { useRecordingStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import { recordingService } from '@/services/audio/recording-service';
import { MAX_RECORDING_DURATION } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';

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
    reset,
  } = useRecordingStore();

  const colors = useThemeColors();

  const handleStop = useCallback(async () => {
    try {
      const result = await recordingService.stopRecording();
      if (result) {
        setAudioUri(result.uri);
        setRecording(false);
        router.push({
          pathname: '/keyword',
          params: { audioUri: result.uri, duration: result.duration },
        });
      }
    } catch (error) {
      Alert.alert(
        'Recording Error',
        error instanceof Error ? error.message : 'Failed to stop recording'
      );
      reset();
    }
  }, [setAudioUri, setRecording, reset]);

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
    } catch (error) {
      Alert.alert(
        'Recording Error',
        error instanceof Error ? error.message : 'Failed to start recording'
      );
    }
  }, [addMeteringLevel, setDuration, setRecording]);

  const handlePauseResume = useCallback(async () => {
    if (isPaused) {
      await recordingService.resumeRecording();
      setPaused(false);
    } else {
      await recordingService.pauseRecording();
      setPaused(true);
    }
  }, [isPaused, setPaused]);

  const handleCancel = useCallback(() => {
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
              await recordingService.stopRecording();
              reset();
              router.back();
            },
          },
        ]
      );
    } else {
      reset();
      router.back();
    }
  }, [isRecording, reset]);

  const handleRecordPress = useCallback(() => {
    if (!isRecording) {
      handleStartRecording();
    } else {
      handlePauseResume();
    }
  }, [isRecording, handleStartRecording, handlePauseResume]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} hitSlop={10}>
            <ThemedText style={[styles.cancelButton, { color: colors.tint }]}>
              Cancel
            </ThemedText>
          </Pressable>
          <View style={styles.titleContainer}>
            {isRecording && !isPaused && (
              <View style={[styles.recordingDot, { backgroundColor: colors.recording }]} />
            )}
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
            </ThemedText>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Waveform */}
          <View style={[styles.waveformContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Waveform
              levels={meteringLevels}
              isRecording={isRecording && !isPaused}
              height={120}
            />
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Timer seconds={duration} isRecording={isRecording && !isPaused} />
          </View>

          {/* Tip */}
          <ThemedText style={[styles.tip, { color: colors.textSecondary }]}>
            {isRecording
              ? isPaused
                ? 'Tap to resume recording'
                : 'Speak naturally, we\'ll handle the structure'
              : 'Tap the button to start recording'}
          </ThemedText>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <RecordButton
            isRecording={isRecording}
            isPaused={isPaused}
            onPress={handleRecordPress}
            size={80}
          />

          {isRecording && (
            <Pressable
              style={({ pressed }) => [
                styles.stopButton,
                {
                  backgroundColor: colors.success,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleStop}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
              <ThemedText style={styles.stopButtonText}>
                Done - Process Now
              </ThemedText>
            </Pressable>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cancelButton: {
    fontSize: 17,
    fontWeight: '500',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waveformContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  timerContainer: {
    marginBottom: 16,
  },
  tip: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 48,
    gap: 24,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
