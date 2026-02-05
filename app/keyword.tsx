import { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettingsStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import { TONE_DESCRIPTIONS, LENGTH_WORD_COUNTS } from '@/constants/config';
import type { Tone, Length } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { FadeIn, SlideIn } from '@/components/ui/animated/animated-wrappers';
import { AnimatedButton } from '@/components/ui/animated/animated-button';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

const TONES: { value: Tone; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'professional', icon: 'briefcase' },
  { value: 'casual', icon: 'cafe' },
  { value: 'conversational', icon: 'chatbubbles' },
];

const LENGTHS: Length[] = ['short', 'medium', 'long'];

export default function KeywordScreen() {
  const params = useLocalSearchParams<{ audioUri: string; duration: string }>();
  const { defaultTone, defaultLength } = useSettingsStore();
  const colors = useThemeColors();

  const [keyword, setKeyword] = useState('');
  const [tone, setTone] = useState<Tone>(defaultTone);
  const [length, setLength] = useState<Length>(defaultLength);

  const handleContinue = () => {
    router.push({
      pathname: '/draft/processing',
      params: {
        audioUri: params.audioUri,
        duration: params.duration,
        keyword: keyword || undefined,
        tone,
        length,
      },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: '/draft/processing',
      params: {
        audioUri: params.audioUri,
        duration: params.duration,
        tone,
        length,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <FadeIn>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="options" size={28} color={colors.primary} />
              </View>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Blog Options
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                Customize how your blog post will be generated
              </ThemedText>
            </View>
          </FadeIn>

          {/* Keyword Input */}
          <SlideIn direction="up" delay={100}>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Target Keyword
              </ThemedText>
              <ThemedText style={[styles.labelHint, { color: colors.textTertiary }]}>
                Optional - for SEO optimization
              </ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="search" size={20} color={colors.placeholder} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., productivity tips"
                  placeholderTextColor={colors.placeholder}
                  value={keyword}
                  onChangeText={setKeyword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </SlideIn>

          {/* Tone Selection */}
          <SlideIn direction="up" delay={200}>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Writing Tone
              </ThemedText>
              <View style={styles.toneGrid}>
                {TONES.map((t) => (
                  <PressableScale
                    key={t.value}
                    onPress={() => setTone(t.value)}
                    style={[
                      styles.toneCard,
                      {
                        backgroundColor: tone === t.value ? colors.primary : colors.surface,
                        borderColor: tone === t.value ? colors.primary : colors.border,
                      },
                      tone === t.value && Shadows.sm,
                    ]}
                  >
                    <Ionicons
                      name={t.icon}
                      size={24}
                      color={tone === t.value ? colors.textInverse : colors.textSecondary}
                    />
                    <ThemedText
                      style={[
                        styles.toneLabel,
                        { color: tone === t.value ? colors.textInverse : colors.text },
                      ]}
                    >
                      {t.value.charAt(0).toUpperCase() + t.value.slice(1)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.toneDesc,
                        { color: tone === t.value ? 'rgba(255,255,255,0.75)' : colors.textTertiary },
                      ]}
                    >
                      {TONE_DESCRIPTIONS[t.value]}
                    </ThemedText>
                  </PressableScale>
                ))}
              </View>
            </View>
          </SlideIn>

          {/* Length Selection */}
          <SlideIn direction="up" delay={300}>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Article Length
              </ThemedText>
              <View style={styles.lengthRow}>
                {LENGTHS.map((l) => (
                  <PressableScale
                    key={l}
                    onPress={() => setLength(l)}
                    style={[
                      styles.lengthCard,
                      {
                        backgroundColor: length === l ? colors.primary : colors.surface,
                        borderColor: length === l ? colors.primary : colors.border,
                      },
                      length === l && Shadows.sm,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.lengthLabel,
                        { color: length === l ? colors.textInverse : colors.text },
                      ]}
                    >
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.lengthWords,
                        { color: length === l ? 'rgba(255,255,255,0.75)' : colors.textTertiary },
                      ]}
                    >
                      {LENGTH_WORD_COUNTS[l].min}-{LENGTH_WORD_COUNTS[l].max}
                    </ThemedText>
                  </PressableScale>
                ))}
              </View>
            </View>
          </SlideIn>
        </ScrollView>

        {/* Actions */}
        <FadeIn delay={400}>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <AnimatedButton variant="secondary" onPress={handleSkip}>
              Skip
            </AnimatedButton>
            <View style={styles.continueWrapper}>
              <AnimatedButton
                variant="primary"
                onPress={handleContinue}
                rightIcon="arrow-forward"
                fullWidth
              >
                Generate Blog
              </AnimatedButton>
            </View>
          </View>
        </FadeIn>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[5],
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing[2],
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing[7],
  },
  label: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  labelHint: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[3],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing[4],
    fontSize: Typography.fontSize.md,
  },
  toneGrid: {
    gap: Spacing[3],
  },
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3] + 2,
    borderWidth: 1.5,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[4] + 4,
  },
  toneLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  toneDesc: {
    fontSize: Typography.fontSize.sm,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  lengthCard: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[3],
  },
  lengthLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  lengthWords: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing[1],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[6],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
  },
  continueWrapper: {
    flex: 2,
  },
});
