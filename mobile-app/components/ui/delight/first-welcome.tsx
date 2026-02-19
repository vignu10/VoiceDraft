/**
 * First Welcome
 * A sophisticated welcome experience for first-time users.
 * Creates a memorable first impression with elegant animations.
 */

import { ThemedText } from "@/components/themed-text";
import { Duration } from "@/constants/animations";
import { BorderRadius, Spacing, Typography } from "@/constants/design-system";
import { useThemeColors } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  createAnimatedComponent,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FirstWelcomeProps {
  visible: boolean;
  onComplete: () => void;
}

/**
 * First-time welcome overlay with:
 * - Elegant backdrop fade
 * - Staggered content entrance
 * - Subtle sparkle animation
 * - Auto-dismiss after reading time
 */
export function FirstWelcome({ visible, onComplete }: FirstWelcomeProps) {
  const colors = useThemeColors();
  const [showContent, setShowContent] = useState(false);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const sparkleRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setShowContent(true);

      // Backdrop fade in
      backdropOpacity.value = withTiming(0.85, { duration: Duration.moderate });

      // Card entrance
      cardOpacity.value = withTiming(1, { duration: Duration.fast });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 150 });

      // Sparkle animation
      sparkleRotate.value = withSequence(
        withTiming(15, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(-15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }),
      );

      // Staggered text
      titleOpacity.value = withDelay(
        Duration.fast,
        withTiming(1, { duration: Duration.normal }),
      );
      subtitleOpacity.value = withDelay(
        Duration.moderate,
        withTiming(1, { duration: Duration.normal }),
      );
      buttonOpacity.value = withDelay(
        Duration.slow,
        withTiming(1, { duration: Duration.normal }),
      );

      // Auto-dismiss after reading time
      const timer = setTimeout(() => {
        dismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    backdropOpacity,
    buttonOpacity,
    cardOpacity,
    cardScale,
    sparkleRotate,
    subtitleOpacity,
    titleOpacity,
    visible,
  ]);

  const dismiss = () => {
    backdropOpacity.value = withTiming(0, { duration: Duration.fast });
    cardOpacity.value = withTiming(0, { duration: Duration.fast });
    cardScale.value = withTiming(0.9, { duration: Duration.fast }, () => {
      "worklet";
      runOnJS(setShowContent)(false);
      runOnJS(onComplete)();
    });
  };

  const handleBackdropPress = () => {
    dismiss();
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleOpacity.value === 1 ? 0 : 10 }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleOpacity.value === 1 ? 0 : 10 }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonOpacity.value === 1 ? 0 : 10 }],
  }));

  if (!showContent) return null;

  return (
    <View style={styles.container}>
      <AnimatedPressable
        onPress={handleBackdropPress}
        style={[
          styles.backdrop,
          { backgroundColor: colors.overlay },
          backdropStyle,
        ]}
      />

      <Animated.View style={[styles.card, cardStyle]}>
        <LinearGradient
          colors={[colors.surface, colors.backgroundSecondary]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          disableHardwareAcceleration={true}
        >
          {/* Sparkle icon */}
          <Animated.View style={sparkleStyle}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View style={titleStyle}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Welcome to VoiceDraft
            </ThemedText>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={subtitleStyle}>
            <ThemedText
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Your voice, amplified ✨
            </ThemedText>
          </Animated.View>

          {/* Simple dismiss hint */}
          <Animated.View style={buttonStyle}>
            <View
              style={[
                styles.dismissHint,
                { backgroundColor: colors.backgroundTertiary },
              ]}
            >
              <ThemedText
                style={[styles.dismissText, { color: colors.textTertiary }]}
              >
                Tap anywhere to start
              </ThemedText>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    padding: Spacing[8],
    alignItems: "center",
  },
  gradient: {
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing[6],
  },
  dismissHint: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  dismissText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
