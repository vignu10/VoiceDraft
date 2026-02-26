/**
 * DraftMenu Component
 *
 * Bottom sheet modal with draft actions.
 * Extracted from library.tsx (lines 679-780).
 */

import { ThemedText } from '@/components/themed-text';
import { FadeIn } from '@/components/ui/animated';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

export interface DraftMenuProps {
  visible: boolean;
  onClose: () => void;
  draft: Draft | null;
  onAction: (action: string) => void;
  onPressOpen: () => void;
  onPublishToggle: () => void;
}

/**
 * Draft action menu modal
 */
export function DraftMenu({ visible, onClose, draft, onAction, onPressOpen, onPublishToggle }: DraftMenuProps) {
  const colors = useThemeColors();

  if (!draft) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <FadeIn>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
            {/* Open Draft */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                onClose();
                onPressOpen();
              }}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Open Draft</ThemedText>
            </TouchableOpacity>

            {/* Toggle Favorite */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => onAction('favorite')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.accentLight }]}>
                <Ionicons
                  name={draft?.isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={colors.accent}
                />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>
                {draft?.isFavorite ? 'Unfavorite' : 'Favorite'}
              </ThemedText>
            </TouchableOpacity>

            {/* Duplicate */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => onAction('duplicate')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.tealLight || withOpacity(colors.teal, 0.1) }]}>
                <Ionicons name="copy-outline" size={20} color={colors.teal} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Duplicate</ThemedText>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => onAction('share')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.successLight }]}>
                <Ionicons name="share-outline" size={20} color={colors.success} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Share</ThemedText>
            </TouchableOpacity>

            {/* Publish Toggle */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                onClose();
                onPublishToggle();
              }}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.infoLight }]}>
                <Ionicons
                  name={draft?.status === 'published' ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.info}
                />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>
                {draft?.status === 'published' ? 'Unpublish' : 'Publish'}
              </ThemedText>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.menuItemDestructive}
              onPress={() => onAction('delete')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.error }]}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </FadeIn>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
    ...Shadows.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[4],
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemDestructive: {
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});

// Helper for tealLight since it might not exist in all themes
function withOpacity(color: string, opacity: number): string {
  // Simple opacity helper - in a real app this would be more sophisticated
  return color; // Placeholder - actual implementation would parse and modify color
}
