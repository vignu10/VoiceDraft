import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
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
import { Duration, Springs, Stagger } from '@/constants/animations';

type SortOption = 'date' | 'title';

export default function LibraryTab() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const colors = useThemeColors();

  const loadDrafts = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('drafts');
      if (data) {
        setDrafts(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [loadDrafts])
  );

  const handleDraftPress = (id: string) => {
    router.push({
      pathname: '/draft/[id]',
      params: { id },
    });
  };

  const handleDeleteDraft = async (id: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedDrafts = drafts.filter((d) => d.id !== id);
            setDrafts(updatedDrafts);
            await AsyncStorage.setItem('drafts', JSON.stringify(updatedDrafts));
          },
        },
      ]
    );
  };

  const toggleFavorite = async (id: string) => {
    const updatedDrafts = drafts.map((d) =>
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
    );
    setDrafts(updatedDrafts);
    await AsyncStorage.setItem('drafts', JSON.stringify(updatedDrafts));
  };

  const filteredDrafts = drafts
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
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (a.title || '').localeCompare(b.title || '');
    });

  const getStatusColor = (status: Draft['status']) => {
    switch (status) {
      case 'recording':
        return colors.warning;
      case 'transcribing':
      case 'generating':
        return colors.info;
      case 'ready':
        return colors.success;
      case 'published':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  const renderDraft = ({ item, index }: { item: Draft; index: number }) => (
    <AnimatedCard
      variant="elevated"
      pressable
      onPress={() => handleDraftPress(item.id)}
      delay={Stagger.delay(index)}
      style={styles.draftCard}
    >
      <View style={styles.draftHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
        <PressableScale onPress={() => toggleFavorite(item.id)} scale={0.9} hapticStyle="light">
          <Ionicons
            name={item.isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={item.isFavorite ? colors.accent : colors.iconMuted}
          />
        </PressableScale>
      </View>

      <ThemedText style={[styles.draftTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title || 'Untitled Draft'}
      </ThemedText>

      {item.content && (
        <ThemedText style={[styles.draftPreview, { color: colors.textSecondary }]} numberOfLines={3}>
          {item.content.replace(/[#*_\n]/g, ' ')}
        </ThemedText>
      )}

      <View style={[styles.draftFooter, { borderTopColor: colors.border }]}>
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

  const EmptyState = () => (
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
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <SlideIn direction="down" delay={0}>
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Library</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
            </ThemedText>
          </View>
        </SlideIn>

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
                style={[styles.searchInput, { color: colors.text, fontFamily: 'Nunito_400Regular' }]}
                placeholder="Search drafts..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <PressableScale onPress={() => setSearchQuery('')} scale={0.9} haptic={false}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </PressableScale>
              )}
            </View>
          </View>
        </SlideIn>

        {/* Sort Options */}
        <SlideIn direction="down" delay={Duration.fast}>
          <View style={styles.sortContainer}>
            <PressableScale
              onPress={() => setSortBy('date')}
              haptic={false}
              style={[
                styles.sortOption,
                {
                  backgroundColor: sortBy === 'date' ? colors.primary : colors.surface,
                  borderColor: sortBy === 'date' ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.sortText,
                  { color: sortBy === 'date' ? colors.textInverse : colors.text },
                ]}
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
                  backgroundColor: sortBy === 'title' ? colors.primary : colors.surface,
                  borderColor: sortBy === 'title' ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.sortText,
                  { color: sortBy === 'title' ? colors.textInverse : colors.text },
                ]}
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
        />
      </SafeAreaView>
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
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[4],
    minHeight: 70,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: Spacing[1],
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[4],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    lineHeight: 20,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    gap: Spacing[3],
  },
  sortOption: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  sortText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    flexGrow: 1,
  },
  draftCard: {
    marginBottom: Spacing[4],
    padding: 0,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: 16,
  },
  draftTitle: {
    fontSize: 18,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 24,
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[2],
  },
  draftPreview: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[3],
    opacity: 0.85,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
  },
  draftMetaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing[16],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: 28,
    marginBottom: Spacing[2],
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[8],
  },
});
