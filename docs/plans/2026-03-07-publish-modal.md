# Publish Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a publish modal to the VoiceDraft mobile app that allows users to publish blog posts directly from the draft editor with URL preview, warnings, and success feedback.

**Architecture:** React Native modal component with full-screen presentation, integrated with existing publish API endpoint, using custom toast component for success feedback.

**Tech Stack:** React Native, Expo Router, TypeScript, Ionicons, AsyncStorage, expo-haptics

---

## Task 1: Create Blog URL Generation Utility

**Files:**
- Create: `mobile-app/utils/url-utils.ts`

**Step 1: Create URL utility functions**

Create `mobile-app/utils/url-utils.ts`:

```typescript
import { Platform } from 'react-native';

/**
 * Production URL for the web app
 * TODO: Move to app config/environment variables
 */
const PRODUCTION_URL = 'https://your-site.com'; // Replace with actual production URL

/**
 * Generate the blog URL for a published post
 * @param journalUrlPrefix - The journal's URL prefix (e.g., "johns-tech-blog")
 * @param postSlug - The post's slug (e.g., "my-first-post")
 * @returns Full URL to the published post
 */
export function generateBlogUrl(journalUrlPrefix: string, postSlug: string): string {
  return `${PRODUCTION_URL}/${journalUrlPrefix}/${postSlug}`;
}

/**
 * Get the base URL for the app
 */
export function getBaseUrl(): string {
  return PRODUCTION_URL;
}

/**
 * Validate if a URL prefix is valid (alphanumeric and hyphens only)
 */
export function isValidUrlPrefix(prefix: string): boolean {
  return /^[a-z0-9-]+$/.test(prefix);
}

/**
 * Validate if a slug is valid
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}
```

**Step 2: Commit**

```bash
git add mobile-app/utils/url-utils.ts
git commit -m "feat: add blog URL generation utilities"
```

---

## Task 2: Create Publish Success Toast Component

**Files:**
- Create: `mobile-app/components/publish/PublishSuccessToast.tsx`

**Step 1: Create PublishSuccessToast component**

Create `mobile-app/components/publish/PublishSuccessToast.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, Text, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';

interface PublishSuccessToastProps {
  visible: boolean;
  postUrl: string;
  onViewPress: () => void;
  onSharePress: () => void;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

export function PublishSuccessToast({
  visible,
  postUrl,
  onViewPress,
  onSharePress,
  onDismiss,
}: PublishSuccessToastProps) {
  const [copiedText, setCopiedText] = useState<'Copied!' | ''>('');

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  // Show animation
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss timer
      const timer = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    'worklet';
    translateY.value = withSpring(-100, { damping: 15 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const handleCopyUrl = async () => {
    await Clipboard.setStringAsync(postUrl);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedText('Copied!');
    setTimeout(() => setCopiedText(''), 2000);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={handleCopyUrl}
        style={styles.toastContent}
      >
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Published!</Text>
          <Text style={styles.url} numberOfLines={2}>
            {postUrl.replace('https://', '').replace('http://', '')}
          </Text>
          <Text style={styles.hint}>{copiedText || 'Tap to copy URL'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={onViewPress}
            style={styles.actionButton}
          >
            <Ionicons name="open-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View</Text>
          </Pressable>

          <Pressable
            onPress={onSharePress}
            style={styles.actionButton}
          >
            <Ionicons name="share-social-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Share</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: Spacing[4],
  },
  toastContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    marginRight: Spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#10B981',
    marginBottom: Spacing[1],
  },
  url: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#1F2937',
    marginBottom: Spacing[1],
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#3B82F6',
  },
});
```

**Step 2: Commit**

```bash
git add mobile-app/components/publish/PublishSuccessToast.tsx
git commit -m "feat: add PublishSuccessToast component with URL copy, view, and share"
```

---

## Task 3: Create Publish Modal Component

**Files:**
- Create: `mobile-app/components/publish/PublishModal.tsx`
- Reference: `mobile-app/components/library/DraftMenu.tsx` (for modal pattern)

