import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  AnimatedInput,
  AnimatedButton,
  AnimatedCard,
  PressableScale,
} from '@/components/ui/animated';
import { resetPassword } from '@/services/api/auth';
import { Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const colors = useThemeColors();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Please enter your email');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    const isEmailValid = validateEmail();

    if (!isEmailValid) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email.trim());
      setIsSuccess(true);

      // Countdown and auto-navigate back
      let count = 3;
      setCountdown(count);

      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);

        if (count === 0) {
          clearInterval(timer);
          router.back();
        }
      }, 1000);
    } catch (err) {
      Alert.alert(
        'Reset Failed',
        err instanceof Error ? err.message : 'Failed to send reset email'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mask email for display
  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username[0]}${username[1]}***@${domain}`;
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.successContainer}
          >
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>

            <ThemedText style={styles.successTitle}>Check Your Email!</ThemedText>
            <ThemedText style={styles.successMessage}>
              We've sent a password reset link to your email address
            </ThemedText>

            <AnimatedCard style={styles.emailCard} delay={200}>
              <View style={styles.emailContent}>
                <Ionicons name="mail-outline" size={24} color={colors.success} />
                <ThemedText style={styles.maskedEmail}>{maskEmail(email)}</ThemedText>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
            </AnimatedCard>

            <ThemedText style={styles.resendText}>
              Didn't receive the email?{'\n'}Check spam or try again later
            </ThemedText>

            <View style={styles.backButton}>
              <AnimatedButton
                onPress={() => router.back()}
                fullWidth
              >
                Back to Sign In {countdown > 0 && `(${countdown})`}
              </AnimatedButton>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <PressableScale onPress={() => router.back()} style={styles.backButtonContainer}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </PressableScale>

        {/* Illustration area */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.iconContainer}>
            <View style={[styles.lockIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="lock-closed" size={48} color={colors.primary} />
            </View>
            <ThemedText style={styles.title}>Forgot Password?</ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your email and we'll send you a reset link
            </ThemedText>
          </View>
        </Animated.View>

        {/* Reset Form */}
        <AnimatedCard style={styles.formCard} delay={200}>
          <AnimatedInput
            label="Email"
            leftIcon="mail-outline"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              setEmailError('');
            }}
            onBlur={validateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
          />

          <View style={styles.resetButton}>
            <AnimatedButton
              onPress={handleResetPassword}
              loading={isLoading}
              fullWidth
            >
              Send Reset Link
            </AnimatedButton>
          </View>
        </AnimatedCard>

        {/* Sign In Link */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.footer}
        >
          <ThemedText style={styles.footerText}>Remember your password? </ThemedText>
          <PressableScale onPress={() => router.back()}>
            <ThemedText style={styles.signInLink}>Sign In</ThemedText>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[5],
    paddingTop: Spacing[10],
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    opacity: 0.7,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: Spacing[5],
  },
  resetButton: {
    marginTop: Spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing[6],
  },
  footerText: {
    fontSize: Typography.fontSize.base,
  },
  signInLink: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#6366f1',
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    paddingTop: Spacing[10],
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[3],
  },
  successMessage: {
    fontSize: Typography.fontSize.base,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  emailCard: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  emailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  maskedEmail: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  backButton: {
    marginTop: Spacing[4],
  },
});
