/**
 * Transitioning Hint
 * Smooth text transitions for hint content changes.
 * Creates a polished feel when context changes.
 */

import { ThemedText } from "@/components/themed-text";
import { Duration } from "@/constants/animations";
import { BorderRadius, Spacing, Typography } from "@/constants/design-system";
import { useThemeColors } from "@/hooks/use-theme-color";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface TransitioningHintProps {
  text: string;
}

/**
 * A hint container that smoothly transitions between text changes
 * Creates a polished feel when hint content updates
 */
export function TransitioningHint({ text }: TransitioningHintProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Handle text changes with smooth transition
  React.useEffect(() => {
    // Fade out and slide up slightly
    opacity.value = withTiming(0, { duration: Duration.fast }, () => {
      "worklet";
      // Fade in and slide to position
      opacity.value = withTiming(1, { duration: Duration.normal });
      translateY.value = withTiming(0, { duration: Duration.normal });
    });
    translateY.value = withTiming(-8, { duration: Duration.fast });
  }, [opacity, text, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
          {text}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    marginTop: Spacing[4],
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: "center",
    includeFontPadding: false,
  },
});
