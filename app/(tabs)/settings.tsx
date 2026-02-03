import { StyleSheet, View, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettingsStore } from '@/stores';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { Tone, Length } from '@/types/draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const TONES: { value: Tone; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'professional', icon: 'briefcase' , label: 'Professional' },
  { value: 'casual', icon: 'cafe', label: 'Casual' },
  { value: 'conversational', icon: 'chatbubbles', label: 'Conversational' },
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Settings</ThemedText>
          </View>

          {/* Default Tone */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
              DEFAULT TONE
            </ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {TONES.map((tone, index) => (
                <Pressable
                  key={tone.value}
                  style={[
                    styles.optionRow,
                    index < TONES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={() => setDefaultTone(tone.value)}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name={tone.icon} size={20} color={colors.tint} />
                  </View>
                  <ThemedText style={[styles.optionLabel, { color: colors.text }]}>
                    {tone.label}
                  </ThemedText>
                  {defaultTone === tone.value && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Default Length */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
              DEFAULT LENGTH
            </ThemedText>
            <View style={styles.lengthGrid}>
              {LENGTHS.map((length) => (
                <Pressable
                  key={length.value}
                  style={[
                    styles.lengthCard,
                    {
                      backgroundColor: defaultLength === length.value ? colors.tint : colors.card,
                      borderColor: defaultLength === length.value ? colors.tint : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setDefaultLength(length.value)}
                >
                  <ThemedText
                    style={[
                      styles.lengthLabel,
                      { color: defaultLength === length.value ? '#fff' : colors.text },
                    ]}
                  >
                    {length.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.lengthWords,
                      { color: defaultLength === length.value ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                    ]}
                  >
                    {length.words} words
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
              DATA
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.dangerCard,
                {
                  backgroundColor: colors.errorLight,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleClearData}
            >
              <View style={styles.dangerContent}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
                <View style={styles.dangerText}>
                  <ThemedText style={[styles.dangerTitle, { color: colors.error }]}>
                    Clear All Data
                  </ThemedText>
                  <ThemedText style={[styles.dangerDesc, { color: colors.error }]}>
                    Delete all drafts and reset settings
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </Pressable>
          </View>

          {/* About */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
              ABOUT
            </ThemedText>
            <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.appIconLarge, { backgroundColor: colors.tint }]}>
                <Ionicons name="mic" size={32} color="#fff" />
              </View>
              <ThemedText style={[styles.appName, { color: colors.text }]}>
                VoiceDraft
              </ThemedText>
              <ThemedText style={[styles.appTagline, { color: colors.textSecondary }]}>
                Voice to Blog in One Tap
              </ThemedText>
              <View style={[styles.versionBadge, { backgroundColor: colors.backgroundSecondary }]}>
                <ThemedText style={[styles.versionText, { color: colors.textMuted }]}>
                  Version 1.0.0
                </ThemedText>
              </View>
            </View>
          </View>
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  lengthGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  lengthCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  lengthLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  lengthWords: {
    fontSize: 12,
    marginTop: 4,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dangerText: {
    gap: 2,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerDesc: {
    fontSize: 13,
    opacity: 0.8,
  },
  aboutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  appIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
  },
  appTagline: {
    fontSize: 15,
    marginTop: 4,
  },
  versionBadge: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