**Step 1: Create PublishModal component**

Create `mobile-app/components/publish/PublishModal.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { FadeIn } from '@/components/ui/animated';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';
import { generateBlogUrl } from '@/utils/url-utils';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { countWords } from '@/utils/formatters';
import * as Haptics from 'expo-haptics';

interface PublishModalProps {
  visible: boolean;
  draft: Draft | null;
  journalUrlPrefix?: string;
  onClose: () => void;
  onPublish: () => Promise<void>;
}

export function PublishModal({
  visible,
  draft,
  journalUrlPrefix = 'your-journal',
  onClose,
  onPublish
}: PublishModalProps) {
  const colors = useThemeColors();
  const [isPublishing, setIsPublishing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Validate draft and generate warnings
  useEffect(() => {
    if (!draft) return;

    const newWarnings: string[] = [];

    if (!draft.title || draft.title.trim() === '') {
      newWarnings.push('No title set');
    }

    const wordCount = countWords(draft.content || '');
    if (wordCount < 100) {
      newWarnings.push('Post is very short');
    }

    if (wordCount === 0) {
      newWarnings.push('Post is empty');
    }

    setWarnings(newWarnings);
  }, [draft]);

  const handlePublish = async () => {
    if (!draft) return;

    // Don't allow publishing if post is empty
    if (warnings.includes('Post is empty')) return;

    setIsPublishing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onPublish();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Failed to publish:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!draft) return null;

  const blogUrl = generateBlogUrl(journalUrlPrefix, draft.slug || draft.id);
  const canPublish = !warnings.includes('Post is empty');
  const wordCount = countWords(draft.content || '');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <FadeIn>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="rocket-outline" size={28} color={colors.primary} />
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Publish to Blog
              </ThemedText>
            </View>

            {/* URL Preview */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Your post will be published at:
              </ThemedText>
              <View style={[styles.urlPreview, { backgroundColor: colors.gray }]}>
                <Ionicons name="link-outline" size={16} color={colors.primary} />
                <ThemedText
                  style={[styles.urlText, { color: colors.primary }]}
                  numberOfLines={2}
                >
                  {blogUrl}
                </ThemedText>
              </View>
            </View>

            {/* Post Summary */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Post Summary:
              </ThemedText>
              <View style={[styles.summaryCard, { backgroundColor: colors.gray }]}>
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Title:</ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {draft.title || 'Untitled'}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Length:</ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                    {wordCount} words
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Warnings */}
            {warnings.length > 0 && (
              <View style={styles.section}>
                {warnings.map((warning) => (
                  <View
                    key={warning}
                    style={[styles.warning, { backgroundColor: colors.warningLight || '#FEF3C7' }]}
                  >
                    <Ionicons name="warning-outline" size={18} color={colors.warning || '#D97706'} />
                    <ThemedText style={[styles.warningText, { color: colors.warning || '#92400E' }]}>
                      {warning === 'Post is empty' ? 'Error' : 'Warning'}: {warning}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel, { borderColor: colors.border }]}
                onPress={onClose}
                disabled={isPublishing}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPublish,
                  { backgroundColor: canPublish ? colors.primary : colors.gray },
                ]}
                onPress={handlePublish}
                disabled={isPublishing || !canPublish}
              >
                {isPublishing ? (
                  <ThemedText style={[styles.buttonText, { color: colors.textInverse }]}>
                    Publishing...
                  </ThemedText>
                ) : (
                  <>
                    <ThemedText style={[styles.buttonText, { color: colors.textInverse }]}>
                      Publish
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing[5],
    paddingBottom: Spacing[5],
    paddingHorizontal: Spacing[5],
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[5],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  section: {
    marginBottom: Spacing[4],
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[2],
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
  },
  urlText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  summaryCard: {
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    gap: Spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[2],
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
  },
  buttonCancel: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonPublish: {
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
```

**Step 2: Commit**

```bash
git add mobile-app/components/publish/PublishModal.tsx
git commit -m "feat: add PublishModal component with URL preview and validation warnings"
```

---

