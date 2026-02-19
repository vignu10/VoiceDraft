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

interface ContentGateProps {
  visible: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  scrollPercentage?: number;
}

export function ContentGate({
  visible,
  onSignIn,
  onSignUp,
  scrollPercentage = 30,
}: ContentGateProps) {
  const colors = useThemeColors();

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(100);
  const contentOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.5);

  // Trigger animations when visibility changes
  useEffect(() => {
    if (visible) {
      // Animate in
      overlayOpacity.value = withTiming(1, { duration: 300 });
      contentTranslateY.value = withSpring(0, Springs.snappy);
      contentOpacity.value = withTiming(1, { duration: 400 });
      iconScale.value = withSpring(1, Springs.bouncy);
    } else {
      // Animate out
      overlayOpacity.value = withTiming(0, { duration: 200 });
      contentTranslateY.value = withTiming(100, { duration: 200 });
      contentOpacity.value = withTiming(0, { duration: 200 });
      iconScale.value = withTiming(0.5, { duration: 200 });
    }
    // Note: Shared values are stable references and don't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Blur overlay - blocks interaction with content */}
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: colors.overlay },
          overlayAnimatedStyle,
        ]}
        pointerEvents="auto"
      />

      {/* Gate content */}
      <Animated.View
        style={[styles.gateContainer, contentAnimatedStyle]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.gateCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            Shadows.xl,
          ]}
        >
          {/* Lock icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primaryLight },
              iconAnimatedStyle,
            ]}
          >
            <Ionicons name="lock-closed" size={40} color={colors.primary} />
          </Animated.View>

          {/* Title */}
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Sign in to view full content
          </ThemedText>

          {/* Description */}
          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {`You've viewed ${scrollPercentage}% of this post. Create a free account to unlock unlimited voice-to-blog posts and access all your drafts from any device.`}
          </ThemedText>

          {/* Benefits list */}
          <View style={styles.benefitsContainer}>
            <BenefitItem
              icon="mic-outline"
              text="Unlimited voice recordings"
              colors={colors}
            />
            <BenefitItem
              icon="cloud-outline"
              text="Sync across devices"
              colors={colors}
            />
            <BenefitItem
              icon="create-outline"
              text="Edit and export drafts"
              colors={colors}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <PressableScale
              onPress={onSignIn}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                Shadows.md,
              ]}
              hapticStyle="medium"
            >
              <Ionicons
                name="log-in-outline"
                size={20}
                color={colors.textInverse}
                style={styles.buttonIcon}
              />
              <ThemedText
                style={[
                  styles.primaryButtonText,
                  { color: colors.textInverse },
                ]}
              >
                Sign In
              </ThemedText>
            </PressableScale>

            <PressableScale
              onPress={onSignUp}
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              hapticStyle="light"
            >
              <ThemedText
                style={[styles.secondaryButtonText, { color: colors.primary }]}
              >
                Create Free Account
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Benefit item component
function BenefitItem({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.benefitItem}>
      <View
        style={[
          styles.benefitIconContainer,
          { backgroundColor: colors.primaryLight },
        ]}
      >
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <ThemedText style={[styles.benefitText, { color: colors.text }]}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.modal,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gateContainer: {
    width: "100%",
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
    paddingTop: Spacing[4],
  },
  gateCard: {
    width: "100%",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing[6],
    borderWidth: 1,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing[5],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  description: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing[5],
    includeFontPadding: false,
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: Spacing[6],
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing[3],
  },
  benefitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing[3],
  },
  benefitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    includeFontPadding: false,
  },
  buttonContainer: {
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
    minHeight: 56,
  },
  buttonIcon: {
    marginRight: Spacing[2],
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    includeFontPadding: false,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.xl,
    minHeight: 56,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});

export default ContentGate;
