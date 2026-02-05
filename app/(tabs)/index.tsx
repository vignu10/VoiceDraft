import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatRelativeTime } from '@/utils/formatters';
import type { Draft } from '@/types/draft';
import { Ionicons } from '@expo/vector-icons';
import { FadeIn, SlideIn, PressableScale, AnimatedListItem, GlowEffect } from '@/components/ui/animated';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';
import { Duration, Springs, Easings, Stagger } from '@/constants/animations';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function RecordTab() {
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const colors = useThemeColors();

  // Continuous floating animation for title
  const floatProgress = useSharedValue(0);
  const titleScale = useSharedValue(0.95);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    // Float animation - continuous gentle movement
    floatProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Initial entrance animation
    titleOpacity.value = withDelay(0, withSpring(1, Springs.gentle));
    titleScale.value = withDelay(0, withSpring(1, Springs.bouncy));
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const floatOffset = Math.cos(floatProgress.value * Math.PI * 2) * 4;
    return {
      opacity: titleOpacity.value,
      transform: [
        { translateY: floatOffset },
        { scale: titleScale.value },
      ],
    };
  });

  // Enhanced pulse animation for record button
  const pulseScale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Main button pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow effect pulse (out of phase)
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulseScale, glowScale, glowOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const loadRecentDrafts = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('drafts');
      if (data) {
        const drafts: Draft[] = JSON.parse(data);
        setRecentDrafts(drafts.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentDrafts();
    }, [loadRecentDrafts])
  );

  const handleStartRecording = () => {
    router.push('/recording');
  };

  const handleDraftPress = (id: string) => {
    router.push({
      pathname: '/draft/[id]',
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header - Clean and spacious with floating animation */}
        <View style={styles.header}>
          <Animated.Text
            style={[
              styles.appTitle,
              { color: colors.primary },
              titleAnimatedStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={false}
          >
            VoiceDraft
          </Animated.Text>
          <FadeIn delay={Duration.fast}>
            <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
              Turn your voice into polished content
            </ThemedText>
          </FadeIn>
        </View>

        {/* Main Content - Better spacing and hierarchy */}
        <View style={styles.content}>
          <FadeIn delay={Duration.normal}>
            <View style={styles.promptContainer}>
              <ThemedText style={[styles.prompt, { color: colors.text }]}>
                Ready to create?
              </ThemedText>
              <ThemedText style={[styles.promptSubtext, { color: colors.textSecondary }]}>
                Speak naturally and we'll handle the rest
              </ThemedText>
            </View>
          </FadeIn>

          {/* Record Button - With glow effect */}
          <SlideIn direction="up" delay={Duration.moderate}>
            <View style={styles.recordButtonContainer}>
              {/* Outer glow */}
              <Animated.View
                style={[
                  styles.recordGlow,
                  {
                    backgroundColor: colors.primary,
                    opacity: glowOpacity.value * 0.3,
                  },
                  useAnimatedStyle(() => ({
                    transform: [{ scale: glowScale.value }],
                  })),
                ]}
              />

              <PressableScale
                onPress={handleStartRecording}
                scale={0.92}
                hapticStyle="medium"
              >
                <Animated.View
                  style={[
                    styles.recordButton,
                    pulseStyle,
                    {
                      backgroundColor: colors.primary,
                      ...Shadows.xl,
                    },
                  ]}
                >
                  <Ionicons name="mic" size={40} color={colors.textInverse} />
                </Animated.View>
              </PressableScale>
            </View>
          </SlideIn>

          <FadeIn delay={Duration.moderate + Duration.fast}>
            <ThemedText style={[styles.hint, { color: colors.textMuted }]}>
              Tap to start recording
            </ThemedText>
          </FadeIn>
        </View>

        {/* Recent Drafts */}
        {recentDrafts.length > 0 && (
          <SlideIn direction="up" delay={Duration.slow}>
            <View
              style={[
                styles.recentSection,
                { borderTopColor: colors.border, backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <View style={styles.recentHeader}>
                <ThemedText style={[styles.recentTitle, { color: colors.text }]}>
                  Recent Drafts
                </ThemedText>
                <ThemedText style={[styles.recentCount, { color: colors.textMuted }]}>
                  {recentDrafts.length}
                </ThemedText>
              </View>
              {recentDrafts.map((draft, index) => (
                <AnimatedListItem
                  key={draft.id}
                  delay={Duration.slow + Stagger.delay(index + 1)}
                  onPress={() => handleDraftPress(draft.id)}
                  showDivider={index < recentDrafts.length - 1}
                  style={{ paddingHorizontal: 0 }}
                >
                  <View style={styles.draftItem}>
                    <View
                      style={[
                        styles.draftIcon,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <Ionicons
                        name="document-text"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.draftInfo}>
                      <ThemedText
                        style={[styles.draftTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {draft.title || 'Untitled Draft'}
                      </ThemedText>
                      <View style={styles.draftMeta}>
                        <ThemedText
                          style={[styles.draftTime, { color: colors.textMuted }]}
                        >
                          {formatRelativeTime(new Date(draft.createdAt))}
                        </ThemedText>
                        {draft.wordCount && (
                          <>
                            <ThemedText style={[styles.metaDot, { color: colors.textMuted }]}>
                              •
                            </ThemedText>
                            <ThemedText style={[styles.draftTime, { color: colors.textMuted }]}>
                              {draft.wordCount} words
                            </ThemedText>
                          </>
                        )}
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                </AnimatedListItem>
              ))}
            </View>
          </SlideIn>
        )}
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
  header: {
    alignItems: 'center',
    paddingTop: Spacing[10],
    paddingBottom: Spacing[4],
    paddingHorizontal: Spacing[6],
    minHeight: 90,
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: Spacing[2],
    fontFamily: 'Nunito_800ExtraBold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    letterSpacing: 0.2,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
  },
  promptContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  prompt: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing[2],
  },
  promptSubtext: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing[8],
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing[6],
    position: 'relative',
  },
  recordGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    borderTopWidth: 1,
    marginTop: Spacing[2],
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  recentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: -0.3,
  },
  recentCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: 21,
    marginBottom: Spacing[1],
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  draftTime: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
  },
  metaDot: {
    fontSize: Typography.fontSize.xs,
  },
});
