import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  AnimatedCard,
  PressableScale,
  SlideIn,
} from '@/components/ui/animated';
import { Duration } from '@/constants/animations';
import { API_BASE_URL } from '@/constants/config';
import { BorderRadius, Shadows, Spacing, Typography, withOpacity } from '@/constants/design-system';
import { useProfile } from '@/hooks/use-api';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useSettingsStore } from '@/stores';
import { useAuthStore } from '@/stores/auth-store';
import type { Length, Tone } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const TONES: { value: Tone; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string; colorKey: 'primary' | 'accent' | 'teal' }[] = [
  { value: 'professional', icon: 'briefcase-outline', label: 'Professional', desc: 'Formal and authoritative', colorKey: 'primary' },
  { value: 'casual', icon: 'cafe-outline', label: 'Casual', desc: 'Friendly and relaxed', colorKey: 'accent' },
  { value: 'conversational', icon: 'chatbubbles-outline', label: 'Conversational', desc: 'Like talking to a friend', colorKey: 'teal' },
];

const LENGTHS: { value: Length; label: string; words: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'short', label: 'Short', words: '500-800', icon: 'flash-outline' },
  { value: 'medium', label: 'Medium', words: '1K-1.5K', icon: 'document-outline' },
  { value: 'long', label: 'Long', words: '2K-3K', icon: 'book-outline' },
];

