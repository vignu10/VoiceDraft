import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import { getTimeBasedGreeting, onboardingMessages } from '@/utils/delight-messages';
import { useAchievementsStore } from '@/stores';
import { PressableScale, FadeIn, Pulse } from '@/components/ui/animated';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';
import { Duration } from '@/constants/animations';
import { Ionicons } from '@expo/vector-icons';

export default function RecordTab() {
  const colors = useThemeColors();

  // Check if this is first time user
  const totalDrafts = useAchievementsStore((state) => state.totalDrafts);
  const isFirstTime = totalDrafts === 0;

  // Greeting messages based on time of day
  const greeting = getTimeBasedGreeting();
  const subtitleOptions = [
    'Turn your voice into polished content',
    'Speak your mind, we\'ll do the rest',
    'From voice notes to blog posts',
    'Your ideas, beautifully structured',
  ];
  const subtitle = subtitleOptions[Math.floor(Math.random() * subtitleOptions.length)];

  const handleStartRecording = () => {
    router.push('/recording');
  };

  return (
    <ThemedView style={styles.container}>
      {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
      {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {/* Simplified: Single focused action */}
          <View style={styles.content}>
          <FadeIn>
            <ThemedText style={[styles.title, { color: colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
              VoiceScribe
            </ThemedText>
          </FadeIn>

          <FadeIn delay={Duration.fast}>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
              {isFirstTime ? onboardingMessages.welcome.subtitle : greeting}
            </ThemedText>
          </FadeIn>

          <FadeIn delay={Duration.fast * 2}>
            <ThemedText style={[styles.description, { color: colors.textTertiary }]} numberOfLines={2} ellipsizeMode="tail">
              {subtitle}
            </ThemedText>
          </FadeIn>

          {/* Decorative gradient circles for warmth */}
          <View style={styles.decorations}>
            <View style={[styles.decorationCircle, styles.decorationTopRight, { backgroundColor: colors.primaryLight }]} />
            <View style={[styles.decorationCircle, styles.decorationBottomLeft, { backgroundColor: colors.accentLight }]} />
          </View>

          <View style={styles.spacer} />

          {/* Single record button - the core action */}
          <Pulse minScale={1} maxScale={1.03} duration={2000}>
            <PressableScale
              onPress={handleStartRecording}
              scale={0.94}
              hapticStyle="medium"
              accessibilityRole="button"
              accessibilityLabel="Start recording"
              style={styles.recordButtonContainer}
            >
              <View style={[styles.recordButton, { backgroundColor: colors.primary, ...Shadows.glow }]}>
                <Ionicons name="mic" size={48} color={colors.textInverse} />
              </View>
            </PressableScale>
          </Pulse>

          <View style={[styles.hintContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
              {isFirstTime ? onboardingMessages.firstRecording.hint : 'Tap to start recording'}
            </ThemedText>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: 120,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing[2],
    textAlign: 'center',
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: Spacing[3],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: Spacing[3],
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  spacer: {
    flex: 0.4,
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  hintContainer: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    marginTop: Spacing[4],
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    opacity: 0.4,
  },
  decorationTopRight: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
  },
  decorationBottomLeft: {
    width: 160,
    height: 160,
    bottom: -40,
    left: -40,
  },
});