## Task 4: Add Publish Button to Draft Editor Header

**Files:**
- Modify: `mobile-app/app/(tabs)/draft/[id].tsx:498-540`
- Reference: `mobile-app/app/(tabs)/draft/[id].tsx` (existing header structure)

**Step 1: Add publish modal state and handlers**

Find the state declarations in the file (around line 55-70) and add:

```typescript
// Add to existing state declarations
const [showPublishModal, setShowPublishModal] = useState(false);
const [showPublishSuccessToast, setShowPublishSuccessToast] = useState(false);
const [publishedPostUrl, setPublishedPostUrl] = useState('');
const [journalUrlPrefix, setJournalUrlPrefix] = useState('your-journal'); // TODO: Fetch from API
```

**Step 2: Add share functionality handler**

Find the `handleExport` function (around line 350-370) and add these handlers after it:

```typescript
// Add handlePublish function
const handlePublish = async () => {
  if (!draft?.serverId) {
    showToast({
      type: 'error',
      message: 'Please sync your draft first before publishing.',
    });
    return;
  }

  try {
    // Import at top of file: import { publishPost } from '@/services/api/posts';
    await publishPost(draft.serverId);

    // Update draft status locally
    setDraft((prev) => prev ? { ...prev, status: 'published' as const } : null);

    // Generate blog URL
    const url = generateBlogUrl(journalUrlPrefix, draft.slug || draft.id);
    setPublishedPostUrl(url);
    setShowPublishModal(false);
    setShowPublishSuccessToast(true);

    // Mini celebration
    setCelebration({ visible: true, message: 'Published successfully!' });
    setTimeout(() => setCelebration({ visible: false }), 3000);
  } catch (error) {
    console.error('Failed to publish:', error);
    showToast({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to publish. Please try again.',
    });
  }
};

// Add handleViewPublishedPost function
const handleViewPublishedPost = () => {
  if (publishedPostUrl) {
    // Import at top: import * as WebBrowser from 'expo-web-browser';
    WebBrowser.openBrowserAsync(publishedPostUrl);
  }
};

// Add handleSharePublishedPost function
const handleSharePublishedPost = async () => {
  if (publishedPostUrl) {
    try {
      await Share.share({
        message: `Check out my new blog post: ${publishedPostUrl}`,
        url: publishedPostUrl,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }
};
```

**Step 3: Add import statements**

At the top of the file, add these imports:

```typescript
import { PublishModal } from '@/components/publish/PublishModal';
import { PublishSuccessToast } from '@/components/publish/PublishSuccessToast';
import { publishPost } from '@/services/api/posts';
import { generateBlogUrl } from '@/utils/url-utils';
import * as WebBrowser from 'expo-web-browser';
```

**Step 4: Modify header to add publish button**

Find the headerRight View (around line 498) and modify to add the publish button:

```typescript
{/* Right: Actions */}
<View style={styles.headerRight}>
  {/* Tab toggle - hide for guest flow */}
  {!isGuestFlow && (
    <PressableScale
      onPress={() =>
        setActiveTab(activeTab === "edit" ? "preview" : "edit")
      }
      style={[
        styles.iconBtn,
        styles.iconBtnOutline,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
      accessibilityLabel={`Switch to ${activeTab === "edit" ? "preview" : "edit"} mode`}
      hapticStyle="light"
    >
      <Ionicons
        name={
          activeTab === "edit" ? "eye-outline" : "create-outline"
        }
        size={22}
        color={colors.primary}
      />
    </PressableScale>
  )}

  {/* Publish button - NEW */}
  {!isGuestFlow && draft?.serverId && (
    <PressableScale
      onPress={() => setShowPublishModal(true)}
      style={[styles.iconBtn, { backgroundColor: colors.success }]}
      accessibilityLabel="Publish to blog"
      hapticStyle="light"
    >
      <Ionicons
        name="rocket-outline"
        size={20}
        color={colors.textInverse}
      />
    </PressableScale>
  )}

  {/* Export - hide for guest flow */}
  {!isGuestFlow && (
    <PressableScale
      onPress={handleExport}
      style={[styles.iconBtn, { backgroundColor: colors.primary }]}
      accessibilityLabel="Export draft"
    >
      <Ionicons
        name="share-outline"
        size={20}
        color={colors.textInverse}
      />
    </PressableScale>
  )}
</View>
```

