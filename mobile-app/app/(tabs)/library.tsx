import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useDialog } from '@/components/ui/dialog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatRelativeTime } from '@/utils/formatters';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import {
  FadeIn,
  SlideIn,
  PressableScale,
  AnimatedCard,
  AnimatedButton,
} from '@/components/ui/animated';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';
import { Duration, Stagger } from '@/constants/animations';
import * as Haptics from 'expo-haptics';
import { listPosts, deletePost, publishPost, unpublishPost } from '@/services/api/posts';
import { useAuthStore } from '@/stores/auth-store';

type SortOption = 'date' | 'title';

export default function LibraryTab() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuDraftId, setMenuDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const colors = useThemeColors();
  const { showDialog } = useDialog();
  const { isAuthenticated } = useAuthStore();

  const loadPosts = useCallback(async () => {
    if (!isAuthenticated) {
      setSyncError('Please sign in to view your drafts');
      return;
    }

    setIsLoading(true);
    setSyncError(null);

    try {
      const posts = await listPosts({ status: 'draft' });

      // Map Post to Draft format for local display
      const mappedDrafts: Draft[] = posts.map(post => ({
        id: post.id,
        serverId: post.id,
        journalId: post.journal_id,
        status: post.status === 'published' ? 'published' : 'ready',
        title: post.title,
        metaDescription: post.meta_description,
        content: post.content,
        targetKeyword: post.target_keyword,
        transcript: post.transcript,
        wordCount: post.word_count,
        tone: 'professional', // Default, would be mapped from style_used
        length: 'medium', // Default, would be mapped from style_used
        isFavorite: false,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        syncedAt: post.updated_at,
      }));

      setDrafts(mappedDrafts);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleDraftPress = useCallback((id: string) => {
    if (isSelectMode) {
      setSelectedIds(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return newSelection;
      });
    } else {
      router.push({
        pathname: '/draft/[id]',
        params: { id },
      });
    }
  }, [isSelectMode]);

  const handleLongPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuDraftId(id);
    setShowMenu(true);
  }, []);

  const startSelectMode = useCallback(() => {
    setIsSelectMode(true);
    setSelectedIds(new Set());
    setShowMenu(false);
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
    setShowMenu(false);
  }, []);

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const confirmed = await showDialog({
      title: `Delete ${selectedIds.size} Draft${selectedIds.size > 1 ? 's' : ''}`,
      message: `Are you sure you want to delete ${selectedIds.size} draft${selectedIds.size > 1 ? 's' : ''}?`,
      variant: 'destructive',
      confirmText: 'Delete',
      onConfirm: async () => {
        // Delete each selected post from backend
        for (const id of selectedIds) {
          try {
            await deletePost(id);
          } catch (error) {
            console.error('Failed to delete post:', id, error);
          }
        }

        // Remove from local state
        const updatedDrafts = drafts.filter(d => !selectedIds.has(d.id));
        setDrafts(updatedDrafts);

        await AsyncStorage.removeItem('drafts'); // Clear old AsyncStorage

        exitSelectMode();
      },
    });

    if (confirmed) {
      exitSelectMode();
    }
  }, [drafts, selectedIds, showDialog, exitSelectMode]);

  const handleMenuAction = useCallback(async (action: string) => {
    if (!menuDraftId) return;
    setShowMenu(false);

    const draft = drafts.find(d => d.id === menuDraftId);
    if (!draft) return;

    switch (action) {
      case 'delete':
        const confirmed = await showDialog({
          title: 'Delete Draft',
          message: 'Are you sure you want to delete this draft?',
          variant: 'destructive',
          confirmText: 'Delete',
          onConfirm: async () => {
            try {
              await deletePost(draft.id);
              const updatedDrafts = drafts.filter(d => d.id !== draft.id);
              setDrafts(updatedDrafts);
            } catch (error) {
              console.error('Failed to delete draft:', error);
            }
          },
        });

        if (confirmed) {
          // Clear old AsyncStorage
          await AsyncStorage.removeItem('drafts');
        }
        break;

      case 'duplicate':
        const newDraft: Draft = {
          ...draft,
          id: Date.now().toString(),
          title: draft.title ? `${draft.title} (Copy)` : 'Untitled Draft (Copy)',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const withDuplicate = [newDraft, ...drafts];
        setDrafts(withDuplicate);
        await AsyncStorage.setItem('drafts', JSON.stringify(withDuplicate));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case 'share':
        router.push({
          pathname: '/keyword',
          params: { shareDraftId: draft.id },
        });
        break;

      case 'favorite':
        const favDrafts = drafts.map(d =>
          d.id === menuDraftId ? { ...d, isFavorite: !d.isFavorite } : d
        );
        setDrafts(favDrafts);
        await AsyncStorage.setItem('drafts', JSON.stringify(favDrafts));
        break;
    }
  }, [drafts, menuDraftId, showDialog, router]);

  const handlePublishToggle = useCallback(async (draft: Draft) => {
    try {
      if (draft.status === 'published') {
        await unpublishPost(draft.serverId!);
        const updatedDrafts = drafts.map(d =>
          d.id === draft.id ? { ...d, status: 'ready' as const } : d
        );
        setDrafts(updatedDrafts);
      } else {
        await publishPost(draft.serverId!);
        const updatedDrafts = drafts.map(d =>
          d.id === draft.id ? { ...d, status: 'published' as const } : d
        );
        setDrafts(updatedDrafts);
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  }, [drafts]);

  // Memoized filtered drafts
  const filteredDrafts = useMemo(() => {
    return drafts
      .filter((draft) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          draft.title?.toLowerCase().includes(query) ||
          draft.content?.toLowerCase().includes(query) ||
          draft.targetKeyword?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [drafts, searchQuery, sortBy]);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = filteredDrafts.map(d => d.id);
      const allSelected = allIds.length > 0 && allIds.every(id => prev.has(id));
      return allSelected ? new Set<string>() : new Set(allIds);
    });
  }, [filteredDrafts]);

  const selectedCount = selectedIds.size;
  const hasSelections = selectedCount > 0;
  const isAllSelected = filteredDrafts.length > 0 && selectedCount === filteredDrafts.length;

  const renderDraft = useCallback(({ item, index }: { item: Draft; index: number }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <AnimatedCard
        key={item.id}
        variant="elevated"
        pressable={true}
        onPress={() => handleDraftPress(item.id)}
        onLongPress={() => handleLongPress(item.id)}
        delay={Stagger.delay(index)}
        style={[styles.draftCard, isSelected && styles.draftCardSelected]}
        accessibilityLabel={`${item.title || 'Untitled Draft'}, ${formatRelativeTime(new Date(item.createdAt))}`}
        accessibilityHint={isSelectMode ? (isSelected ? 'Selected. Tap to deselect.' : 'Tap to select.') : 'Tap to open, long press for options.'}
      >
        {/* Selection indicator */}
        {isSelectMode && (
          <View
            style={[
              styles.selectionIndicator,
              { backgroundColor: isSelected ? colors.primary : colors.surface },
              { borderColor: isSelected ? colors.primary : colors.border },
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
            )}
          </View>
        )}

        {/* Title */}
        <ThemedText style={[styles.draftTitle, isSelectMode && styles.draftTitleWithSelect]} numberOfLines={2}>
          {item.title || 'Untitled Draft'}
        </ThemedText>

        {/* Preview */}
        {item.content && (
          <ThemedText style={[styles.draftPreview, isSelectMode && styles.draftContentWithSelect]} numberOfLines={3}>
            {item.content.replace(/[#*_\n]/g, ' ')}
          </ThemedText>
        )}

        {/* Footer with metadata */}
        <View style={[styles.draftFooter, isSelectMode && styles.draftFooterWithSelect]}>
          <View style={styles.draftMeta}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <ThemedText style={[styles.draftMetaText, { color: colors.textMuted }]}>
              {formatRelativeTime(new Date(item.createdAt))}
            </ThemedText>
          </View>

          {item.wordCount && (
            <View style={styles.draftMeta}>
              <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
              <ThemedText style={[styles.draftMetaText, { color: colors.textMuted }]}>
                {item.wordCount} words
              </ThemedText>
            </View>
          )}
        </View>
      </AnimatedCard>
    );
  }, [selectedIds, isSelectMode, colors.primary, colors.surface, colors.border, colors.textInverse, colors.text, colors.textSecondary, colors.textMuted, colors.accent]);

  const EmptyState = useCallback(() => (
    <FadeIn delay={Duration.fast}>
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="document-text-outline" size={48} color={colors.primary} />
        </View>
        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
          No drafts yet
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          Start recording to create your first blog post
        </ThemedText>
        <AnimatedButton
          variant="primary"
          size="lg"
          leftIcon="mic"
          onPress={() => router.push('/recording')}
        >
          Start Recording
        </AnimatedButton>
      </View>
    </FadeIn>
  ), [colors]);

  const selectAllText = isAllSelected ? 'Deselect All' : 'Select All';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <SlideIn direction="down" delay={0}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText style={[styles.title, { color: colors.text }]}>Library</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
              </ThemedText>
            </View>

            {!isSelectMode ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={startSelectMode}
                accessibilityLabel="Select multiple drafts"
              >
                <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={exitSelectMode}
                accessibilityLabel="Exit selection mode"
              >
                <Ionicons name="close-circle" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </SlideIn>

        {/* Selection Bar */}
        {isSelectMode && (
          <FadeIn>
            <View style={[styles.selectionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <View style={styles.selectionCountContainer}>
                <View style={[styles.selectionCountBadge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
                <ThemedText style={[styles.selectionText, { color: colors.text }]}>
                  {selectedCount} selected
                </ThemedText>
              </View>

              <PressableScale
                onPress={selectAll}
                haptic={false}
                style={[styles.selectionAction, { borderColor: colors.border }]}
                accessibilityLabel={selectAllText}
              >
                <ThemedText style={[styles.selectionActionText, { color: colors.primary }]}>
                  {selectAllText}
                </ThemedText>
              </PressableScale>

              <PressableScale
                onPress={deleteSelected}
                haptic={false}
                style={[styles.deleteButton, { borderColor: hasSelections ? colors.error : colors.error + '15' }]}
                disabled={!hasSelections}
                accessibilityLabel="Delete selected drafts"
              >
                <Ionicons name="trash" size={20} color={hasSelections ? colors.textInverse : colors.textMuted} />
              </PressableScale>
            </View>
          </FadeIn>
        )}

        {/* Search */}
        <SlideIn direction="down" delay={Duration.fastest}>
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search drafts..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search drafts"
              />
              {searchQuery.length > 0 && (
                <PressableScale
                  onPress={() => setSearchQuery('')}
                  scale={0.9}
                  haptic={false}
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </PressableScale>
              )}
            </View>
          </View>
        </SlideIn>

        {/* Sort Options */}
        <SlideIn direction="down" delay={Duration.fastest}>
          <View style={styles.sortContainer}>
            <PressableScale
              onPress={() => setSortBy('date')}
              haptic={false}
              style={[
                styles.sortOption,
                {
                  backgroundColor: sortBy === 'date' ? colors.primary : 'transparent',
                  borderColor: sortBy === 'date' ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.sortText, { color: sortBy === 'date' ? colors.textInverse : colors.text }]}
              >
                Recent
              </ThemedText>
            </PressableScale>
            <PressableScale
              onPress={() => setSortBy('title')}
              haptic={false}
              style={[
                styles.sortOption,
                {
                  backgroundColor: sortBy === 'title' ? colors.primary : 'transparent',
                  borderColor: sortBy === 'title' ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.sortText, { color: sortBy === 'title' ? colors.textInverse : colors.text }]}
              >
                Title
              </ThemedText>
            </PressableScale>
          </View>
        </SlideIn>

        {/* Draft List */}
        <FlatList
          data={filteredDrafts}
          renderItem={renderDraft}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          maxToRenderPerBatch={8}
          windowSize={10}
          initialNumToRender={12}
          updateCellsBatchingPeriod={50}
        />

        {/* Sync Error Message */}
        {syncError && (
          <View style={styles.syncErrorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <ThemedText style={[styles.syncErrorText, { color: colors.text }]}>
              {syncError}
            </ThemedText>
          </View>
        )}
      </SafeAreaView>

      {/* Draft Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
            {/* Open Draft */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenu(false);
                handleDraftPress(menuDraftId!);
              }}
            >
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Open Draft</ThemedText>
            </TouchableOpacity>

            {/* Toggle Favorite */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleMenuAction('favorite')}
            >
              <Ionicons
                name={drafts.find(d => d.id === menuDraftId)?.isFavorite ? 'star' : 'star-outline'}
                size={22}
                color={colors.accent}
              />
              <ThemedText style={[styles.menuText, { color: colors.text }]}>
                {drafts.find(d => d.id === menuDraftId)?.isFavorite ? 'Unfavorite' : 'Favorite'}
              </ThemedText>
            </TouchableOpacity>

            {/* Duplicate */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleMenuAction('duplicate')}
            >
              <Ionicons name="copy-outline" size={22} color={colors.info} />
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Duplicate</ThemedText>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleMenuAction('share')}
            >
              <Ionicons name="share-outline" size={22} color={colors.success} />
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Share</ThemedText>
            </TouchableOpacity>

            {/* Publish Toggle */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                const draft = drafts.find(d => d.id === menuDraftId);
                if (draft) {
                  setShowMenu(false);
                  handlePublishToggle(draft);
                }
              }}
            >
              <Ionicons
                name={drafts.find(d => d.id === menuDraftId)?.status === 'published' ? 'eye-off' : 'eye'}
                size={22}
                color={colors.info}
              />
              <ThemedText style={[styles.menuText, { color: colors.text }]}>
                {drafts.find(d => d.id === menuDraftId)?.status === 'published' ? 'Unpublish' : 'Publish'}
              </ThemedText>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.menuItemDestructive}
              onPress={() => handleMenuAction('delete')}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[4],
    minHeight: 70,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    marginTop: 2,
  },
  iconButton: {
    padding: Spacing[2],
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
  },
  selectionCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  selectionCountBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: -0.2,
  },
  selectionAction: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
    letterSpacing: -0.2,
  },
  deleteButton: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  sortOption: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
    letterSpacing: -0.2,
  },
  searchContainer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    includeFontPadding: false,
  },
  listContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: 120,
    flexGrow: 1,
  },
  draftCard: {
    marginBottom: Spacing[4],
    padding: 0,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  draftCardSelected: {
    borderLeftColor: 'transparent',
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing[4],
    left: Spacing[4],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  draftTitle: {
    fontSize: 18,
    fontWeight: Typography.fontWeight.bold,
    paddingHorizontal: 0,
    paddingRight: Spacing[5],
    marginBottom: Spacing[2],
    includeFontPadding: false,
  },
  draftTitleWithSelect: {
    paddingLeft: 52,
  },
  draftPreview: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    paddingHorizontal: 0,
    paddingRight: Spacing[5],
    marginBottom: Spacing[3],
    lineHeight: 20,
    includeFontPadding: false,
  },
  draftContentWithSelect: {
    paddingLeft: 52,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },
  draftFooterWithSelect: {
    paddingLeft: 52,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
  },
  draftMetaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[16],
    paddingHorizontal: Spacing[6],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    includeFontPadding: false,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[8],
    includeFontPadding: false,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    borderRadius: BorderRadius.lg,
    paddingTop: Spacing[2],
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
  menuItemDestructive: {
    justifyContent: 'center',
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  syncErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
  },
  syncErrorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
});
