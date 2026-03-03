/**
 * DraftCard Component
 *
 * Individual draft card with all its UI and interactions.
 * Extracted from library.tsx (lines 300-378).
 */

import { ThemedText } from '@/components/themed-text';
import { AnimatedCard } from '@/components/ui/animated';
import { BorderRadius, Shadows, Spacing, Typography, withOpacity } from '@/constants/design-system';
import { Stagger } from '@/constants/animations';
import { getDraftAccent } from '@/utils/draft-utils';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { Draft } from '@/types/draft';
import { formatRelativeTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export interface DraftCardProps {
  draft: Draft;
  index: number;
  isSelectMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

/**
 * Draft card component
 */
export function DraftCard({ draft, index, isSelectMode, isSelected, onPress, onLongPress }: DraftCardProps) {
  const colors = useThemeColors();
  const accent = getDraftAccent(index);

  return (
    <AnimatedCard
      key={draft.id}
      variant="elevated"
      pressable={true}
      onPress={onPress}
      onLongPress={onLongPress}
      delay={Stagger.delay(index)}
      style={[
        styles.draftCard,
        { borderLeftColor: accent.primary, borderLeftWidth: 4 },
        isSelected && styles.draftCardSelected,
      ]}
      accessibilityLabel={`${draft.title || 'Untitled Draft'}, ${formatRelativeTime(new Date(draft.createdAt))}`}
      accessibilityHint={isSelectMode ? (isSelected ? 'Selected. Tap to deselect.' : 'Tap to select.') : 'Tap to open, long press for options.'}
    >
      {/* Selection indicator */}
      {isSelectMode && (
        <View
          style={[
            styles.selectionIndicator,
            { backgroundColor: isSelected ? accent.primary : colors.surface },
            { borderColor: isSelected ? accent.primary : colors.border },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
          )}
        </View>
      )}

      {/* Published badge */}
      {draft.status === 'published' && !isSelectMode && (
        <View style={[styles.publishedBadge, { backgroundColor: accent.light }]}>
          <Ionicons name="eye" size={12} color={accent.primary} />
        </View>
      )}

      {/* Title */}
      <ThemedText style={[styles.draftTitle, isSelectMode && styles.draftTitleWithSelect]} numberOfLines={2}>
        {draft.title || 'Untitled Draft'}
      </ThemedText>

      {/* Preview */}
      {draft.content && (
        <ThemedText style={[styles.draftPreview, isSelectMode && styles.draftContentWithSelect]} numberOfLines={3}>
          {draft.content.replace(/[#*_\n]/g, ' ')}
        </ThemedText>
      )}

      {/* Footer with metadata */}
      <View style={[styles.draftFooter, isSelectMode && styles.draftFooterWithSelect]}>
        <View style={styles.draftMeta}>
          <View style={[styles.metaIcon, { backgroundColor: withOpacity(accent.primary, 0.1) }]}>
            <Ionicons name="time-outline" size={14} color={accent.primary} />
          </View>
          <ThemedText style={[styles.draftMetaText, { color: colors.textSecondary }]}>
            {formatRelativeTime(new Date(draft.createdAt)) || 'Just now'}
          </ThemedText>
        </View>

        {draft.wordCount != null && draft.wordCount > 0 && (
          <View style={styles.draftMeta}>
            <View style={[styles.metaIcon, { backgroundColor: withOpacity(colors.accent, 0.1) }]}>
              <Ionicons name="document-text-outline" size={14} color={colors.accent} />
            </View>
            <ThemedText style={[styles.draftMetaText, { color: colors.textSecondary }]}>
              {String(draft.wordCount)} words
            </ThemedText>
          </View>
        )}
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  draftCard: {
    marginBottom: Spacing[4],
    padding: 0,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  draftCardSelected: {
    opacity: 0.9,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing[4],
    left: Spacing[4],
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  publishedBadge: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[0.5],
  },
  draftTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    paddingHorizontal: Spacing[5],
    paddingRight: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[2],
    includeFontPadding: false,
    letterSpacing: Typography.letterSpacing.tight,
  },
  draftTitleWithSelect: {
    paddingLeft: 52,
  },
  draftPreview: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    paddingHorizontal: Spacing[5],
    paddingRight: Spacing[5],
    paddingBottom: Spacing[3],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  draftContentWithSelect: {
    paddingLeft: 52,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  draftFooterWithSelect: {
    paddingLeft: 52,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  metaIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftMetaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});