**Step 5: Add PublishModal and PublishSuccessToast to JSX**

Find the return statement and add the modals before the closing SafeAreaView (before the final `</View>`):

```typescript
{/* Add before the closing View tag */}
<PublishModal
  visible={showPublishModal}
  draft={draft}
  journalUrlPrefix={journalUrlPrefix}
  onClose={() => setShowPublishModal(false)}
  onPublish={handlePublish}
/>

<PublishSuccessToast
  visible={showPublishSuccessToast}
  postUrl={publishedPostUrl}
  onViewPress={handleViewPublishedPost}
  onSharePress={handleSharePublishedPost}
  onDismiss={() => setShowPublishSuccessToast(false)}
/>
```

**Step 6: Add success color to theme if not exists**

Check if `colors.success` exists. If not, add it to your theme or use a fallback color in the component.

**Step 7: Commit**

```bash
git add mobile-app/app/\(tabs\)/draft/\[id\].tsx
git commit -m "feat: add publish button to draft editor header with modal and success toast"
```

---

## Task 5: Fetch Journal URL Prefix from API

**Files:**
- Modify: `mobile-app/app/(tabs)/draft/[id].tsx`
- Reference: `mobile-app/services/api/journal.ts` (existing journal API)

**Step 1: Create helper to fetch journal URL prefix**

Add this helper function after the `loadDraft` function:

```typescript
// Add import at top: import { getJournal } from '@/services/api/journal';

const loadJournalUrlPrefix = useCallback(async () => {
  if (!authStore.isAuthenticated) return;

  try {
    const journal = await getJournal();
    if (journal?.url_prefix) {
      setJournalUrlPrefix(journal.url_prefix);
    }
  } catch (error) {
    console.error('Failed to load journal URL prefix:', error);
    // Keep default value
  }
}, []);
```

**Step 2: Call loadJournalUrlPrefix when draft loads**

Add this to the `useEffect` that loads the draft (around line 140-150):

```typescript
useEffect(() => {
  loadDraft();
  loadJournalUrlPrefix(); // Add this line

  return () => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  };
}, [id, loadJournalUrlPrefix]); // Add loadJournalUrlPrefix to dependency array
```

**Step 3: Commit**

```bash
git add mobile-app/app/\(tabs\)/draft/\[id\].tsx
git commit -m "feat: fetch journal URL prefix for publish modal"
```

---

## Task 6: Create Exports Barrel File

**Files:**
- Create: `mobile-app/components/publish/index.ts`

**Step 1: Create barrel file for exports**

Create `mobile-app/components/publish/index.ts`:

```typescript
export { PublishModal } from './PublishModal';
export { PublishSuccessToast } from './PublishSuccessToast';
```

**Step 2: Commit**

```bash
git add mobile-app/components/publish/index.ts
git commit -m "chore: add barrel file for publish components"
```

---

## Task 7: Update Production URL Configuration

**Files:**
- Modify: `mobile-app/utils/url-utils.ts`
- Reference: `mobile-app/app.json` or environment config

**Step 1: Add environment variable support**

Modify `mobile-app/utils/url-utils.ts` to use environment variable:

```typescript
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Production URL for the web app
 * Falls back to localhost for development
 */
export const PRODUCTION_URL = Constants.expoConfig?.extra?.productionUrl ||
  process.env.EXPO_PUBLIC_PRODUCTION_URL ||
  'https://your-site.com'; // Replace with actual production URL

/**
 * Generate the blog URL for a published post
 * @param journalUrlPrefix - The journal's URL prefix (e.g., "johns-tech-blog")
 * @param postSlug - The post's slug (e.g., "my-first-post")
 * @returns Full URL to the published post
 */
export function generateBlogUrl(journalUrlPrefix: string, postSlug: string): string {
  return `${PRODUCTION_URL}/${journalUrlPrefix}/${postSlug}`;
}
```

