import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

interface ScrollTriggeredPromptProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ScrollTriggeredPrompt({
  visible,
  onDismiss,
}: ScrollTriggeredPromptProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(50, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSignUp = () => {
    router.push('/auth/sign-up');
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: `${colors.text}80` }]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {/* Lock Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="lock-closed" size={40} color={colors.primary} />
          </View>

          {/* Title */}
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Unlock Full Access
          </ThemedText>

          {/* Subtitle */}
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign up to read the rest of this draft and create your own
          </ThemedText>

          {/* Buttons */}
          <View style={styles.buttons}>
            <PressableScale
              onPress={handleSignUp}
              hapticStyle="medium"
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person-add" size={20} color={colors.textInverse} />
              <ThemedText style={[styles.buttonText, { color: colors.textInverse }]}>
                Sign Up
              </ThemedText>
            </PressableScale>

            <PressableScale
              onPress={handleSignIn}
              hapticStyle="light"
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
            >
              <ThemedText style={[styles.buttonTextSecondary, { color: colors.text }]}>
                Sign In
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  container: {
    maxWidth: 340,
    width: '100%',
  },
  content: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    ...Shadows.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: 'center',
    marginBottom: Spacing[2],
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  buttons: {
    gap: Spacing[3],
    width: '100%',
    marginBottom: Spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.xl,
    minHeight: 48,
  },
  primaryButton: {
    ...Shadows.md,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.extrabold,
    includeFontPadding: false,
  },
  buttonTextSecondary: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});
