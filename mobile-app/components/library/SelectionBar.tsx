/**
 * SelectionBar Component
 *
 * Selection mode bar with count, select all, and delete button.
 * Extracted from library.tsx (lines 512-545).
 */

import { ThemedText } from '@/components/themed-text';
import { FadeIn, PressableScale } from '@/components/ui/animated';
import { BorderRadius, Shadows, Spacing, Typography, withOpacity } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export interface SelectionBarProps {
  selectedCount: number;
  selectAllText: string;
  onSelectAll: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

/**
 * Selection bar shown when in selection mode
 */
export function SelectionBar({ selectedCount, selectAllText, onSelectAll, onDelete, isDeleting = false }: SelectionBarProps) {
  const colors = useThemeColors();

  return (
    <FadeIn>
      <View style={[styles.selectionBar, { backgroundColor: colors.primary, borderTopColor: colors.primary }]}>
        <View style={styles.selectionCountContainer}>
          <View style={[styles.selectionCountBadge, { backgroundColor: colors.textInverse }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.selectionText, { color: colors.textInverse }]}>
            {selectedCount} selected
          </ThemedText>
        </View>

        <PressableScale
          onPress={onSelectAll}
          haptic={false}
          style={[styles.selectionAction, { backgroundColor: withOpacity(colors.textInverse, 0.2) }]}
          accessibilityLabel={selectAllText}
        >
          <ThemedText style={[styles.selectionActionText, { color: colors.textInverse }]}>
            {selectAllText}
          </ThemedText>
        </PressableScale>

        <View style={[styles.deleteButtonWrapper]}>
          <PressableScale
            onPress={isDeleting ? undefined : onDelete}
            haptic={false}
            style={[
              styles.deleteButton,
              { backgroundColor: colors.error, opacity: isDeleting ? 0.7 : 1 },
            ]}
            accessibilityLabel="Delete selected drafts"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="trash" size={20} color={colors.textInverse} />
            )}
          </PressableScale>
        </View>
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    marginHorizontal: Spacing[4],
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  selectionCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  selectionCountBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tight,
    includeFontPadding: false,
  },
  selectionAction: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    minWidth: 48,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
    letterSpacing: Typography.letterSpacing.tight,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  deleteButtonWrapper: {
    width: 44,
    height: 44,
  },
});
