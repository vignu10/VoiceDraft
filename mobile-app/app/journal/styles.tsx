import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import {
  FadeIn,
  SlideIn,
  PressableScale,
  AnimatedCard,
  AnimatedButton,
} from '@/components/ui/animated';
import { Spacing, Typography, BorderRadius } from '@/constants/design-system';
import { Duration } from '@/constants/animations';
import { useJournal, useUpdateStyles } from '@/hooks/use-api';
import type { Style } from '@/types/journal';

type Tone = 'professional' | 'casual' | 'conversational';
type Length = 'short' | 'medium' | 'long';

interface StyleConfig {
  index: number;
  name: string;
  tone: Tone;
  length: Length;
}

const TONES: { value: Tone; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'professional', icon: 'briefcase-outline', label: 'Professional' },
  { value: 'casual', icon: 'cafe-outline', label: 'Casual' },
  { value: 'conversational', icon: 'chatbubbles-outline', label: 'Conversational' },
];

const LENGTHS: { value: Length; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

const DEFAULT_STYLES: StyleConfig[] = [
  { index: 0, name: 'Professional', tone: 'professional', length: 'medium' },
  { index: 1, name: 'Casual', tone: 'casual', length: 'short' },
  { index: 2, name: 'Technical', tone: 'conversational', length: 'long' },
];

export default function JournalStylesScreen() {
  const colors = useThemeColors();
  const { data: journal } = useJournal();
  const updateStylesMutation = useUpdateStyles();

  const [styleConfigs, setStyleConfigs] = useState<StyleConfig[]>(DEFAULT_STYLES);

  // Initialize styles when journal data loads
  useEffect(() => {
    if (journal?.styles) {
      const mappedStyles: StyleConfig[] = journal.styles.map((style: { name: string; tone: string | number; length: string | number }, index: number) => ({
        index,
        name: style.name,
        tone: (typeof style.tone === 'number' ? ['professional', 'casual', 'conversational'][style.tone as number] : style.tone) as Tone,
        length: (typeof style.length === 'number' ? ['short', 'medium', 'long'][style.length as number] : style.length) as Length,
      }));
      setStyleConfigs(mappedStyles);
    }
  }, [journal]);

  const updateStyleTone = (index: number, tone: Tone) => {
    setStyleConfigs(prev => prev.map(s => s.index === index ? { ...s, tone } : s));
  };

  const updateStyleLength = (index: number, length: Length) => {
    setStyleConfigs(prev => prev.map(s => s.index === index ? { ...s, length } : s));
  };

  const handleSave = async () => {
    try {
      const apiStyles: Style[] = styleConfigs.map(config => ({
        name: config.name,
        user_prompt_template: `Write in a ${config.tone} tone, ${config.length} length.`,
        tone: config.tone,
        length: config.length,
        is_active: true,
      }));

      await updateStylesMutation.mutateAsync(apiStyles);
      Alert.alert('Success', 'Writing styles updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      // Error is handled by the mutation hook
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']}>
        <View style={styles.safeArea}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <FadeIn delay={0}>
            <View style={styles.header}>
              <PressableScale onPress={() => router.back()} hapticStyle="light" style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </PressableScale>
              <ThemedText style={[styles.title, { color: colors.text }]}>Writing Styles</ThemedText>
              <View style={styles.headerSpacer} />
            </View>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Customize how your posts are written
            </ThemedText>
          </FadeIn>

          {/* Style Cards */}
          {styleConfigs.map((styleConfig, index) => (
            <SlideIn key={styleConfig.index} direction="up" delay={Duration.fastest + index * 50}>
              <View style={styles.styleSection}>
                <ThemedText style={[styles.styleSectionTitle, { color: colors.text }]}>
                  Style {index + 1}
                </ThemedText>

                <AnimatedCard variant="elevated" animateEntry={false} style={styles.styleCard}>
                  {/* Tone Selection */}
                  <View style={styles.selectorSection}>
                    <ThemedText style={[styles.selectorLabel, { color: colors.textMuted }]}>TONE</ThemedText>
                    <View style={styles.toneOptions}>
                      {TONES.map(tone => {
                        const isSelected = styleConfig.tone === tone.value;
                        const toneColor =
                          tone.value === 'professional' ? colors.primary :
                          tone.value === 'casual' ? colors.accent :
                          colors.teal;

                        return (
                          <PressableScale
                            key={tone.value}
                            onPress={() => updateStyleTone(styleConfig.index, tone.value)}
                            hapticStyle="light"
                            style={[
                              styles.toneOption,
                              {
                                backgroundColor: isSelected ? toneColor : colors.surface,
                                borderColor: isSelected ? toneColor : colors.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name={tone.icon}
                              size={18}
                              color={isSelected ? colors.textInverse : colors.textMuted}
                            />
                            <ThemedText
                              style={[
                                styles.toneOptionLabel,
                                { color: isSelected ? colors.textInverse : colors.text },
                              ]}
                            >
                              {tone.label}
                            </ThemedText>
                          </PressableScale>
                        );
                      })}
                    </View>
                  </View>

                  {/* Length Selection */}
                  <View style={styles.selectorSection}>
                    <ThemedText style={[styles.selectorLabel, { color: colors.textMuted }]}>LENGTH</ThemedText>
                    <View style={styles.lengthOptions}>
                      {LENGTHS.map(length => {
                        const isSelected = styleConfig.length === length.value;
                        return (
                          <PressableScale
                            key={length.value}
                            onPress={() => updateStyleLength(styleConfig.index, length.value)}
                            hapticStyle="light"
                            style={[
                              styles.lengthOption,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.surface,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.lengthOptionLabel,
                                { color: isSelected ? colors.textInverse : colors.text },
                              ]}
                            >
                              {length.label}
                            </ThemedText>
                          </PressableScale>
                        );
                      })}
                    </View>
                  </View>
                </AnimatedCard>
              </View>
            </SlideIn>
          ))}

          {/* Save Button */}
          <SlideIn direction="up" delay={Duration.slow}>
            <View style={styles.buttonContainer}>
              <AnimatedButton
                variant="primary"
                size="lg"
                onPress={handleSave}
                loading={updateStylesMutation.isPending}
                disabled={updateStylesMutation.isPending}
              >
                Save Styles
              </AnimatedButton>
            </View>
          </SlideIn>
          </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[2],
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing[2],
    includeFontPadding: false,
  },
  headerSpacer: {
    width: 44,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[1],
    includeFontPadding: false,
  },
  styleSection: {
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[6],
  },
  styleSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  styleCard: {
    padding: Spacing[5],
  },
  selectorSection: {
    marginBottom: Spacing[5],
  },
  selectorLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  toneOptions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  toneOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  toneOptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  lengthOptions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  lengthOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  lengthOptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  buttonContainer: {
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[8],
  },
});
