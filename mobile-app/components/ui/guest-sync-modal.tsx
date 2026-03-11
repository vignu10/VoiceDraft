import { useThemeColors } from "@/hooks/use-theme-color";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FadeIn,
  SlideIn,
  ZoomIn,
} from "@/components/ui/animated/animated-wrappers";
import { AnimatedButton } from "@/components/ui/animated/animated-button";
import { AnimatedCard } from "@/components/ui/animated/animated-card";
import {
  BorderRadius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { ThemedText } from "@/components/themed-text";
import { PressableScale } from "@/components/ui/animated/pressable-scale";
import { Ionicons } from "@expo/vector-icons";
import { useGuestSync } from "@/hooks/use-guest-sync";
import { useAuthStore, useGuestStore } from "@/stores";

interface GuestSyncModalProps {
  visible: boolean;
  token: string;
  onDismiss: () => void;
}

/**
 * Modal shown after successful sign-in to offer syncing a guest draft
 */
export function GuestSyncModal({
  visible,
  token,
  onDismiss,
}: GuestSyncModalProps) {
  const colors = useThemeColors();
  const { sync, isSyncing, guestDraft, dismiss } = useGuestSync({
    onSyncSuccess: (postId) => {
      // Navigate to the synced draft
      onDismiss();
      router.replace(`/draft/${postId}`);
    },
    onSyncError: (error) => {
      Alert.alert("Sync Failed", error, [
        { text: "OK", onPress: () => onDismiss() },
      ]);
    },
  });

  const handleSync = async () => {
    const success = await sync(token);
    if (!success && !guestDraft) {
      // No draft to sync, just dismiss
      onDismiss();
    }
  };

  const handleDismiss = () => {
    dismiss();
    onDismiss();
  };

  if (!guestDraft) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView
        mode="padding"
        edges={["top", "bottom"]}
      >
        <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <SlideIn direction="down" delay={100}>
            <View style={styles.header}>
              <PressableScale onPress={handleDismiss}>
                <ThemedText style={styles.closeButton}>Cancel</ThemedText>
              </PressableScale>
            </View>
          </SlideIn>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <ZoomIn delay={200}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
              </View>
            </ZoomIn>

            {/* Title */}
            <FadeIn delay={300}>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Sync Your Draft?
              </ThemedText>
            </FadeIn>

            {/* Subtitle */}
            <FadeIn delay={400}>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                We found a draft from your guest session. Would you like to sync it to your account now?
              </ThemedText>
            </FadeIn>

            {/* Draft Preview */}
            <SlideIn direction="up" delay={500}>
              <AnimatedCard
                variant="outlined"
                style={[styles.previewCard, { borderColor: colors.border }]}
              >
                <ThemedText style={[styles.previewTitle, { color: colors.text }]}>
                  {guestDraft.title}
                </ThemedText>
                <ThemedText
                  style={[styles.previewContent, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {guestDraft.content.slice(0, 200)}...
                </ThemedText>
                <View style={styles.previewMeta}>
                  {guestDraft.keywords && guestDraft.keywords.length > 0 && (
                    <View style={styles.keywords}>
                      {guestDraft.keywords.map((keyword, i) => (
                        <View
                          key={i}
                          style={[
                            styles.keywordTag,
                            { backgroundColor: colors.accentLight },
                          ]}
                        >
                          <ThemedText
                            style={[styles.keywordText, { color: colors.accent }]}
                          >
                            {keyword}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                  <ThemedText
                    style={[styles.previewDate, { color: colors.textTertiary }]}
                  >
                    {new Date(guestDraft.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </AnimatedCard>
            </SlideIn>

            {/* Info */}
            <FadeIn delay={600}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
                <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                  Your draft will be saved to your account and accessible from any device.
                </ThemedText>
              </View>
            </FadeIn>

            {/* Actions */}
            <SlideIn direction="up" delay={700}>
              <View style={styles.actions}>
                <View style={styles.secondaryButton}>
                  <AnimatedButton
                    variant="secondary"
                    onPress={handleDismiss}
                    fullWidth
                    disabled={isSyncing}
                  >
                    Skip
                  </AnimatedButton>
                </View>
                <View style={styles.primaryButton}>
                  <AnimatedButton
                    variant="primary"
                    onPress={handleSync}
                    loading={isSyncing}
                    fullWidth
                  >
                    Sync Draft
                  </AnimatedButton>
                </View>
              </View>
            </SlideIn>
          </View>
        </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing[4],
  },
  closeButton: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: "#007AFF",
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing[6],
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: "center",
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing[6],
  },
  previewCard: {
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  previewTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  previewContent: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginBottom: Spacing[4],
  },
  previewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  keywords: {
    flexDirection: "row",
    gap: Spacing[2],
  },
  keywordTag: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  keywordText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  previewDate: {
    fontSize: Typography.fontSize.xs,
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing[2],
    alignItems: "flex-start",
    padding: Spacing[4],
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[6],
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
});
