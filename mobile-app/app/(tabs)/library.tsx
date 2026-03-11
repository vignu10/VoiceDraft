/**
 * Library Tab Screen
 *
 * Displays user's drafts with search, sort, and selection capabilities.
 * Refactored to use extracted hooks and components (~300 lines, down from 1,177).
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  LibraryHeader,
  SearchSection,
  SortControls,
  DraftCard,
  DraftMenu,
  EmptyState,
  SelectionBar,
} from '@/components/library';
import { useDialog } from '@/components/ui/dialog';
import { PublishSuccessToast } from '@/components/publish';
import { deletePost } from '@/services/api/posts';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryData } from '@/hooks/use-library-data';
import { useDraftSelection } from '@/hooks/use-draft-selection';
import { useDraftActions } from '@/hooks/use-draft-actions';
import type { Draft } from '@/types/draft';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryTab() {
  const colors = useThemeColors();
  const { showDialog } = useDialog();
  const { isAuthenticated } = useAuthStore();

  // Data management
  const {
    drafts,
    filteredDrafts,
    isLoading,
    syncError,
    searchQuery,
    sortBy,
    setSearchQuery,
    setSortBy,
    refresh,
  } = useLibraryData();

  // Local state for drafts (for optimistic updates)
  const [localDrafts, setLocalDrafts] = useState<Draft[]>(drafts);

  // Sync drafts from data hook when drafts change
  useEffect(() => {
    setLocalDrafts(drafts);
  }, [drafts]);

  // Selection management
  const filteredDraftIds = useMemo(() => filteredDrafts.map((d) => d.id), [filteredDrafts]);
  const allDraftIds = useMemo(() => localDrafts.map((d) => d.id), [localDrafts]);

  const {
    selectedIds,
    isSelectMode,
    selectedCount,
    isAllSelected,
    selectAllText,
    startSelectMode,
    exitSelectMode,
    toggleSelection,
    selectAll,
  } = useDraftSelection(allDraftIds, filteredDraftIds);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [menuDraftId, setMenuDraftId] = useState<string | null>(null);

  // Draft actions hook
  const {
    handleMenuAction,
    handlePublishToggle,
    publishedPostUrl,
    setPublishedPostUrl,
  } = useDraftActions({
    drafts: localDrafts,
    setDrafts: setLocalDrafts,
    menuDraftId,
    setShowMenu,
    showDialog,
  });

  // Handler for toast dismissal
  const handleToastDismiss = useCallback(() => {
    setPublishedPostUrl(null);
  }, [setPublishedPostUrl]);

  // Handle draft press
  const handleDraftPress = useCallback(
    (id: string) => {
      if (isSelectMode) {
        toggleSelection(id);
      } else {
        router.push({
          pathname: '/draft/[id]',
          params: { id },
        });
      }
    },
    [isSelectMode, toggleSelection]
  );

  // Handle long press to show menu
  const handleLongPress = useCallback((id: string) => {
    setMenuDraftId(id);
    setShowMenu(true);
  }, []);

  // Handle delete selected
  const handleDeleteSelected = useCallback(async () => {
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
        // Refresh data
        refresh();
      },
    });

    if (confirmed) {
      exitSelectMode();
    }
  }, [selectedIds, showDialog, refresh, exitSelectMode]);

  // Render draft card
  const renderDraft = useCallback(
    ({ item, index }: { item: Draft; index: number }) => (
      <DraftCard
        key={item.id}
        draft={item}
        index={index}
        isSelectMode={isSelectMode}
        isSelected={selectedIds.has(item.id)}
        onPress={() => handleDraftPress(item.id)}
        onLongPress={() => handleLongPress(item.id)}
      />
    ),
    [isSelectMode, selectedIds, handleDraftPress, handleLongPress]
  );

  const menuDraft = useMemo(() => localDrafts.find((d) => d.id === menuDraftId) || null, [localDrafts, menuDraftId]);

  return (
    <>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']}>
          <View style={styles.safeArea}>
            {/* Header */}
            <LibraryHeader
              draftCount={localDrafts.length}
              isSelectMode={isSelectMode}
              onSelectModeToggle={isSelectMode ? exitSelectMode : startSelectMode}
            >
              {/* Selection Bar */}
              {isSelectMode && (
                <SelectionBar
                  selectedCount={selectedCount}
                  selectAllText={selectAllText}
                  onSelectAll={selectAll}
                  onDelete={handleDeleteSelected}
                />
              )}
            </LibraryHeader>

            {/* Search */}
            <SearchSection
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Sort Controls */}
            <SortControls
              sortBy={sortBy}
              onChange={setSortBy}
            />

            {/* Draft List */}
            {isLoading ? (
              <View style={styles.listContent}>
                <LoadingSpinner
                  size="lg"
                  message="Loading your drafts..."
                  centerInContainer={true}
                />
              </View>
            ) : (
              <FlatList
                data={filteredDrafts}
                renderItem={renderDraft}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => <EmptyState isAuthenticated={isAuthenticated} />}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                maxToRenderPerBatch={8}
                windowSize={10}
                initialNumToRender={12}
                updateCellsBatchingPeriod={50}
              />
            )}

            {/* Sync Error Message */}
            {syncError && (
              <View style={[styles.syncErrorBanner, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <ThemedText style={[styles.syncErrorText, { color: colors.error }]}>
                  {syncError}
                </ThemedText>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ThemedView>

      {/* Draft Menu */}
      <DraftMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        draft={menuDraft}
        onAction={handleMenuAction}
        onPressOpen={() => {
          if (menuDraftId) {
            setShowMenu(false);
            router.push({
              pathname: '/draft/[id]',
              params: { id: menuDraftId },
            });
          }
        }}
        onPublishToggle={() => {
          if (menuDraft) {
            handlePublishToggle(menuDraft);
          }
        }}
      />

      {/* Publish Success Toast */}
      <PublishSuccessToast
        visible={publishedPostUrl !== null}
        postUrl={publishedPostUrl || ''}
        onViewPress={async () => {
          await showDialog({
            title: 'Coming Soon',
            message: 'View in browser feature will be available soon!',
            variant: 'default',
            confirmText: 'OK',
            onConfirm: () => {},
          });
        }}
        onSharePress={async () => {
          await showDialog({
            title: 'Coming Soon',
            message: 'Share feature will be available soon!',
            variant: 'default',
            confirmText: 'OK',
            onConfirm: () => {},
          });
        }}
        onDismiss={handleToastDismiss}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
    flexGrow: 1,
  },
  syncErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
  },
  syncErrorText: {
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
