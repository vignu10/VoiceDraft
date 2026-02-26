/**
 * LibraryHeader Component
 *
 * Header with gradient title and selection mode toggle.
 * Extracted from library.tsx (lines 467-545).
 */

import { ThemedText } from '@/components/themed-text';
import { SlideIn, PressableScale } from '@/components/ui/animated';
import { BorderRadius, Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export interface LibraryHeaderProps {
  title?: string;
  draftCount: number;
  isSelectMode: boolean;
  onSelectModeToggle: () => void;
  children?: ReactNode; // For selection bar when in select mode
}

/**
 * Library header with gradient title and optional selection bar
 */
export function LibraryHeader({
  title = 'Library',
  draftCount,
  isSelectMode,
  onSelectModeToggle,
  children,
}: LibraryHeaderProps) {
  const colors = useThemeColors();

  return (
    <SlideIn direction="down" delay={0}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <ThemedText style={styles.title}>{title}</ThemedText>
            </LinearGradient>
          </View>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {draftCount} {draftCount === 1 ? 'draft' : 'drafts'}
            {draftCount > 0 && ' · '}
            {draftCount === 0 ? 'Start creating!' : 'Ready to publish?'}
          </ThemedText>
        </View>

        {!isSelectMode ? (
          <PressableScale
            style={styles.iconButton}
            onPress={onSelectModeToggle}
            hapticStyle="light"
            accessibilityLabel="Select multiple drafts"
          >
            <View style={[styles.iconButtonBg, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="layers-outline" size={22} color={colors.primary} />
            </View>
          </PressableScale>
        ) : (
          <PressableScale
            style={styles.iconButton}
            onPress={onSelectModeToggle}
            hapticStyle="light"
            accessibilityLabel="Exit selection mode"
          >
            <View style={[styles.iconButtonBg, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="close" size={22} color={colors.error} />
            </View>
          </PressableScale>
        )}
      </View>
      {children}
    </SlideIn>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[5],
    minHeight: 90,
  },
  headerLeft: {
    flex: 1,
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
    fontSize: Typography.fontSize['5xl'],
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
  iconButton: {
    padding: Spacing[2],
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
