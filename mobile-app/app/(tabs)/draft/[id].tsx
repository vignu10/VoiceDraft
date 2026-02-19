import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FadeIn } from "@/components/ui/animated/animated-wrappers";
import { PressableScale } from "@/components/ui/animated/pressable-scale";
import { ContentGate } from "@/components/ui/content-gate";
import { MiniCelebration, useDelightToast } from "@/components/ui/delight";
import { GuestDraftGate } from "@/components/ui/guest-draft-gate";
import { BorderRadius, Spacing, Typography } from "@/constants/design-system";
import { useGuestTrial } from "@/hooks/use-guest-trial";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useAchievementsStore, useGuestDraftStore } from "@/stores";
import type { Draft } from "@/types/draft";
import { getWordCountMilestone } from "@/utils/delight-messages";
import { countWords } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "edit" | "preview";

export default function DraftEditorScreen() {
  const { id, isGuestFlow: isGuestFlowParam } = useLocalSearchParams<{
    id: string;
    isGuestFlow?: string;
  }>();
  const isGuestFlow = isGuestFlowParam === "true";
  const colors = useThemeColors();
  const { isAuthenticated, trialCompletedSuccessfully } = useGuestTrial();

  // Guest draft store
  const guestDraft = useGuestDraftStore((state) => state.draft);
  const clearGuestDraft = useGuestDraftStore((state) => state.clearGuestDraft);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("edit");
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });
  const [previousWordCount, setPreviousWordCount] = useState(0);

  // Content gating state
  const [showContentGate, setShowContentGate] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const layoutHeight = useSharedValue(0);

  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll threshold for showing gate (30%)
  const SCROLL_THRESHOLD = 0.3;

  // Handle scroll position for content gating
  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      contentHeight.value = event.contentSize.height;
      layoutHeight.value = event.layoutMeasurement.height;

      // Calculate scroll percentage
      const maxScroll = event.contentSize.height - event.layoutMeasurement.height;
      if (maxScroll > 0) {
        const percentage = event.contentOffset.y / maxScroll;
        
        // Only trigger gate for guest users who have used their trial
        runOnJS(setScrollPercentage)(Math.round(percentage * 100));
        
        // Show gate when scroll exceeds threshold
        if (percentage > SCROLL_THRESHOLD) {
          runOnJS(triggerContentGate)();
        }
      }
    },
  });

  // Trigger content gate for guest users (not for guest flow - GuestDraftGate handles that)
  const triggerContentGate = useCallback(() => {
    // Only show gate if:
    // 1. User is NOT authenticated
    // 2. User has completed a draft (trial completed successfully)
    // 3. Gate is not already showing
    // 4. This is NOT a guest flow (guest flow uses GuestDraftGate instead)
    if (!isAuthenticated && trialCompletedSuccessfully && !showContentGate && !isGuestFlow) {
      setShowContentGate(true);
    }
  }, [isAuthenticated, trialCompletedSuccessfully, showContentGate, isGuestFlow]);

  // Navigation handlers for content gate
  const handleSignIn = useCallback(() => {
    setShowContentGate(false);
    router.push("/auth/sign-in");
  }, []);

  const handleSignUp = useCallback(() => {
    setShowContentGate(false);
    router.push("/auth/sign-up");
  }, []);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current)
        clearTimeout(celebrationTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const recordWordsWritten = useAchievementsStore(
    (state) => state.recordWordsWritten,
  );
  const { showToast } = useDelightToast();

  const loadDraft = useCallback(async () => {
    // DEBUG: Log guest draft loading
    console.log('[DEBUG] loadDraft called with:', { id, isGuestFlow, isGuestFlowParam, guestDraftFromStore: !!guestDraft });
    
    // Guest flow: load from in-memory store instead of AsyncStorage
    // Also detect guest draft automatically if id is "guest" or if guest draft exists
    let guestDraftToLoad = guestDraft;

    // If we're trying to load a guest draft but the store doesn't have it yet,
    // try to load it directly from AsyncStorage (handles case where Zustand hasn't hydrated yet)
    if (id === "guest" && !guestDraftToLoad) {
      console.log('[DEBUG] id is "guest" but no store draft, trying AsyncStorage fallback');
      try {
        const stored = await AsyncStorage.getItem('guest-draft-storage');
        console.log('[DEBUG] AsyncStorage raw data:', stored ? 'exists' : 'null');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[DEBUG] Parsed storage:', JSON.stringify(parsed, null, 2));
          if (parsed.state?.draft) {
            guestDraftToLoad = parsed.state.draft;
            console.log('[DEBUG] Found draft in AsyncStorage:', !!guestDraftToLoad);
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error loading guest draft from AsyncStorage:', error);
      }
    }

    const isGuestDraft = (isGuestFlow && id === "guest") || (id === "guest" && guestDraftToLoad);
    console.log('[DEBUG] isGuestDraft:', isGuestDraft, { isGuestFlow, id, hasGuestDraftToLoad: !!guestDraftToLoad });

    if (isGuestDraft && guestDraftToLoad) {
      const wordCount = countWords(guestDraftToLoad.content);
      // Map GuestDraft → Draft shape expected by the editor
      const mapped: Draft = {
        id: guestDraftToLoad.id,
        title: guestDraftToLoad.title,
        content: guestDraftToLoad.content,
        metaDescription: "",
        wordCount,
        createdAt: guestDraftToLoad.createdAt,
        updatedAt: guestDraftToLoad.createdAt,
        transcript: guestDraftToLoad.transcription,
        targetKeyword: guestDraftToLoad.keywords?.[0],
        status: "ready",
        tone: "casual",
        length: "medium",
        isFavorite: false,
      };
      setDraft(mapped);
      setTitle(guestDraftToLoad.title || "");
      setMetaDescription("");
      setContent(guestDraftToLoad.content || "");
      setPreviousWordCount(wordCount);

      // Auto-set guest flow mode when guest draft is loaded
      if (!isGuestFlow) {
        // Update params to enable guest flow features (blur gate)
        router.setParams({ isGuestFlow: 'true' });
      }
      return;
    }

    try {
      const data = await AsyncStorage.getItem("drafts");
      if (data) {
        const drafts: Draft[] = JSON.parse(data);
        const found = drafts.find((d) => d.id === id);
        if (found) {
          setDraft(found);
          setTitle(found.title || "");
          setMetaDescription(found.metaDescription || "");
          setContent(found.content || "");
          setPreviousWordCount(found.wordCount || 0);
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  }, [id, isGuestFlow, guestDraft]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Guest flow: always show preview mode (read-only)
  useEffect(() => {
    if (isGuestFlow) {
      setActiveTab("preview");
    }
  }, [isGuestFlow]);

  const saveDraft = useCallback(async () => {
    if (!draft) return;
    const currentWordCount = countWords(content);

    setIsSaving(true);
    setSaveError(null);
    try {
      const data = await AsyncStorage.getItem("drafts");
      if (data) {
        const drafts: Draft[] = JSON.parse(data);
        const updatedDrafts = drafts.map((d) =>
          d.id === id
            ? {
                ...d,
                title: title.trim(),
                metaDescription: metaDescription.trim(),
                content,
                wordCount: currentWordCount,
                updatedAt: new Date().toISOString(),
              }
            : d,
        );
        await AsyncStorage.setItem("drafts", JSON.stringify(updatedDrafts));

        const milestone = getWordCountMilestone(currentWordCount);
        if (milestone) {
          setCelebration({ visible: true, message: milestone });
          if (celebrationTimerRef.current)
            clearTimeout(celebrationTimerRef.current);
          celebrationTimerRef.current = setTimeout(
            () => setCelebration({ visible: false }),
            1500,
          );
        }

        const wordDelta = Math.max(0, currentWordCount - previousWordCount);
        if (wordDelta > 0) recordWordsWritten(wordDelta);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setSaveError("Failed to save");
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
      setPreviousWordCount(currentWordCount);
    }
  }, [
    draft,
    id,
    title,
    metaDescription,
    content,
    previousWordCount,
    recordWordsWritten,
  ]);

  useEffect(() => {
    // Guest drafts are read-only — skip auto-save
    if (isGuestFlow) return;
    const timer = setTimeout(() => {
      if (draft) saveDraft();
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, metaDescription, content, saveDraft, draft, isGuestFlow]);

  // Guest flow: sign-up handler
  const handleGuestSignUp = useCallback(() => {
    clearGuestDraft();
    router.push("/auth/sign-up");
  }, [clearGuestDraft]);

  const handleExport = () => {
    Alert.alert("Export", "Choose format", [
      {
        text: "Markdown",
        onPress: async () => {
          await Clipboard.setStringAsync(`# ${title}\n\n${content}`);
          showToast("Copied!", "success");
        },
      },
      {
        text: "HTML",
        onPress: async () => {
          await Clipboard.setStringAsync(
            `<h1>${title}</h1>\n${content
              .replace(/^## (.+)$/gm, "<h2>$1</h2>")
              .replace(/^### (.+)$/gm, "<h3>$1</h3>")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>")}`,
          );
          showToast("Copied!", "success");
        },
      },
      {
        text: "Share",
        onPress: async () => {
          await Share.share({
            title: title || "My Post",
            message: `# ${title}\n\n${content}`,
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const wordCount = countWords(content);
  const isOverLimit = (val: number, max: number) => val > max;

  if (!draft)
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={{ color: colors.textSecondary }}>
          Loading...
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={styles.container}>
      <MiniCelebration
        visible={celebration.visible}
        message={celebration.message}
        icon="trophy"
        onComplete={() => setCelebration({ visible: false })}
      />

      {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View style={styles.safeArea}>
          <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header - Streamlined */}
          <FadeIn>
            <View style={styles.header}>
              {/* Left: Back + Title info */}
              <View style={styles.headerLeft}>
                <PressableScale
                  onPress={() => router.push(isGuestFlow ? "/(tabs)" : "/(tabs)/library")}
                  style={styles.iconOnlyBtn}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </PressableScale>
                <View style={styles.headerTitle}>
                  <ThemedText
                    style={[styles.titleText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {title || "Untitled Draft"}
                  </ThemedText>
                  <View style={styles.headerMeta}>
                    <ThemedText
                      style={[styles.metaText, { color: colors.textMuted }]}
                    >
                      {wordCount} words ·{" "}
                      {activeTab === "edit" ? "Editing" : "Preview"}
                    </ThemedText>
                    {saveError && (
                      <ThemedText
                        style={[
                          styles.metaText,
                          styles.errorText,
                          { color: colors.error },
                        ]}
                      >
                        · Failed to save
                      </ThemedText>
                    )}
                    {!saveError && isSaving && (
                      <ThemedText
                        style={[styles.metaText, { color: colors.textMuted }]}
                      >
                        · Saving...
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>

              {/* Right: Actions */}
              <View style={styles.headerRight}>
                {/* Tab toggle - hide for guest flow (read-only) */}
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
            </View>
          </FadeIn>

          {activeTab === "edit" ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>
                    Title
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.count,
                      {
                        color: isOverLimit(title.length, 60)
                          ? colors.error
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {title.length}/60
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.titleInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: isOverLimit(title.length, 60)
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                  value={title}
                  onChangeText={(t) => setTitle(t.substring(0, 60))}
                  placeholder="Enter a title..."
                  placeholderTextColor={colors.placeholder}
                  maxLength={60}
                  autoCorrect
                  autoCapitalize="sentences"
                />
              </View>

              {/* Meta Description */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>
                    Meta Description
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.count,
                      {
                        color: isOverLimit(metaDescription.length, 160)
                          ? colors.error
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {metaDescription.length}/160
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.metaInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: isOverLimit(metaDescription.length, 160)
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                  value={metaDescription}
                  onChangeText={(t) => setMetaDescription(t.substring(0, 160))}
                  placeholder="SEO description..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                  maxLength={160}
                  autoCorrect
                  autoCapitalize="sentences"
                />
              </View>

              {/* Content */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>
                    Content
                  </ThemedText>
                  <ThemedText
                    style={[styles.count, { color: colors.textMuted }]}
                  >
                    {wordCount} words
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.contentInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your post..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  autoCorrect
                  autoCapitalize="sentences"
                />
              </View>
            </ScrollView>
          ) : (
            <Animated.ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.previewContent,
                { backgroundColor: colors.surface },
              ]}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <ThemedText style={[styles.previewTitle, { color: colors.text }]}>
                {title || "Untitled"}
              </ThemedText>
              {metaDescription && (
                <ThemedText
                  style={[styles.previewMeta, { color: colors.textMuted }]}
                >
                  {metaDescription}
                </ThemedText>
              )}
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <ThemedText style={[styles.previewBody, { color: colors.text }]}>
                {content || "No content..."}
              </ThemedText>
            </Animated.ScrollView>
          )}

          {/* Content Gate Overlay - only shown for guest users */}
          <ContentGate
            visible={showContentGate}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            scrollPercentage={scrollPercentage}
          />

          {/* GuestDraftGate - blurs half content and shows sign-up prompt for guest flow */}
          {isGuestFlow && (
            <GuestDraftGate onSignUp={handleGuestSignUp} />
          )}
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  // Header - Clean, single-row layout
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
    minHeight: 68,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing[3],
  },
  iconOnlyBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing[3],
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  errorText: {
    fontWeight: Typography.fontWeight.semibold,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnOutline: {
    borderWidth: 1.5,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing[4], paddingBottom: 160 },
  field: { marginBottom: Spacing[4] },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing[2],
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  count: {
    fontSize: Typography.fontSize.xs,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  titleInput: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    includeFontPadding: false,
    minHeight: 44,
  },
  metaInput: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    minHeight: 72,
    includeFontPadding: false,
  },
  contentInput: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    minHeight: 200,
    includeFontPadding: false,
  },
  previewContent: { padding: Spacing[5], paddingBottom: 160 },
  previewTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  previewMeta: {
    fontSize: Typography.fontSize.base,
    fontStyle: "italic",
    marginBottom: Spacing[4],
    includeFontPadding: false,
  },
  divider: { height: 1, marginVertical: Spacing[4] },
  previewBody: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
});
