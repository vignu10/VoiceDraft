import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AnimatedButton } from "@/components/ui/animated/animated-button";
import {
  Bounce,
  FadeIn,
  SlideIn,
} from "@/components/ui/animated/animated-wrappers";
import { LENGTH_WORD_COUNTS } from "@/constants/config";
import {
  BorderRadius,
  Shadows,
  Spacing,
  Typography,
  withOpacity,
} from "@/constants/design-system";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useSettingsStore, useRecordingStore } from "@/stores";
import type { Length, Tone } from "@/types/draft";
import { getKeywordTip, keywordEncouragement } from "@/utils/delight-messages";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const TONES: {
  value: Tone;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: keyof ReturnType<typeof useThemeColors>;
}[] = [
  { value: "professional", icon: "briefcase", colorKey: "primary" },
  { value: "casual", icon: "cafe", colorKey: "accent" },
  { value: "conversational", icon: "chatbubbles", colorKey: "teal" },
];

const LENGTHS: Length[] = ["short", "medium", "long"];

// Delightful Tone Card Component with Selection Animation
interface ToneCardProps {
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  colors: ReturnType<typeof useThemeColors>;
  colorKey: keyof ReturnType<typeof useThemeColors>;
}

function ToneCard({
  selected,
  onPress,
  icon,
  label,
  description,
  colors,
  colorKey,
}: ToneCardProps) {
  const cardColor = colors[colorKey] || colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`${label} writing tone${selected ? ", selected" : ""}`}
      activeOpacity={0.7}
      style={styles.toneCardTouchable}
    >
      <View
        style={[
          styles.toneCard,
          {
            backgroundColor: selected ? (cardColor as string) : (colors.surface as string),
            borderColor: selected ? (cardColor as string) : (colors.border as string),
          },
          selected && Shadows.sm,
        ]}
      >
        <View
          style={[
            styles.toneIconWrapper,
            selected && {
              backgroundColor: withOpacity(colors.textInverse, 0.2),
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={24}
            color={selected ? colors.textInverse : colors.textSecondary}
          />
        </View>
        <View style={styles.toneTextContainer}>
          <ThemedText
            style={[
              styles.toneLabel,
              { color: selected ? colors.textInverse : colors.text },
            ]}
          >
            {label}
          </ThemedText>
          <ThemedText
            style={[
              styles.toneDesc,
              { color: selected ? colors.textInverse : colors.textTertiary },
            ]}
          >
            {description}
          </ThemedText>
        </View>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.textInverse}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Delightful Length Card Component - Normalized to match Tone card pattern
interface LengthCardProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  wordCount: string;
  description: string;
  colors: ReturnType<typeof useThemeColors>;
}

function LengthCard({
  selected,
  onPress,
  label,
  wordCount,
  description,
  colors,
}: LengthCardProps) {
  // Assign each length a distinct icon for visual differentiation
  const getLengthIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (label.toLowerCase()) {
      case "Short":
        return "flash";
      case "Medium":
        return "document";
      case "Long":
        return "newspaper";
      default:
        return "document-text";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`${label} article length${selected ? ", selected" : ""}`}
      activeOpacity={0.7}
      style={styles.lengthCardTouchable}
    >
      <View
        style={[
          styles.lengthCard,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
          selected && Shadows.sm,
        ]}
      >
        <View
          style={[
            styles.lengthIconWrapper,
            selected && {
              backgroundColor: withOpacity(colors.textInverse, 0.2),
            },
          ]}
        >
          <Ionicons
            name={getLengthIcon()}
            size={24}
            color={selected ? colors.textInverse : colors.textSecondary}
          />
        </View>
        <View style={styles.lengthTextContainer}>
          <ThemedText
            style={[
              styles.lengthLabel,
              { color: selected ? colors.textInverse : colors.text },
            ]}
          >
            {label}
          </ThemedText>
          <ThemedText
            style={[
              styles.lengthWordCount,
              { color: selected ? colors.textInverse : colors.textTertiary },
            ]}
          >
            {wordCount}
          </ThemedText>
          <ThemedText
            style={[
              styles.lengthDesc,
              {
                color: selected
                  ? withOpacity(colors.textInverse, 0.8)
                  : colors.textMuted,
              },
            ]}
          >
            {description}
          </ThemedText>
        </View>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.textInverse}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Animated Tip Icon Component
function AnimatedTipIcon({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Slower, more subtle rotation animation
    const animateRotation = () => {
      rotation.value = withSequence(
        withTiming(8, { duration: 2000 }),
        withTiming(-8, { duration: 2000 }),
      );
    };

    // Slower, gentler pulse
    const animateScale = () => {
      scale.value = withSequence(
        withTiming(1.08, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      );
    };

    animateRotation();
    animateScale();

    const rotationInterval = setInterval(animateRotation, 4000);
    const scaleInterval = setInterval(animateScale, 3000);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(scaleInterval);
    };
  }, [rotation, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name="bulb" size={16} color={colors.warning} />
    </Animated.View>
  );
}

export default function KeywordScreen() {
  const params = useLocalSearchParams<{ audioUri: string; duration: string }>();
  const { defaultTone, defaultLength } = useSettingsStore();
  const colors = useThemeColors();
  const { clearLastDraft } = useRecordingStore();

  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState<Tone>(defaultTone);
  const [length, setLength] = useState<Length>(defaultLength);
  const [tip, setTip] = useState(getKeywordTip());
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Clear the last draft when user is on keyword screen (preparing to create new draft)
  useFocusEffect(
    useCallback(() => {
      // When the keyword screen is focused, we're preparing to create a new draft
      // So clear any previous draft state
      return () => {
        // Clear on blur (when navigating away) if we're going to processing
        // This ensures we don't show "Continue Draft" for the draft we're about to create
        clearLastDraft();
      };
    }, [clearLastDraft])
  );

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Navigate back to recording screen
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Refresh tip periodically for variety
  useEffect(() => {
    const interval = setInterval(() => {
      setTip(getKeywordTip());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    router.push({
      pathname: "/draft/processing",
      params: {
        audioUri: params.audioUri,
        duration: params.duration,
        keyword: keyword || undefined,
        tone,
        length,
      },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: "/draft/processing",
      params: {
        audioUri: params.audioUri,
        duration: params.duration,
        tone,
        length,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with playful bounce animation */}
          <Bounce delay={100}>
            <View style={styles.header}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="options" size={32} color={colors.primary} />
              </View>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Blog Options
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Customize how your blog post will be generated
              </ThemedText>
            </View>
          </Bounce>

          {/* Keyword Input with animated tip icon */}
          <SlideIn direction="up" delay={150}>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Target Keyword
              </ThemedText>
              <View style={styles.tipRow}>
                <AnimatedTipIcon colors={colors} />
                <ThemedText
                  style={[styles.labelHint, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {tip}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: isInputFocused
                      ? colors.primary
                      : colors.inputBorder,
                    borderWidth: isInputFocused ? 2 : 1.5,
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={isInputFocused ? colors.primary : colors.placeholder}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., productivity tips"
                  placeholderTextColor={colors.placeholder}
                  value={keyword}
                  onChangeText={setKeyword}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {keyword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setKeyword("")}
                    style={styles.clearButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SlideIn>

          {/* Tone Selection */}
          <SlideIn direction="up" delay={200}>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Writing Tone
              </ThemedText>
              <View style={styles.toneGrid}>
                {TONES.map((t) => (
                  <ToneCard
                    key={t.value}
                    selected={tone === t.value}
                    onPress={() => setTone(t.value)}
                    icon={t.icon}
                    label={t.value.charAt(0).toUpperCase() + t.value.slice(1)}
                    description={keywordEncouragement.toneDescriptions[t.value]}
                    colors={colors}
                    colorKey={t.colorKey}
                  />
                ))}
              </View>
            </View>
          </SlideIn>

          {/* Length Selection */}
          <SlideIn direction="up" delay={300}>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Article Length
              </ThemedText>
              <View style={styles.lengthGrid}>
                {LENGTHS.map((l) => (
                  <LengthCard
                    key={l}
                    selected={length === l}
                    onPress={() => setLength(l)}
                    label={l.charAt(0).toUpperCase() + l.slice(1)}
                    wordCount={`${LENGTH_WORD_COUNTS[l].min}-${LENGTH_WORD_COUNTS[l].max} words`}
                    description={keywordEncouragement.lengthDescriptions[l]}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          </SlideIn>
        </ScrollView>

        {/* Actions */}
        <FadeIn delay={400}>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <AnimatedButton variant="secondary" onPress={handleSkip}>
              Skip
            </AnimatedButton>
            <View style={styles.continueWrapper}>
              <AnimatedButton
                variant="primary"
                onPress={handleContinue}
                rightIcon="arrow-forward"
                fullWidth
              >
                Generate Blog
              </AnimatedButton>
            </View>
          </View>
        </FadeIn>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[6],
    paddingBottom: Spacing[8],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing[8],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing[5],
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing[2],
    letterSpacing: Typography.letterSpacing.tight,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: Typography.fontSize["2xl"] * 1.3,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    textAlign: "center",
    paddingHorizontal: Spacing[4],
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  section: {
    marginBottom: Spacing[7],
  },
  label: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
    includeFontPadding: false,
    lineHeight: Typography.fontSize.lg * 1.3,
  },
  labelHint: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[3],
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    marginBottom: Spacing[3],
    minHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 52,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
  },
  clearButton: {
    padding: Spacing[1],
  },
  toneGrid: {
    gap: Spacing[3],
  },
  toneCardTouchable: {
    width: "100%",
  },
  toneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    borderWidth: 1.5,
    borderRadius: BorderRadius["2xl"],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    minHeight: 72,
  },
  toneIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  toneTextContainer: {
    flex: 1,
  },
  toneLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  toneDesc: {
    fontSize: Typography.fontSize.sm,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  lengthGrid: {
    gap: Spacing[3],
  },
  lengthCardTouchable: {
    width: "100%",
  },
  lengthCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    borderWidth: 1.5,
    borderRadius: BorderRadius["2xl"],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    minHeight: 72,
  },
  lengthIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  lengthTextContainer: {
    flex: 1,
  },
  lengthLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  lengthWordCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
    opacity: 0.8,
  },
  lengthDesc: {
    fontSize: Typography.fontSize.sm,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing[3],
    padding: Spacing[6],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
  },
  continueWrapper: {
    flex: 2,
  },
});
