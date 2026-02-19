import { ThemedText } from "@/components/themed-text";
import { PressableScale } from "@/components/ui/animated/pressable-scale";
import { Springs } from "@/constants/animations";
import {
  BorderRadius,
  Shadows,
  Spacing,
  Typography,
  ZIndex,
} from "@/constants/design-system";
import { useThemeColors } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface SaveGateProps {
  onSignUp: () => void;
  onDismiss: () => void;
}

export function SaveGate({ onSignUp, onDismiss }: SaveGateProps) {
  const colors = useThemeColors();

  // Entrance animation — slide up from bottom
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Small delay so the draft content renders first
    const timer = setTimeout(() => {
      translateY.value = withSpring(0, Springs.snappy);
      opacity.value = withTiming(1, { duration: 300 });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          Shadows.xl,
        ]}
      >
        {/* Sparkle badge */}
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
            ✨ Your draft is ready!
          </ThemedText>
        </View>

        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign up to save it permanently and access all features
        </ThemedText>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {/* Primary: Sign Up Free */}
          <PressableScale
            onPress={onSignUp}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              Shadows.glow,
            ]}
            hapticStyle="medium"
          >
            <Ionicons
              name="person-add-outline"
              size={18}
              color={colors.textInverse}
              style={styles.buttonIcon}
            />
            <ThemedText
              style={[styles.primaryButtonText, { color: colors.textInverse }]}
            >
              Sign Up Free
            </ThemedText>
          </PressableScale>

          {/* Secondary: Maybe Later */}
          <PressableScale
            onPress={onDismiss}
            style={styles.ghostButton}
            hapticStyle="light"
          >
            <ThemedText
              style={[styles.ghostButtonText, { color: colors.textMuted }]}
            >
              Maybe Later
            </ThemedText>
          </PressableScale>
        </View>

        {/* Dismiss handle hint */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: ZIndex.sticky,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[6],
  },
  card: {
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 3,
    borderRadius: BorderRadius.full,
    marginTop: Spacing[3],
    opacity: 0.4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    marginBottom: Spacing[3],
  },
  badgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * 1.5,
    marginBottom: Spacing[5],
    includeFontPadding: false,
    paddingHorizontal: Spacing[2],
  },
  buttonRow: {
    width: "100%",
    gap: Spacing[3],
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    minHeight: 52,
  },
  buttonIcon: {
    marginRight: Spacing[2],
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    includeFontPadding: false,
  },
  ghostButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    minHeight: 44,
  },
  ghostButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
});

export default SaveGate;
