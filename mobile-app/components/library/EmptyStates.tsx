/**
 * EmptyStates Components
 *
 * Empty state and auth required state for the library.
 * Extracted from library.tsx (lines 380-456).
 */

import { ThemedText } from '@/components/themed-text';
import { FadeIn, AnimatedButton } from '@/components/ui/animated';
import { BorderRadius, Shadows, Spacing, Typography, withOpacity } from '@/constants/design-system';
import { Duration } from '@/constants/animations';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export interface EmptyStateProps {
  isAuthenticated: boolean;
}

/**
 * Empty state when no drafts exist
 */
export function EmptyState({ isAuthenticated }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <FadeIn delay={Duration.fast}>
      <View style={styles.emptyState}>
        {/* Animated decorative circles */}
        <View style={styles.emptyDecorations}>
          <View style={[styles.decorationCircle, styles.deco1, { backgroundColor: colors.primaryLight }]} />
          <View style={[styles.decorationCircle, styles.deco2, { backgroundColor: colors.accentLight }]} />
          <View style={[styles.decorationCircle, styles.deco3, { backgroundColor: withOpacity(colors.teal, 0.2) }]} />
        </View>

        {/* Playful icon with bounce animation */}
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="mic" size={56} color={colors.primary} />
        </View>

        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
          Your library awaits
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          {isAuthenticated
            ? 'Transform your voice into beautiful blog posts'
            : 'Create up to 3 free drafts to try it out'}
        </ThemedText>

        <View style={styles.emptyButton}>
          <AnimatedButton
            variant="primary"
            size="lg"
            leftIcon="add"
            onPress={() => router.push('/recording')}
          >
            {isAuthenticated ? 'Create Your First Draft' : 'Start Recording'}
          </AnimatedButton>
        </View>

        {!isAuthenticated && (
          <ThemedText style={[styles.emptyText, { color: colors.textMuted, marginTop: Spacing[4] }]}>
            Sign up to save your drafts and create unlimited content
          </ThemedText>
        )}
      </View>
    </FadeIn>
  );
}

/**
 * Auth required state when user needs to sign in
 */
export function AuthRequiredState() {
  const colors = useThemeColors();

  return (
    <FadeIn delay={Duration.fast}>
      <View style={styles.emptyState}>
        {/* Animated decorative circles */}
        <View style={styles.emptyDecorations}>
          <View style={[styles.decorationCircle, styles.deco1, { backgroundColor: colors.accentLight }]} />
          <View style={[styles.decorationCircle, styles.deco2, { backgroundColor: colors.primaryLight }]} />
        </View>

        <View style={[styles.emptyIconContainer, { backgroundColor: colors.accentLight }]}>
          <Ionicons name="lock-closed" size={56} color={colors.accent} />
        </View>

        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
          Unlock your library
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sign in to access and manage all your drafts
        </ThemedText>

        <View style={styles.emptyButton}>
          <AnimatedButton
            variant="primary"
            size="lg"
            leftIcon="log-in-outline"
            onPress={() => router.push('/auth/sign-in')}
          >
            Sign In to Continue
          </AnimatedButton>
        </View>
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[20],
    paddingHorizontal: Spacing[6],
    minHeight: 400,
  },
  emptyDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    opacity: 0.6,
  },
  deco1: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  deco2: {
    width: 140,
    height: 140,
    bottom: 80,
    left: -30,
  },
  deco3: {
    width: 100,
    height: 100,
    bottom: 40,
    right: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
    ...Shadows.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing[3],
    includeFontPadding: false,
    letterSpacing: Typography.letterSpacing.tight,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[6],
    includeFontPadding: false,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 280,
  },
});
