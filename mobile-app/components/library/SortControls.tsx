/**
 * SortControls Component
 *
 * Pill-style sort option buttons.
 * Extracted from library.tsx (lines 584-640).
 */

import { ThemedText } from '@/components/themed-text';
import { SlideIn, PressableScale } from '@/components/ui/animated';
import { BorderRadius, Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import type { SortOption } from '@/utils/draft-utils';
import { StyleSheet, View } from 'react-native';

export interface SortControlsProps {
  sortBy: SortOption;
  onChange: (sortBy: SortOption) => void;
}

/**
 * Sort control pills
 */
export function SortControls({ sortBy, onChange }: SortControlsProps) {
  const colors = useThemeColors();

  return (
    <SlideIn direction="down" delay={0}>
      <View style={styles.sortContainer}>
        <PressableScale
          onPress={() => onChange('date')}
          haptic={false}
          style={[
            styles.sortOption,
            {
              backgroundColor: sortBy === 'date' ? colors.primary : colors.surface,
              borderColor: sortBy === 'date' ? colors.primary : colors.border,
              shadowColor: sortBy === 'date' ? colors.primary : undefined,
              shadowOpacity: sortBy === 'date' ? 0.3 : 0,
              elevation: sortBy === 'date' ? 4 : 0,
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={sortBy === 'date' ? colors.textInverse : colors.textSecondary}
            style={{ marginRight: Spacing[1] }}
          />
          <ThemedText
            style={[styles.sortText, { color: sortBy === 'date' ? colors.textInverse : colors.text }]}
          >
            Recent
          </ThemedText>
        </PressableScale>
        <PressableScale
          onPress={() => onChange('title')}
          haptic={false}
          style={[
            styles.sortOption,
            {
              backgroundColor: sortBy === 'title' ? colors.accent : colors.surface,
              borderColor: sortBy === 'title' ? colors.accent : colors.border,
              shadowColor: sortBy === 'title' ? colors.accent : undefined,
              shadowOpacity: sortBy === 'title' ? 0.3 : 0,
              elevation: sortBy === 'title' ? 4 : 0,
            },
          ]}
        >
          <Ionicons
            name="text-outline"
            size={16}
            color={sortBy === 'title' ? colors.textInverse : colors.textSecondary}
            style={{ marginRight: Spacing[1] }}
          />
          <ThemedText
            style={[styles.sortText, { color: sortBy === 'title' ? colors.textInverse : colors.text }]}
          >
            Title
          </ThemedText>
        </PressableScale>
      </View>
    </SlideIn>
  );
}

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    minWidth: 48,
    minHeight: 44,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sortText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
    letterSpacing: Typography.letterSpacing.tight,
  },
});
