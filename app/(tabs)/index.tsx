import { StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatRelativeTime, truncate } from '@/utils/formatters';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';

export default function RecordTab() {
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const colors = useThemeColors();

  const loadRecentDrafts = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('drafts');
      if (data) {
        const drafts: Draft[] = JSON.parse(data);
        setRecentDrafts(drafts.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentDrafts();
    }, [loadRecentDrafts])
  );

  const handleStartRecording = () => {
    router.push('/recording');
  };

  const handleDraftPress = (id: string) => {
    router.push({
      pathname: '/draft/[id]',
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.appName, { color: colors.text }]}>
            VoiceDraft
          </ThemedText>
          <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
            Voice to Blog in One Tap
          </ThemedText>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.prompt, { color: colors.text }]}>
            Record your next blog post
          </ThemedText>

          {/* Record Button */}
          <Pressable
            style={({ pressed }) => [
              styles.recordButton,
              {
                backgroundColor: colors.tint,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
            onPress={handleStartRecording}
          >
            <View style={styles.recordButtonInner}>
              <Ionicons name="mic" size={48} color="#fff" />
            </View>
          </Pressable>

          <ThemedText style={[styles.hint, { color: colors.textMuted }]}>
            Tap to start recording
          </ThemedText>
        </View>

        {/* Recent Drafts */}
        {recentDrafts.length > 0 && (
          <View style={[styles.recentSection, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.recentTitle, { color: colors.textSecondary }]}>
              RECENT DRAFTS
            </ThemedText>
            {recentDrafts.map((draft) => (
              <Pressable
                key={draft.id}
                style={({ pressed }) => [
                  styles.draftItem,
                  {
                    backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleDraftPress(draft.id)}
              >
                <View style={styles.draftInfo}>
                  <ThemedText style={[styles.draftTitle, { color: colors.text }]}>
                    {truncate(draft.title || 'Untitled Draft', 30)}
                  </ThemedText>
                  <ThemedText style={[styles.draftTime, { color: colors.textMuted }]}>
                    {formatRelativeTime(new Date(draft.createdAt))}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
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
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  prompt: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 48,
    textAlign: 'center',
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  recordButtonInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 15,
    marginTop: 24,
  },
  recentSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  draftTime: {
    fontSize: 13,
    marginTop: 2,
  },
});
