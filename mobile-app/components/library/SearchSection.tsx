/**
 * SearchSection Component
 *
 * Search input with clear button.
 * Extracted from library.tsx (lines 547-582).
 */

import { SlideIn, PressableScale } from '@/components/ui/animated';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

export interface SearchSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

/**
 * Search input section with clear button
 */
export function SearchSection({
  value,
  onChangeText,
  placeholder = 'Search your drafts...',
  accessibilityLabel = 'Search drafts',
}: SearchSectionProps) {
  const colors = useThemeColors();

  return (
    <SlideIn direction="down" delay={0}>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.searchIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="search" size={18} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            value={value}
            onChangeText={onChangeText}
            accessibilityLabel={accessibilityLabel}
          />
          {value.length > 0 && (
            <PressableScale
              onPress={() => onChangeText('')}
              scale={0.9}
              haptic={false}
              accessibilityLabel="Clear search"
              style={styles.clearButton}
            >
              <View style={[styles.clearButtonBg, { backgroundColor: colors.border }]}>
                <Ionicons name="close" size={16} color={colors.text} />
              </View>
            </PressableScale>
          )}
        </View>
      </View>
    </SlideIn>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  searchIconBg: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  clearButton: {
    padding: Spacing[1],
  },
  clearButtonBg: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
