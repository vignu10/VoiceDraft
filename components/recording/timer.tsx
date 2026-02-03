import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { formatDuration } from '@/utils/formatters';
import { RECORDING_WARNING_THRESHOLD, MAX_RECORDING_DURATION } from '@/constants/config';
import { LinearGradient } from 'expo-linear-gradient';

interface TimerProps {
  seconds: number;
  maxSeconds?: number;
  showWarning?: boolean;
  isRecording?: boolean;
}

export function Timer({
  seconds,
  maxSeconds = MAX_RECORDING_DURATION,
  showWarning = true,
  isRecording = false,
}: TimerProps) {
  const colors = useThemeColors();
  const isWarning = showWarning && seconds >= RECORDING_WARNING_THRESHOLD;
  const progress = seconds / maxSeconds;

  // Animation values
  const glowOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const scanLineY = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const digitGlow = useSharedValue(0.5);

  // Split time into individual digits for animation
  const formatted = formatDuration(seconds);
  const [minutes, secs] = formatted.split(':');

  useEffect(() => {
    if (isRecording) {
      // Glow pulsing
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Subtle scale pulse
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Scan line animation
      scanLineY.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );

      // Ring rotation
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );

      // Digit glow
      digitGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(glowOpacity);
      cancelAnimation(pulseScale);
      cancelAnimation(scanLineY);
      cancelAnimation(ringRotation);
      cancelAnimation(digitGlow);
      glowOpacity.value = withTiming(0.3);
      pulseScale.value = withTiming(1);
      digitGlow.value = withTiming(0.5);
    }
  }, [isRecording, glowOpacity, pulseScale, scanLineY, ringRotation, digitGlow]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanLineY.value, [0, 1], [-60, 60]) }],
    opacity: interpolate(scanLineY.value, [0, 0.5, 1], [0, 0.6, 0]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const digitGlowStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(digitGlow.value, [0.5, 1], [8, 20]),
    opacity: interpolate(digitGlow.value, [0.5, 1], [0.9, 1]),
  }));

  const primaryColor = isWarning ? colors.error : colors.tint;
  const secondaryColor = isWarning ? colors.errorLight : colors.tintLight;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.outerGlow, glowStyle, { shadowColor: primaryColor }]} />

      {/* Rotating ring with dashes */}
      <Animated.View style={[styles.rotatingRing, ringStyle]}>
        {[...Array(24)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.ringDash,
              {
                backgroundColor: i < Math.floor(progress * 24) ? primaryColor : colors.border,
                transform: [
                  { rotate: `${i * 15}deg` },
                  { translateY: -85 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Main timer box */}
      <View style={[styles.timerBox, { borderColor: primaryColor }]}>
        <LinearGradient
          colors={[
            colors.backgroundSecondary,
            colors.background,
            colors.backgroundSecondary,
          ]}
          style={styles.gradient}
        />

        {/* Scan line effect */}
        {isRecording && (
          <Animated.View
            style={[
              styles.scanLine,
              scanLineStyle,
              { backgroundColor: primaryColor },
            ]}
          />
        )}

        {/* Corner accents */}
        <View style={[styles.cornerTL, { borderColor: primaryColor }]} />
        <View style={[styles.cornerTR, { borderColor: primaryColor }]} />
        <View style={[styles.cornerBL, { borderColor: primaryColor }]} />
        <View style={[styles.cornerBR, { borderColor: primaryColor }]} />

        {/* Time display */}
        <View style={styles.timeDisplay}>
          {/* Minutes */}
          <View style={styles.digitGroup}>
            <Animated.Text
              style={[
                styles.digit,
                digitGlowStyle,
                {
                  color: primaryColor,
                  textShadowColor: primaryColor,
                },
              ]}
            >
              {minutes}
            </Animated.Text>
            <ThemedText style={[styles.label, { color: colors.textMuted }]}>
              MIN
            </ThemedText>
          </View>

          {/* Separator with animation */}
          <View style={styles.separatorContainer}>
            <Animated.Text
              style={[
                styles.separator,
                digitGlowStyle,
                {
                  color: primaryColor,
                  textShadowColor: primaryColor,
                },
              ]}
            >
              :
            </Animated.Text>
          </View>

          {/* Seconds */}
          <View style={styles.digitGroup}>
            <Animated.Text
              style={[
                styles.digit,
                digitGlowStyle,
                {
                  color: primaryColor,
                  textShadowColor: primaryColor,
                },
              ]}
            >
              {secs}
            </Animated.Text>
            <ThemedText style={[styles.label, { color: colors.textMuted }]}>
              SEC
            </ThemedText>
          </View>
        </View>

        {/* Status indicator */}
        <View style={styles.statusRow}>
          {isRecording && (
            <View style={styles.statusIndicator}>
              <Animated.View
                style={[
                  styles.statusDot,
                  glowStyle,
                  { backgroundColor: isWarning ? colors.error : colors.recording },
                ]}
              />
              <ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
                {isWarning ? 'TIME LOW' : 'REC'}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Progress arc indicator */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: primaryColor,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
        <ThemedText style={[styles.progressText, { color: colors.textMuted }]}>
          {Math.round(progress * 100)}%
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
  },
  outerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  rotatingRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDash: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  timerBox: {
    width: 180,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    opacity: 0.5,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitGroup: {
    alignItems: 'center',
    minWidth: 60,
  },
  digit: {
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: -4,
  },
  separatorContainer: {
    marginHorizontal: 4,
    marginTop: -16,
  },
  separator: {
    fontSize: 40,
    fontWeight: '300',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statusRow: {
    marginTop: 8,
    height: 20,
    justifyContent: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  progressBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
  },
});
