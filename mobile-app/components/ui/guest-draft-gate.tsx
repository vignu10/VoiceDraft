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
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Helper to convert hex to rgba for expo-linear-gradient
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  // Remove hash if present
  const hexValue = hex.replace('#', '');
  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GuestDraftGateProps {
  onSignUp: () => void;
}

export function GuestDraftGate({ onSignUp }: GuestDraftGateProps) {
  const colors = useThemeColors();

  // Entrance animation — fade in
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  // Prepare gradient colors with proper rgba format for expo-linear-gradient
  const gradientColors = useMemo(() => {
    if (!colors.background) {
      return ["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)", "#000000"];
    }
    return [
      "transparent",
      hexToRgba(colors.background, 0.25),
      hexToRgba(colors.background, 0.5),
      hexToRgba(colors.background, 0.8),
      colors.background,
    ];
  }, [colors.background]);

  useEffect(() => {
    // Delay to let content render first
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, Springs.snappy);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Blur gradient overlay - covers bottom half */}
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.15, 0.35, 0.6, 0.85]}
        style={styles.gradient}
      />

      {/* Sign-up prompt card */}
      <Animated.View style={[styles.promptContainer, animatedStyle]}>
        <View
          style={[
            styles.promptCard,
            { backgroundColor: colors.surface },
            Shadows.xl,
          ]}
        >
          {/* Lock icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="lock-closed" size={24} color={colors.primary} />
          </View>

          {/* Title */}
          <ThemedText style={[styles.promptTitle, { color: colors.text }]}>
            Want to see the rest?
          </ThemedText>

          {/* Subtitle */}
          <ThemedText
            style={[styles.promptSubtitle, { color: colors.textSecondary }]}
          >
            Sign up to view your full draft, save it, and create unlimited
            posts!
          </ThemedText>

          {/* Sign up button */}
          <PressableScale
            onPress={onSignUp}
            style={[
              styles.signUpButton,
              { backgroundColor: colors.primary },
              Shadows.glow,
            ]}
            hapticStyle="medium"
          >
            <Ionicons
              name="person-add"
              size={18}
              color={colors.textInverse}
              style={styles.buttonIcon}
            />
            <ThemedText
              style={[styles.signUpButtonText, { color: colors.textInverse }]}
            >
              Sign Up Free
            </ThemedText>
          </PressableScale>

          {/* Benefits */}
          <View style={styles.benefitsRow}>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
              <ThemedText
                style={[styles.benefitText, { color: colors.textMuted }]}
              >
                Save drafts
              </ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
              <ThemedText
                style={[styles.benefitText, { color: colors.textMuted }]}
              >
                Unlimited posts
              </ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
              <ThemedText
                style={[styles.benefitText, { color: colors.textMuted }]}
              >
                Export
              </ThemedText>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.modal,
    justifyContent: "flex-end",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
  },
  promptContainer: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[8],
    paddingTop: Spacing[4],
  },
  promptCard: {
    borderRadius: BorderRadius["2xl"],
    padding: Spacing[6],
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing[4],
  },
  promptTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
    textAlign: "center",
  },
  promptSubtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    marginBottom: Spacing[5],
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  signUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[3.5],
    paddingHorizontal: Spacing[8],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing[4],
  },
  buttonIcon: {
    marginRight: Spacing[2],
  },
  signUpButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  benefitsRow: {
    flexDirection: "row",
    gap: Spacing[4],
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[1],
  },
  benefitText: {
    fontSize: Typography.fontSize.xs,
  },
});
