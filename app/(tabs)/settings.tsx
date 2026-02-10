import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettingsStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { Tone, Length } from '@/types/draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  FadeIn,
  SlideIn,
  PressableScale,
  AnimatedCard,
} from '@/components/ui/animated';
import { Spacing, Typography, BorderRadius, withOpacity, Palette } from '@/constants/design-system';
import { Duration } from '@/constants/animations';

const TONES: { value: Tone; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string; colorKey: 'primary' | 'accent' | 'teal' }[] = [
  { value: 'professional', icon: 'briefcase-outline', label: 'Professional', desc: 'Formal and authoritative', colorKey: 'primary' },
  { value: 'casual', icon: 'cafe-outline', label: 'Casual', desc: 'Friendly and relaxed', colorKey: 'accent' },
  { value: 'conversational', icon: 'chatbubbles-outline', label: 'Conversational', desc: 'Like talking to a friend', colorKey: 'teal' },
];

const LENGTHS: { value: Length; label: string; words: string }[] = [
  { value: 'short', label: 'Short', words: '500-800' },
  { value: 'medium', label: 'Medium', words: '1K-1.5K' },
  { value: 'long', label: 'Long', words: '2K-3K' },
];

export default function SettingsTab() {
  const {
    defaultTone,
    defaultLength,
    setDefaultTone,
    setDefaultLength,
  } = useSettingsStore();

  const colors = useThemeColors();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your drafts and reset settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <FadeIn delay={0}>
            <View style={styles.header}>
              <ThemedText style={[styles.title, { color: colors.text }]}>Settings</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                Customize your experience
              </ThemedText>
            </View>
          </FadeIn>

          {/* Default Tone */}
          <SlideIn direction="up" delay={Duration.fast}>
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
                DEFAULT TONE
              </ThemedText>
              <AnimatedCard variant="outlined" animateEntry={false} style={styles.card}>
                {TONES.map((tone, index) => {
                  const toneColor = tone.colorKey === 'primary' ? colors.primary :
                                   tone.colorKey === 'accent' ? colors.accent :
                                   colors.teal;
                  const toneColorLight = tone.colorKey === 'primary' ? colors.primaryLight :
                                        tone.colorKey === 'accent' ? colors.accentLight :
                                        Palette.teal[50];

                  return (
                    <PressableScale
                      key={tone.value}
                      onPress={() => setDefaultTone(tone.value)}
                      hapticStyle="light"
                      accessibilityLabel={`${tone.label} tone: ${tone.desc}${defaultTone === tone.value ? ', selected' : ''}`}
                      style={[
                        styles.optionRow,
                        index < TONES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={[styles.optionIcon, { backgroundColor: toneColorLight }]}>
                        <Ionicons name={tone.icon} size={20} color={toneColor} />
                      </View>
                      <View style={styles.optionText}>
                        <ThemedText style={[styles.optionLabel, { color: colors.text }]}>
                          {tone.label}
                        </ThemedText>
                        <ThemedText style={[styles.optionDesc, { color: colors.textMuted }]}>
                          {tone.desc}
                        </ThemedText>
                      </View>
                      {defaultTone === tone.value && (
                        <View style={[styles.checkmark, { backgroundColor: toneColor }]}>
                          <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                        </View>
                      )}
                    </PressableScale>
                  );
                })}
              </AnimatedCard>
            </View>
          </SlideIn>

          {/* Default Length */}
          <SlideIn direction="up" delay={Duration.normal}>
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
                DEFAULT LENGTH
              </ThemedText>
              <View style={styles.lengthGrid}>
                {LENGTHS.map((length, index) => (
                  <PressableScale
                    key={length.value}
                    onPress={() => setDefaultLength(length.value)}
                    hapticStyle="light"
                    accessibilityLabel={`${length.label} length: ${length.words} words${defaultLength === length.value ? ', selected' : ''}`}
                    style={[
                      styles.lengthCard,
                      {
                        backgroundColor: defaultLength === length.value ? colors.primary : colors.surface,
                        borderColor: defaultLength === length.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.lengthLabel,
                        { color: defaultLength === length.value ? colors.textInverse : colors.text },
                      ]}
                    >
                      {length.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.lengthWords,
                        { color: defaultLength === length.value ? colors.textInverse : colors.textMuted },
                      ]}
                    >
                      {length.words} words
                    </ThemedText>
                  </PressableScale>
                ))}
              </View>
            </View>
          </SlideIn>

          {/* Data Management */}
          <SlideIn direction="up" delay={Duration.moderate}>
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
                DATA
              </ThemedText>
              <PressableScale
                onPress={handleClearData}
                hapticStyle="medium"
                accessibilityLabel="Clear all data - This will delete all your drafts and reset settings"
                style={[styles.dangerCard, { backgroundColor: colors.errorLight }]}
              >
                <View style={styles.dangerContent}>
                  <View style={[styles.dangerIcon, { backgroundColor: withOpacity(colors.error, 0.12) }]}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </View>
                  <View style={styles.dangerText}>
                    <ThemedText style={[styles.dangerTitle, { color: colors.error }]}>
                      Clear All Data
                    </ThemedText>
                    <ThemedText style={[styles.dangerDesc, { color: withOpacity(colors.error, 0.8) }]}>
                      Delete all drafts and reset settings
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.error} />
              </PressableScale>
            </View>
          </SlideIn>

          {/* About - Simplified without version badge */}
          <SlideIn direction="up" delay={Duration.slow}>
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
                ABOUT
              </ThemedText>
              <AnimatedCard variant="outlined" animateEntry={false} style={styles.aboutCard}>
                <View style={[styles.appIconLarge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="mic" size={32} color={colors.textInverse} />
                </View>
                <ThemedText style={[styles.appName, { color: colors.text }]}>
                  VoiceDraft
                </ThemedText>
                <ThemedText style={[styles.appTagline, { color: colors.textSecondary }]}>
                  Voice to Blog in One Tap
                </ThemedText>
              </AnimatedCard>
            </View>
          </SlideIn>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  header: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[4],
    minHeight: 70,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: Typography.letterSpacing.tight,
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  section: {
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[5],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing[3],
    lineHeight: 16,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  optionDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginTop: Spacing[0.5],
    includeFontPadding: false,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lengthGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  lengthCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  lengthLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  lengthWords: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginTop: Spacing[1],
    includeFontPadding: false,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  dangerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: {
    gap: 2,
  },
  dangerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  dangerDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  aboutCard: {
    padding: Spacing[6],
    alignItems: 'center',
  },
  appIconLarge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  appName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  appTagline: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginTop: Spacing[1],
    includeFontPadding: false,
  },
});
