import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { RECORDING_WARNING_THRESHOLD, MAX_RECORDING_DURATION } from '@/constants/config';
import { Spacing, Typography } from '@/constants/design-system';
import { Springs } from '@/constants/animations';

interface TimerProps {
  seconds: number;
  maxSeconds?: number;
  showWarning?: boolean;
  isRecording?: boolean;
  isPaused?: boolean;
}

export function Timer({
  seconds,
  maxSeconds = MAX_RECORDING_DURATION,
  showWarning = true,
  isRecording = false,
  isPaused = false,
}: TimerProps) {
  const colors = useThemeColors();
  const isWarning = showWarning && seconds >= RECORDING_WARNING_THRESHOLD;
  const isActivelyRecording = isRecording && !isPaused;
  const progress = seconds / maxSeconds;
  const reducedMotion = useReducedMotion();

  // Animation values
  const dotOpacity = useSharedValue(isActivelyRecording ? 0.4 : 1);
  const dotScale = useSharedValue(isActivelyRecording ? 1.15 : 1);
  const timerScale = useSharedValue(1);
  const colonBlink = useSharedValue(1);

  // Parse time for display
  const timeParts = useMemo(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    };
  }, [seconds]);

  // Dot pulse animation
  const dotOpacityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotScaleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Skip animations if reduced motion is enabled
    if (reducedMotion) {
      dotOpacity.value = isPaused ? 0.5 : 1;
      dotScale.value = isPaused ? 0.9 : 1;
      return;
    }

    if (isActivelyRecording) {
      const animateDotOpacity = () => {
        dotOpacity.value = withSequence(
          withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        );
      };

      const animateDotScale = () => {
        dotScale.value = withSequence(
          withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        );
      };

      animateDotOpacity();
      animateDotScale();

      dotOpacityIntervalRef.current = setInterval(animateDotOpacity, 1800);
      dotScaleIntervalRef.current = setInterval(animateDotScale, 1800);
    } else {
      if (dotOpacityIntervalRef.current) {
        clearInterval(dotOpacityIntervalRef.current);
        dotOpacityIntervalRef.current = null;
      }
      if (dotScaleIntervalRef.current) {
        clearInterval(dotScaleIntervalRef.current);
        dotScaleIntervalRef.current = null;
      }
      cancelAnimation(dotOpacity);
      cancelAnimation(dotScale);
      dotOpacity.value = withSpring(isPaused ? 0.5 : 1, Springs.gentle);
      dotScale.value = withSpring(isPaused ? 0.9 : 1, Springs.gentle);
    }
    // Cleanup on unmount
    return () => {
      if (dotOpacityIntervalRef.current) {
        clearInterval(dotOpacityIntervalRef.current);
      }
      if (dotScaleIntervalRef.current) {
        clearInterval(dotScaleIntervalRef.current);
      }
      cancelAnimation(dotOpacity);
      cancelAnimation(dotScale);
    };
  }, [isActivelyRecording, isPaused, dotOpacity, dotScale, reducedMotion]);

  // Timer scale animation on value change
  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      timerScale.value = 1;
      return;
    }
    timerScale.value = withSequence(
      withTiming(1.02, { duration: 100 }),
      withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })
    );
    return () => cancelAnimation(timerScale);
  }, [seconds, timerScale, reducedMotion]);

  // Colon blink animation when paused
  const colonBlinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Skip animation if reduced motion is enabled
    if (reducedMotion) {
      colonBlink.value = 1;
      return;
    }

    if (isPaused) {
      const animateColonBlink = () => {
        colonBlink.value = withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      };

      animateColonBlink();
      colonBlinkIntervalRef.current = setInterval(animateColonBlink, 1000);
    } else {
      if (colonBlinkIntervalRef.current) {
        clearInterval(colonBlinkIntervalRef.current);
        colonBlinkIntervalRef.current = null;
      }
      cancelAnimation(colonBlink);
      colonBlink.value = withSpring(1, Springs.gentle);
    }
    return () => {
      if (colonBlinkIntervalRef.current) {
        clearInterval(colonBlinkIntervalRef.current);
      }
      cancelAnimation(colonBlink);
    };
  }, [isPaused, colonBlink, reducedMotion]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  const colonStyle = useAnimatedStyle(() => ({
    opacity: colonBlink.value,
  }));

  const timerColor = isWarning ? colors.error : isPaused ? colors.textMuted : colors.text;
  const progressColor = isWarning ? colors.error : colors.primary;

  return (
    <View style={styles.container}>
      {/* Timer Display */}
      <Animated.View style={[styles.timerDisplay, timerStyle]}>
        {/* Recording indicator dot */}
        {isRecording && (
          <Animated.View
            style={[
              styles.recordingDot,
              dotStyle,
              { backgroundColor: isPaused ? colors.paused : colors.recording },
            ]}
          />
        )}

        {/* Time with animated colon */}
        <View style={styles.timeContainer}>
          <ThemedText style={[styles.timeText, { color: timerColor }]}>
            {timeParts.mins}
          </ThemedText>
          <Animated.Text style={[styles.colon, { color: timerColor }, colonStyle]}>
            :
          </Animated.Text>
          <ThemedText style={[styles.timeText, { color: timerColor }]}>
            {timeParts.secs}
          </ThemedText>
        </View>
      </Animated.View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: isWarning ? colors.error + '15' : colors.primary + '15' }]}>
        {isWarning && (
          <>
            <View style={[styles.warningDot, { backgroundColor: colors.error }]} />
            <ThemedText style={[styles.statusText, { color: colors.error }]}>
              Almost at limit
            </ThemedText>
          </>
        )}
        {!isWarning && isRecording && !isPaused && (
          <>
            <View style={[styles.recordingDotSmall, { backgroundColor: colors.recording }]} />
            <ThemedText style={[styles.statusText, { color: colors.primary }]}>
              Recording...
            </ThemedText>
          </>
        )}
        {!isWarning && isPaused && (
          <>
            <View style={[styles.pausedDot, { backgroundColor: colors.paused }]} />
            <ThemedText style={[styles.statusText, { color: colors.paused }]}>
              Paused
            </ThemedText>
          </>
        )}
      </View>

      {/* Progress Bar */}
      {isRecording && (
        <View style={[styles.progressBarContainer, { backgroundColor: timerColor + '15' }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: progressColor,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 52,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    lineHeight: 56,
    includeFontPadding: false,
    textAlign: 'center',
  },
  colon: {
    fontSize: 52,
    fontWeight: '200',
    letterSpacing: 2,
    lineHeight: 56,
    includeFontPadding: false,
    fontFamily: 'System',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: 16,
    marginTop: Spacing[2],
  },
  warningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  recordingDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pausedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: 280,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing[3],
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
