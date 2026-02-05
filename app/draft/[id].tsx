import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { countWords } from '@/utils/formatters';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { FadeIn } from '@/components/ui/animated/animated-wrappers';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

type Tab = 'edit' | 'preview';

export default function DraftEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('edit');
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const colors = useThemeColors();

  const loadDraft = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('drafts');
      if (data) {
        const drafts: Draft[] = JSON.parse(data);
        const found = drafts.find((d) => d.id === id);
        if (found) {
          setDraft(found);
          setTitle(found.title || '');
          setMetaDescription(found.metaDescription || '');
          setContent(found.content || '');
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }, [id]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const saveDraft = useCallback(async () => {
    if (!draft) return;

    setIsSaving(true);
    try {
      const data = await AsyncStorage.getItem('drafts');
      if (data) {
        const drafts: Draft[] = JSON.parse(data);
        const updatedDrafts = drafts.map((d) =>
          d.id === id
            ? {
                ...d,
                title,
                metaDescription,
                content,
                wordCount: countWords(content),
                updatedAt: new Date(),
              }
            : d
        );
        await AsyncStorage.setItem('drafts', JSON.stringify(updatedDrafts));
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [draft, id, title, metaDescription, content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft) {
        saveDraft();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, metaDescription, content, saveDraft, draft]);

  const handleExport = () => {
    Alert.alert('Export', 'Choose export format', [
      {
        text: 'Copy Markdown',
        onPress: async () => {
          const markdown = `# ${title}\n\n${content}`;
          await Clipboard.setStringAsync(markdown);
          Alert.alert('Copied!', 'Markdown copied to clipboard');
        },
      },
      {
        text: 'Copy HTML',
        onPress: async () => {
          const html = `<h1>${title}</h1>\n${content
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')}`;
          await Clipboard.setStringAsync(html);
          Alert.alert('Copied!', 'HTML copied to clipboard');
        },
      },
      {
        text: 'Share',
        onPress: async () => {
          await Share.share({
            title,
            message: `# ${title}\n\n${content}`,
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getTitleCharColor = () => {
    if (title.length > 60) return colors.error;
    if (title.length > 50) return colors.warning;
    return colors.textTertiary;
  };

  const getMetaCharColor = () => {
    if (metaDescription.length > 160) return colors.error;
    if (metaDescription.length > 150) return colors.warning;
    return colors.textTertiary;
  };

  if (!draft) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={{ color: colors.textSecondary }}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <FadeIn>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary }]}>
                <PressableScale
                  onPress={() => setActiveTab('edit')}
                  style={[
                    styles.tab,
                    activeTab === 'edit' && { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={activeTab === 'edit' ? colors.textInverse : colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.tabText,
                      { color: activeTab === 'edit' ? colors.textInverse : colors.text },
                    ]}
                  >
                    Edit
                  </ThemedText>
                </PressableScale>
                <PressableScale
                  onPress={() => setActiveTab('preview')}
                  style={[
                    styles.tab,
                    activeTab === 'preview' && { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={activeTab === 'preview' ? colors.textInverse : colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.tabText,
                      { color: activeTab === 'preview' ? colors.textInverse : colors.text },
                    ]}
                  >
                    Preview
                  </ThemedText>
                </PressableScale>
              </View>
              <PressableScale
                onPress={handleExport}
                hapticStyle="medium"
                style={[
                  styles.exportButton,
                  { backgroundColor: colors.primary, ...Shadows.sm },
                ]}
              >
                <Ionicons name="share-outline" size={18} color={colors.textInverse} />
                <ThemedText style={[styles.exportText, { color: colors.textInverse }]}>Export</ThemedText>
              </PressableScale>
            </View>
          </FadeIn>

          {activeTab === 'edit' ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>
                    Title
                  </ThemedText>
                  <ThemedText style={[styles.charCount, { color: getTitleCharColor() }]}>
                    {title.length}/60
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter a compelling title..."
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Meta Description */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>
                    Meta Description
                  </ThemedText>
                  <ThemedText style={[styles.charCount, { color: getMetaCharColor() }]}>
                    {metaDescription.length}/160
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.metaInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  value={metaDescription}
                  onChangeText={setMetaDescription}
                  placeholder="Write a compelling description for search results..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Content */}
              <View style={styles.field}>
                <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>
                  Content
                </ThemedText>
                <ThemedText style={[styles.fieldHint, { color: colors.textTertiary }]}>
                  Supports Markdown formatting
                </ThemedText>
                <TextInput
                  style={[
                    styles.contentInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your blog post content..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.previewPadding}>
              <ThemedText style={[styles.previewTitle, { color: colors.text }]}>
                {title || 'Untitled'}
              </ThemedText>
              {metaDescription && (
                <ThemedText style={[styles.previewMeta, { color: colors.textSecondary }]}>
                  {metaDescription}
                </ThemedText>
              )}
              <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
              <ThemedText style={[styles.previewBody, { color: colors.text }]}>
                {content || 'No content yet...'}
              </ThemedText>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.footerLeft}>
              <Ionicons name="document-text" size={16} color={colors.textTertiary} />
              <ThemedText style={[styles.wordCount, { color: colors.textSecondary }]}>
                {countWords(content)} words
              </ThemedText>
            </View>
            <View style={styles.footerRight}>
              {isSaving ? (
                <View style={styles.savingIndicator}>
                  <Ionicons name="sync" size={14} color={colors.textTertiary} />
                  <ThemedText style={[styles.saveStatus, { color: colors.textTertiary }]}>
                    Saving...
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.savingIndicator}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <ThemedText style={[styles.saveStatus, { color: colors.success }]}>
                    Saved
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    ...Shadows.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing[1.5],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.lg,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4] + 4,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.xl,
  },
  exportText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[6],
  },
  field: {
    marginBottom: Spacing[6],
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  fieldLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  fieldHint: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
  },
  charCount: {
    fontSize: Typography.fontSize.sm,
  },
  titleInput: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  metaInput: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    minHeight: 90,
    ...Shadows.sm,
  },
  contentInput: {
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    minHeight: 300,
    ...Shadows.sm,
  },
  previewPadding: {
    padding: Spacing[6],
  },
  previewTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[3],
    lineHeight: 36,
  },
  previewMeta: {
    fontSize: Typography.fontSize.md,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: Spacing[4],
  },
  previewDivider: {
    height: 1,
    marginVertical: Spacing[5],
  },
  previewBody: {
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    ...Shadows.lg,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCount: {
    fontSize: Typography.fontSize.sm,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  saveStatus: {
    fontSize: Typography.fontSize.sm,
  },
});