**Step 2: Add to app.json or .env**

Add to `mobile-app/app.json` in the `expo.extra` section or create a `.env` file:

```json
{
  "expo": {
    "extra": {
      "productionUrl": "https://your-site.com"
    }
  }
}
```

Or create `mobile-app/.env`:

```
EXPO_PUBLIC_PRODUCTION_URL=https://your-site.com
```

**Step 3: Commit**

```bash
git add mobile-app/utils/url-utils.ts mobile-app/app.json
git commit -m "feat: add environment-based production URL configuration"
```

---

## Task 8: Update useDraftActions Hook for Publish from Library

**Files:**
- Modify: `mobile-app/hooks/use-draft-actions.ts:117-140`
- Reference: Existing `handlePublishToggle` function

**Step 1: Enhance handlePublishToggle with success toast**

Modify the `handlePublishToggle` function to show success feedback:

```typescript
/**
 * Toggle publish status for a draft
 * ENHANCED: Now shows toast feedback with URL
 */
const handlePublishToggle = useCallback(
  async (draft: Draft) => {
    try {
      if (draft.status === 'published') {
        await unpublishPost(draft.serverId!);
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: ('ready' as const) } : d))
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await publishPost(draft.serverId!);
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: ('published' as const) } : d))
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // TODO: Show success toast with blog URL
        // Requires access to journal URL prefix - could be added as a prop
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  },
  [setDrafts]
);
```

**Step 2: Commit**

```bash
git add mobile-app/hooks/use-draft-actions.ts
git commit -m "chore: enhance publish toggle with haptic feedback"
```

---

## Verification Plan

### Manual Testing

1. **Test Publish Modal from Draft Editor**
   - Open any draft in the editor
   - Tap the new rocket/publish button in the header
   - Verify modal opens with blog URL preview
   - Check warnings appear for incomplete posts
   - Verify publish button is disabled for empty posts
   - Tap Publish and verify success toast appears

2. **Test Success Toast Interactions**
   - Verify toast shows full blog URL
   - Tap toast to copy URL
   - Tap View button to open in browser
   - Tap Share button to open share sheet
   - Verify auto-dismiss after 5 seconds

3. **Test Error Cases**
   - Try publishing without serverId (should show error)
   - Try publishing with network disabled (should show error toast)
   - Try publishing already published post

4. **Test Integration**
   - Publish a post and verify it appears on web blog listing page
   - Verify the URL in toast matches the actual post URL
   - Unpublish and verify post is removed from web

### API Testing

```bash
# Test publish endpoint
curl -X POST http://localhost:3000/api/posts/:id/publish

# Verify post status changed
curl http://localhost:3000/api/posts/:id
```

---

## Edge Cases & Considerations

1. **No journal URL prefix**: Use default 'your-journal' and show warning
2. **Invalid slug characters**: Auto-sanitize in URL generation
3. **Long URLs**: Truncate display in toast but keep full URL for copy/share
4. **Publish already published**: Show "Already published" message
5. **Network timeout**: Show error toast with retry option
6. **Guest drafts**: Hide publish button (not authenticated)
7. **Draft not synced**: Disable publish button, show "Sync first" message

---

## Dependencies

- React Native
- Expo Router
- expo-haptics
- expo-clipboard
- expo-web-browser
- react-native-reanimated
- Ionicons
- Existing API: `/api/posts/:id/publish`

---

## Implementation Notes

1. The publish button only appears when `draft.serverId` exists (draft synced with server)
2. Journal URL prefix is fetched from the `/api/journal` endpoint
3. Production URL should be configured via environment variables
4. Success toast uses reanimated for smooth animations
5. All haptic feedback follows platform guidelines

---

**Total Estimated Time:** 3-4 hours

**Next Steps After Implementation:**
1. Add ability to edit slug before publishing
2. Add schedule publish feature
3. Add unpublish confirmation modal
4. Add analytics tracking for publish events