export default function SettingsTab() {
  const {
    defaultTone,
    defaultLength,
    setDefaultTone,
    setDefaultLength,
  } = useSettingsStore();

  const { signOutUser, user, isAuthenticated, accessToken } = useAuthStore();
  const { data: profile } = useProfile();
  const colors = useThemeColors();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Construct full avatar URL if avatar_url is a relative path
  const getAvatarUrl = (url: string | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url; // Already a full URL
    // No token needed - UUID path provides security
    return `${API_BASE_URL}${url}`;
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
              router.replace('/auth/sign-in');
            } catch (error) {
              // Improved error handling - don't expose sensitive info
              console.error('Sign out failed:', error instanceof Error ? error.message : 'Unknown error');
              Alert.alert('Sign Out Failed', 'Unable to sign out. Please check your connection and try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your local drafts and reset settings to defaults. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              // Reset the app by reloading to ensure clean state
              Alert.alert(
                'Data Cleared',
                'All your drafts and settings have been removed.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Reload the app to reset all state
                      router.replace('/(tabs)');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Failed to clear data:', error instanceof Error ? error.message : 'Unknown error');
              Alert.alert('Clear Failed', 'Unable to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Helper to get tone colors consistently
  const getToneColor = (colorKey: 'primary' | 'accent' | 'teal') => {
    switch (colorKey) {
      case 'primary':
        return { primary: colors.primary, light: colors.primaryLight };
      case 'accent':
        return { primary: colors.accent, light: colors.accentLight };
      case 'teal':
        return { primary: colors.teal, light: colors.tealLight || withOpacity(colors.teal, 0.1) };
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.safeArea}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Playful Gradient Header */}
            <SlideIn direction="down" delay={0}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleGradient}
                  >
                    <ThemedText style={styles.title}>Settings</ThemedText>
                  </LinearGradient>
                </View>
                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Make VoiceScribe yours
                </ThemedText>
              </View>
            </SlideIn>

            {/* Profile Section */}
            <SlideIn direction="up" delay={Duration.fastest}>
              <View style={styles.section}>
                <PressableScale
                  onPress={() => isAuthenticated ? router.push('/profile/edit') : router.push('/auth/sign-in')}
                  hapticStyle="light"
                  accessibilityLabel="Edit your profile"
                  accessibilityRole="button"
                >
                  <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {profile?.avatar_url ? (
                      <Image
                        source={{ uri: getAvatarUrl(profile.avatar_url) }}
                        style={styles.profileAvatarImage}
                      />
                    ) : (
                      <View style={[styles.profileAvatar, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="person" size={28} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.profileInfo}>
                      <ThemedText style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                        {profile?.full_name || user?.user_metadata?.full_name || 'Your Name'}
                      </ThemedText>
                      <ThemedText style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                        {user?.email || 'Sign in to your account'}
                      </ThemedText>
                      {profile?.bio && (
                        <ThemedText style={[styles.profileBio, { color: colors.textMuted }]} numberOfLines={1}>
                          {profile.bio}
                        </ThemedText>
                      )}
                    </View>
                    <View style={[styles.chevronWrapper, { backgroundColor: colors.backgroundSecondary }]}>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                  </View>
                </PressableScale>
              </View>
            </SlideIn>

            {/* Default Tone */}
            <SlideIn direction="up" delay={Duration.fastest}>
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  DEFAULT TONE
                </ThemedText>
                <AnimatedCard variant="outlined" animateEntry={false} style={styles.card}>
                  {TONES.map((tone, index) => {
                    const { primary: toneColor, light: toneColorLight } = getToneColor(tone.colorKey);
                    const isSelected = defaultTone === tone.value;

                    return (
                      <PressableScale
                        key={tone.value}
                        onPress={() => setDefaultTone(tone.value)}
                        hapticStyle="light"
                        accessibilityLabel={`${tone.label} tone: ${tone.desc}${isSelected ? ', selected' : ''}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.optionRow,
                          index < TONES.length - 1 && styles.optionRowBorder,
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: withOpacity(toneColor, 0.08) },
                        ]}
                      >
                        <View style={[styles.optionIcon, { backgroundColor: toneColorLight }]}>
                          <Ionicons name={tone.icon} size={22} color={toneColor} />
                        </View>
                        <View style={styles.optionText}>
                          <ThemedText style={[styles.optionLabel, { color: colors.text }]}>
                            {tone.label}
                          </ThemedText>
                          <ThemedText style={[styles.optionDesc, { color: colors.textMuted }]} numberOfLines={1}>
                            {tone.desc}
                          </ThemedText>
                        </View>
                        {isSelected && (
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
                  {LENGTHS.map((length) => {
                    const isSelected = defaultLength === length.value;
                    return (
                      <PressableScale
                        key={length.value}
                        onPress={() => setDefaultLength(length.value)}
                        hapticStyle="light"
                        accessibilityLabel={`${length.label} length: ${length.words} words${isSelected ? ', selected' : ''}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        style={styles.lengthCardContainer}
                      >
                        <View
                          style={[
                            styles.lengthCard,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.border,
                              borderWidth: isSelected ? 2 : 1.5,
                            },
                            isSelected && Shadows.sm,
                          ]}
                        >
                          <View style={[styles.lengthIcon, { backgroundColor: isSelected ? withOpacity(colors.textInverse, 0.2) : colors.primaryLight }]}>
                            <Ionicons
                              name={length.icon}
                              size={20}
                              color={isSelected ? colors.textInverse : colors.primary}
                            />
                          </View>
                          <ThemedText
                            style={[
                              styles.lengthLabel,
                              { color: isSelected ? colors.textInverse : colors.text },
                            ]}
                          >
                            {length.label}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.lengthWords,
                              { color: isSelected ? colors.textInverse : colors.textMuted },
                            ]}
                          >
                            {length.words}
                          </ThemedText>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            </SlideIn>

            {/* Appearance - Dark Mode Toggle - REMOVED FOR MOBILE */}

            {/* Data Management */}
            <SlideIn direction="up" delay={Duration.moderate}>
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  ACTIONS
                </ThemedText>

                {/* Sign Out - only show when authenticated */}
                {isAuthenticated && (
                  <PressableScale
                    onPress={handleSignOut}
                    hapticStyle="medium"
                    accessibilityLabel="Sign out of your account"
                    style={styles.dangerCard}
                  >
                    <View style={styles.dangerContent}>
                      <View style={[styles.dangerIcon, { backgroundColor: withOpacity(colors.error, 0.12) }]}>
                        <Ionicons name="log-out-outline" size={20} color={colors.error} />
                      </View>
                      <View style={styles.dangerText}>
                        <ThemedText style={[styles.dangerTitle, { color: colors.error }]}>
                          Sign Out
                        </ThemedText>
                        <ThemedText style={[styles.dangerDesc, { color: colors.textMuted }]} numberOfLines={1}>
                          Sign out of your account
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.chevronWrapper, { backgroundColor: colors.errorLight }]}>
                      <Ionicons name="chevron-forward" size={18} color={colors.error} />
                    </View>
                  </PressableScale>
                )}

                {/* Delete Account - only show when authenticated */}
                {isAuthenticated && (
                  <PressableScale
                    onPress={() => {
                      if (isDeletingAccount) return;
                      Alert.alert(
                        'Delete Account',
                        'This will permanently delete your account, all your drafts, and published posts. This action cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete Account',
                            style: 'destructive',
                            onPress: async () => {
                              setIsDeletingAccount(true);
                              try {
                                const response = await fetch(`${API_BASE_URL}/api/profile`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${accessToken || ''}`,
                                  },
                                });
                                if (response.ok) {
                                  // Clear local storage and sign out
                                  await AsyncStorage.clear();
                                  Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                                  router.replace('/auth/sign-in');
                                } else {
                                  const errorData = await response.json().catch(() => ({}));
                                  Alert.alert('Error', errorData.error || 'Failed to delete account. Please try again.');
                                }
                              } catch (error) {
                                console.error('Delete account error:', error);
                                Alert.alert('Error', 'Failed to delete account. Please check your connection and try again.');
                              } finally {
                                setIsDeletingAccount(false);
                              }
                            },
                          },
                        ]
                      );
                    }}
                    hapticStyle="heavy"
                    accessibilityLabel="Delete your account permanently"
                    style={[styles.dangerCard, { marginTop: Spacing[3], borderWidth: 2, borderColor: colors.error, opacity: isDeletingAccount ? 0.6 : 1 }]}
                  >
                    <View style={styles.dangerContent}>
                      <View style={[styles.dangerIcon, { backgroundColor: withOpacity(colors.error, 0.15) }]}>
                        <Ionicons name="warning" size={20} color={colors.error} />
                      </View>
                      <View style={styles.dangerText}>
                        <ThemedText style={[styles.dangerTitle, { color: colors.error }]}>
                          Delete Account
                        </ThemedText>
                        <ThemedText style={[styles.dangerDesc, { color: colors.textMuted }]} numberOfLines={1}>
                          {isDeletingAccount ? 'Deleting...' : 'Permanently delete your account'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.chevronWrapper, { backgroundColor: colors.error }]}>
                      {isDeletingAccount ? (
                        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textInverse} />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
                      )}
                    </View>
                  </PressableScale>
                )}

                {/* Clear All Data */}
                <PressableScale
                  onPress={handleClearData}
                  hapticStyle="medium"
                  accessibilityLabel="Clear all data - This will delete all your drafts and reset settings"
                  style={[styles.dangerCard, { marginTop: Spacing[3] }]}
                >
                  <View style={styles.dangerContent}>
                    <View style={[styles.dangerIcon, { backgroundColor: withOpacity(colors.error, 0.12) }]}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </View>
                    <View style={styles.dangerText}>
                      <ThemedText style={[styles.dangerTitle, { color: colors.error }]}>
                        Clear All Data
                      </ThemedText>
                      <ThemedText style={[styles.dangerDesc, { color: colors.textMuted }]} numberOfLines={1}>
                        Delete all drafts and reset settings
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.chevronWrapper, { backgroundColor: colors.errorLight }]}>
                    <Ionicons name="chevron-forward" size={18} color={colors.error} />
                  </View>
                </PressableScale>
              </View>
            </SlideIn>

            {/* About */}
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
                    VoiceScribe
                  </ThemedText>
                  <ThemedText style={[styles.appTagline, { color: colors.textSecondary }]}>
                    Voice to Blog in One Tap
                  </ThemedText>
                </AnimatedCard>
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
    paddingBottom: 160,
  },
  // Playful gradient header
  header: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[5],
    minHeight: 90,
  },
  titleContainer: {
    marginBottom: Spacing[1],
  },
  titleGradient: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[0.5],
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: Typography.fontSize['5xl'], // Bolder: 48px like library page
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: Typography.letterSpacing.wider,
    lineHeight: Typography.fontSize['5xl'] * Typography.lineHeight.tight,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing[1],
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  section: {
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[5],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm, // Slightly larger for better readability
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing[3],
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  // Bolder profile card with border
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  profileAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing[1],
  },
  profileName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[0.5],
    includeFontPadding: false,
  },
  profileEmail: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[0.5],
    includeFontPadding: false,
  },
  profileBio: {
    fontSize: Typography.fontSize.sm,
    includeFontPadding: false,
  },
  // Tone options with bolder styling
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    minHeight: 60, // Larger touch target
  },
  optionRowBorder: {
    borderBottomWidth: 1,
  },
  optionIcon: {
    width: 48, // Slightly larger for better visual
    height: 48,
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
    fontWeight: Typography.fontWeight.semibold,
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
    borderRadius: BorderRadius.full, // Using token instead of 12
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bolder length selection with icons
  lengthGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  lengthCardContainer: {
    flex: 1,
  },
  lengthCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.xl,
  },
  lengthIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  lengthLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  lengthWords: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  // Bolder danger cards
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  dangerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: {
    gap: Spacing[0.5], // Using token
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
  // Bolder about card
  aboutCard: {
    padding: Spacing[6],
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
  },
  appIconLarge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
    ...Shadows.sm,
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
