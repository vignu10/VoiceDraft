import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';

import { ThemedText } from '@/components/themed-text';
import {
  AnimatedInput,
  AnimatedButton,
  AnimatedCard,
  PressableScale,
} from '@/components/ui/animated';
import { OAuthButton , PasswordStrengthMeter } from '@/components/auth';
import { useAuthStore } from '@/stores';
import { useAuthForm } from '@/hooks/use-auth-form';
import { signUpSchema } from '@/validations';
import { Spacing, Typography, Palette, BorderRadius } from '@/constants/design-system';

export default function SignUpScreen() {
  const { signUpUser, isLoading, clearError } = useAuthStore();

  const form = useAuthForm(signUpSchema, {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSignUp = async (data: { displayName: string; email: string; password: string; confirmPassword: string }) => {
    clearError();

    try {
      await signUpUser(data.email.trim(), data.password, data.displayName.trim());
      Alert.alert(
        'Account Created!',
        'Your account has been created. Please sign in to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/sign-in'),
          },
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      console.error('[SignUp] Error:', errorMessage, err);
      Alert.alert('Sign Up Failed', errorMessage);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
    clearError();

    try {
      await useAuthStore.getState().signInWithOAuth(provider);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      console.error('[OAuth] Error:', errorMessage, err);
      Alert.alert('OAuth Failed', errorMessage);
    }
  };

  // @ts-ignore - SafeAreaView needs flex: 1 to expand
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Illustration area */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <ThemedText style={styles.logoText}>V</ThemedText>
            </View>
            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>Start your writing journey</ThemedText>
          </View>
        </Animated.View>

        {/* Sign Up Form */}
        <AnimatedCard style={styles.formCard} delay={200}>
          <Controller
            control={form.control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Display Name"
                leftIcon="person-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                autoComplete="name"
                error={form.errors.displayName?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Email"
                leftIcon="mail-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={form.errors.email?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <AnimatedInput
                  label="Password"
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  autoComplete="password-new"
                  error={form.errors.password?.message}
                />
                {value.length > 0 && <PasswordStrengthMeter password={value} />}
              </>
            )}
          />

          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Confirm Password"
                leftIcon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                autoComplete="password-new"
                error={form.errors.confirmPassword?.message}
              />
            )}
          />

          <View style={styles.signUpButton}>
            <AnimatedButton
              onPress={form.handleSubmit(handleSignUp as any)}
              loading={isLoading}
              fullWidth
            >
              Create Account
            </AnimatedButton>
          </View>
        </AnimatedCard>

        {/* OAuth Divider */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.dividerContainer}
        >
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>or</ThemedText>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* OAuth Buttons */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <View style={styles.oauthButton}>
            <OAuthButton
              provider="google"
              onPress={() => handleOAuthSignIn('google')}
              isLoading={isLoading}
            />
          </View>
          <View style={styles.oauthButton}>
            <OAuthButton
              provider="linkedin"
              onPress={() => handleOAuthSignIn('linkedin')}
              isLoading={isLoading}
            />
          </View>
        </Animated.View>

        {/* Sign In Link */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.footer}
        >
          <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
          <PressableScale onPress={() => router.push('/auth/sign-in')}>
            <ThemedText style={styles.signInLink}>Sign In</ThemedText>
          </PressableScale>
        </Animated.View>
      </ScrollView>
      </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['3xl'],
    backgroundColor: Palette.periwinkle[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Palette.white,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    opacity: 0.7,
  },
  formCard: {
    marginBottom: Spacing[5],
  },
  signUpButton: {
    marginTop: Spacing[2],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.neutral[200],
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: Palette.neutral[500],
    marginHorizontal: Spacing[3],
  },
  oauthButton: {
    marginBottom: Spacing[3],
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
    color: Palette.periwinkle[500],
  },
});
