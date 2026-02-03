import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
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
import { formatRelativeTime, truncate } from '@/utils/formatters';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';

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
        return colors.tint;
      default:
        return colors.textMuted;
    }
  };

  const renderDraft = ({ item }: { item: Draft }) => (
    <Pressable
      style={({ pressed }) => [
        styles.draftCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={() => handleDraftPress(item.id)}
      onLongPress={() => handleDeleteDraft(item.id)}
    >
      <View style={styles.draftHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
        <Pressable onPress={() => toggleFavorite(item.id)} hitSlop={10}>
          <Ionicons
            name={item.isFavorite ? 'star' : 'star-outline'}
            size={22}
            color={colors.warning}
          />
        </Pressable>
      </View>

      <ThemedText style={[styles.draftTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title || 'Untitled Draft'}
      </ThemedText>

      {item.content && (
        <ThemedText style={[styles.draftPreview, { color: colors.textSecondary }]} numberOfLines={2}>
          {truncate(item.content.replace(/[#*_\n]/g, ' '), 100)}
        </ThemedText>
      )}

      <View style={styles.draftFooter}>
        <ThemedText style={[styles.draftMeta, { color: colors.textMuted }]}>
          {formatRelativeTime(new Date(item.createdAt))}
        </ThemedText>
        {item.wordCount && (
          <ThemedText style={[styles.draftMeta, { color: colors.textMuted }]}>
            {item.wordCount} words
          </ThemedText>
        )}
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        No drafts yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
        Start recording to create your first blog post
      </ThemedText>
      <Pressable
        style={({ pressed }) => [
          styles.emptyButton,
          {
            backgroundColor: colors.tint,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => router.push('/recording')}
      >
        <Ionicons name="mic" size={20} color="#fff" />
        <ThemedText style={styles.emptyButtonText}>Start Recording</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Library</ThemedText>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search drafts..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.placeholder} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Pressable
            style={[
              styles.sortOption,
              {
                backgroundColor: sortBy === 'date' ? colors.tint : 'transparent',
                borderColor: sortBy === 'date' ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setSortBy('date')}
          >
            <ThemedText
              style={[
                styles.sortText,
                { color: sortBy === 'date' ? '#fff' : colors.text },
              ]}
            >
              Recent
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.sortOption,
              {
                backgroundColor: sortBy === 'title' ? colors.tint : 'transparent',
                borderColor: sortBy === 'title' ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setSortBy('title')}
          >
            <ThemedText
              style={[
                styles.sortText,
                { color: sortBy === 'title' ? '#fff' : colors.text },
              ]}
            >
              Title
            </ThemedText>
          </Pressable>
        </View>

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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 10,
  },
  sortOption: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  draftCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  draftTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  draftPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  draftMeta: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
