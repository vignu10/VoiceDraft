import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  AnimatedButton,
  AnimatedCard,
  FadeIn,
  PressableScale,
  SlideIn,
} from '@/components/ui/animated';
import { useDialog } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading';
import { Duration, Stagger } from '@/constants/animations';
import { BorderRadius, Palette, Shadows, Spacing, Typography, withOpacity } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import { deletePost, listPosts, publishPost, unpublishPost } from '@/services/api/posts';
import { useAuthStore } from '@/stores/auth-store';
import type { Draft } from '@/types/draft';
import { formatRelativeTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      setDrafts([]);
      setIsLoading(false);
      setSyncError(null);
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
  }, [drafts, menuDraftId, showDialog]);

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
  const isAllSelected = filteredDrafts.length > 0 && selectedCount === filteredDrafts.length;

  // Color accent for each draft based on index for playful variety
  const getDraftAccent = (index: number) => {
    const accents = [
      { primary: Palette.periwinkle[500], light: Palette.periwinkle[50], gradient: ['#8B5CF6', '#A78BFA'] },
      { primary: Palette.coral[500], light: Palette.coral[50], gradient: ['#EC5D72', '#FFA8B4'] },
      { primary: Palette.teal[500], light: Palette.teal[50], gradient: ['#14B8A6', '#5EEAD4'] },
    ];
    return accents[index % accents.length];
  };

  const renderDraft = useCallback(({ item, index }: { item: Draft; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    const accent = getDraftAccent(index);

    return (
      <AnimatedCard
        key={item.id}
        variant="elevated"
        pressable={true}
        onPress={() => handleDraftPress(item.id)}
        onLongPress={() => handleLongPress(item.id)}
        delay={Stagger.delay(index)}
        style={[
          styles.draftCard,
          { borderLeftColor: accent.primary, borderLeftWidth: 4 },
          isSelected && styles.draftCardSelected,
        ]}
        accessibilityLabel={`${item.title || 'Untitled Draft'}, ${formatRelativeTime(new Date(item.createdAt))}`}
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
        {item.status === 'published' && !isSelectMode && (
          <View style={[styles.publishedBadge, { backgroundColor: accent.light }]}>
            <Ionicons name="eye" size={12} color={accent.primary} />
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
            <View style={[styles.metaIcon, { backgroundColor: withOpacity(accent.primary, 0.1) }]}>
              <Ionicons name="time-outline" size={14} color={accent.primary} />
            </View>
            <ThemedText style={[styles.draftMetaText, { color: colors.textSecondary }]}>
              {formatRelativeTime(new Date(item.createdAt)) || 'Just now'}
            </ThemedText>
          </View>

          {item.wordCount != null && item.wordCount > 0 && (
            <View style={styles.draftMeta}>
              <View style={[styles.metaIcon, { backgroundColor: withOpacity(colors.accent, 0.1) }]}>
                <Ionicons name="document-text-outline" size={14} color={colors.accent} />
              </View>
              <ThemedText style={[styles.draftMetaText, { color: colors.textSecondary }]}>
                {String(item.wordCount)} words
              </ThemedText>
            </View>
          )}
        </View>
      </AnimatedCard>
    );
  }, [selectedIds, isSelectMode, colors, handleDraftPress, handleLongPress]);

  const EmptyState = useCallback(() => (
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
          Transform your voice into beautiful blog posts
        </ThemedText>

        <View style={styles.emptyButton}>
          <AnimatedButton
            variant="primary"
            size="lg"
            leftIcon="add"
            onPress={() => router.push('/recording')}
          >
            Create Your First Draft
          </AnimatedButton>
        </View>
      </View>
    </FadeIn>
  ), [colors]);

  const AuthRequiredState = useCallback(() => (
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
            onPress={() => router.replace('/auth/sign-in')}
          >
            Sign In to Continue
          </AnimatedButton>
        </View>
      </View>
    </FadeIn>
  ), [colors]);

  const selectAllText = isAllSelected ? 'Deselect All' : 'Select All';

  return (
    <>
      <ThemedView style={styles.container}>
        {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.safeArea}>
            {/* Playful Gradient Header */}
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
                      <ThemedText style={styles.title}>Library</ThemedText>
                    </LinearGradient>
                  </View>
                  <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}{drafts.length > 0 && ' · '}{drafts.length === 0 ? 'Start creating!' : 'Ready to publish?'}
                  </ThemedText>
                </View>

                {!isSelectMode ? (
                  <PressableScale
                    style={styles.iconButton}
                    onPress={startSelectMode}
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
                    onPress={exitSelectMode}
                    hapticStyle="light"
                    accessibilityLabel="Exit selection mode"
                  >
                    <View style={[styles.iconButtonBg, { backgroundColor: colors.errorLight }]}>
                      <Ionicons name="close" size={22} color={colors.error} />
                    </View>
                  </PressableScale>
                )}
              </View>
            </SlideIn>

            {/* Selection Bar */}
            {isSelectMode && (
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
                    onPress={selectAll}
                    haptic={false}
                    style={[styles.selectionAction, { backgroundColor: withOpacity(colors.textInverse, 0.2) }]}
                    accessibilityLabel={selectAllText}
                  >
                    <ThemedText style={[styles.selectionActionText, { color: colors.textInverse }]}>
                      {selectAllText}
                    </ThemedText>
                  </PressableScale>

                  <PressableScale
                    onPress={deleteSelected}
                    haptic={false}
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    accessibilityLabel="Delete selected drafts"
                  >
                    <Ionicons name="trash" size={20} color={colors.textInverse} />
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
                  <View style={[styles.searchIconBg, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="search" size={18} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search your drafts..."
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

            {/* Sort Options - Pill style */}
            <SlideIn direction="down" delay={Duration.fastest}>
              <View style={styles.sortContainer}>
                <PressableScale
                  onPress={() => setSortBy('date')}
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
                  onPress={() => setSortBy('title')}
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
                ListEmptyComponent={!isAuthenticated ? AuthRequiredState : EmptyState}
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
              <View style={[styles.menuIconBg, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Open Draft</ThemedText>
            </TouchableOpacity>

            {/* Toggle Favorite */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleMenuAction('favorite')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.accentLight }]}>
                <Ionicons
                  name={drafts.find(d => d.id === menuDraftId)?.isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={colors.accent}
                />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>
                {drafts.find(d => d.id === menuDraftId)?.isFavorite ? 'Unfavorite' : 'Favorite'}
              </ThemedText>
            </TouchableOpacity>

            {/* Duplicate */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleMenuAction('duplicate')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.tealLight || withOpacity(colors.teal, 0.1) }]}>
                <Ionicons name="copy-outline" size={20} color={colors.teal} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>Duplicate</ThemedText>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleMenuAction('share')}
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
                const draft = drafts.find(d => d.id === menuDraftId);
                if (draft) {
                  setShowMenu(false);
                  handlePublishToggle(draft);
                }
              }}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.infoLight }]}>
                <Ionicons
                  name={drafts.find(d => d.id === menuDraftId)?.status === 'published' ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.info}
                />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.text }]}>
                {drafts.find(d => d.id === menuDraftId)?.status === 'published' ? 'Unpublish' : 'Publish'}
              </ThemedText>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.menuItemDestructive}
              onPress={() => handleMenuAction('delete')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </View>
              <ThemedText style={[styles.menuText, { color: colors.error }]}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  // Header with playful gradient
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
    fontSize: Typography.fontSize['5xl'], // Dramatically larger
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

  // Selection bar with bold colors
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

  // Sort options with bolder styling
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

  // Search with colorful icon
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

  // Draft list
  listContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: 140,
    flexGrow: 1,
  },

  // Draft cards with bold colored borders
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
    fontSize: Typography.fontSize.xl, // Bigger title
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
    fontSize: Typography.fontSize.base, // Slightly larger
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

  // Empty state with playful decorations
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
    fontSize: Typography.fontSize['3xl'], // Larger
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

  // Menu modal
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
  syncErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    borderRadius: BorderRadius.xl,
  },
  syncErrorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});
