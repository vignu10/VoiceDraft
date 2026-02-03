import { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettingsStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import { TONE_DESCRIPTIONS, LENGTH_WORD_COUNTS } from '@/constants/config';
import type { Tone, Length } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';

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
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="options" size={28} color={colors.tint} />
            </View>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Blog Options
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Customize how your blog post will be generated
            </ThemedText>
          </View>

          {/* Keyword Input */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Target Keyword
            </ThemedText>
            <ThemedText style={[styles.labelHint, { color: colors.textMuted }]}>
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

          {/* Tone Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Writing Tone
            </ThemedText>
            <View style={styles.toneGrid}>
              {TONES.map((t) => (
                <Pressable
                  key={t.value}
                  style={[
                    styles.toneCard,
                    {
                      backgroundColor: tone === t.value ? colors.tint : colors.card,
                      borderColor: tone === t.value ? colors.tint : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setTone(t.value)}
                >
                  <Ionicons
                    name={t.icon}
                    size={24}
                    color={tone === t.value ? '#fff' : colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.toneLabel,
                      { color: tone === t.value ? '#fff' : colors.text },
                    ]}
                  >
                    {t.value.charAt(0).toUpperCase() + t.value.slice(1)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.toneDesc,
                      { color: tone === t.value ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                    ]}
                  >
                    {TONE_DESCRIPTIONS[t.value]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Length Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Article Length
            </ThemedText>
            <View style={styles.lengthRow}>
              {LENGTHS.map((l) => (
                <Pressable
                  key={l}
                  style={[
                    styles.lengthCard,
                    {
                      backgroundColor: length === l ? colors.tint : colors.card,
                      borderColor: length === l ? colors.tint : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setLength(l)}
                >
                  <ThemedText
                    style={[
                      styles.lengthLabel,
                      { color: length === l ? '#fff' : colors.text },
                    ]}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.lengthWords,
                      { color: length === l ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                    ]}
                  >
                    {LENGTH_WORD_COUNTS[l].min}-{LENGTH_WORD_COUNTS[l].max}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={handleSkip}
          >
            <ThemedText style={[styles.skipButtonText, { color: colors.text }]}>
              Skip
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor: colors.tint,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleContinue}
          >
            <ThemedText style={styles.continueButtonText}>
              Generate Blog
            </ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  toneGrid: {
    gap: 12,
  },
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  toneLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  toneDesc: {
    fontSize: 13,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 12,
  },
  lengthCard: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  lengthLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  lengthWords: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  skipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
