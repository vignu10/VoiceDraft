# Auth Forms Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor authentication screens to use react-hook-form + Zod for proper form validation and state management.

**Architecture:** Extract validation logic to a dedicated `validations/` folder with Zod schemas. Create a shared `useAuthForm` hook that wraps react-hook-form configuration. Refactor each auth screen to use the new hook while preserving existing UI/UX.

**Tech Stack:** React Native, Expo Router, react-hook-form, Zod, @hookform/resolvers, TypeScript

---

## Prerequisites

### Task 0: Install Dependencies

**Files:**
- Modify: `mobile-app/package.json`

**Step 1: Install react-hook-form and Zod**

Run in mobile-app directory:
```bash
cd mobile-app && npm install react-hook-form zod @hookform/resolvers
```

Expected: Packages installed successfully

**Step 2: Verify installation**

Check package.json has new dependencies:
```bash
cat mobile-app/package.json | grep -E "(react-hook-form|zod|@hookform/resolvers)"
```

Expected: All three packages listed in dependencies

**Step 3: Commit**

```bash
git add mobile-app/package.json mobile-app/package-lock.json
git commit -m "deps: install react-hook-form, zod, and @hookform/resolvers"
```

---

## Validation Layer

### Task 1: Create Common Validators

**Files:**
- Create: `mobile-app/validations/common.ts`

**Step 1: Create the common validators file**

```typescript
import { z } from 'zod';

/**
 * Common validation constants and utilities
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Zod schema for email validation
 */
export const emailSchema = z
  .string({
    required_error: 'Please enter your email',
  })
  .min(1, { message: 'Please enter your email' })
  .regex(EMAIL_REGEX, { message: 'Please enter a valid email address' })
  .trim();

/**
 * Generic non-empty string validator
 */
export const nonEmptyString = (fieldName: string) =>
  z
    .string({
      required_error: `Please enter ${fieldName}`,
    })
    .min(1, { message: `Please enter ${fieldName}` })
    .trim();

/**
 * Generic minimum length validator
 */
export const minLength = (length: number, fieldName: string) =>
  z
    .string()
    .min(length, { message: `${fieldName} must be at least ${length} characters` });
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/validations/common.ts
git commit -m "feat: add common validation utilities"
```

---

### Task 2: Create Password Validation

**Files:**
- Create: `mobile-app/validations/password.ts`

**Step 1: Create the password validation file**

```typescript
import { z } from 'zod';

/**
 * Configurable password requirements
 */
export const passwordRequirements = {
  minLength: 6,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false,
} as const;

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface PasswordStrengthInfo {
  level: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
}

/**
 * Calculate password strength based on configurable requirements
 */
export function calculatePasswordStrength(password: string): PasswordStrengthInfo {
  const feedback: string[] = [];
  let score = 0;

  // Length check (up to 40 points)
  if (password.length >= passwordRequirements.minLength) {
    score += 20;
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
  } else {
    feedback.push(`Use at least ${passwordRequirements.minLength} characters`);
  }

  // Character variety (up to 60 points)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  const varietyCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

  if (varietyCount >= 2) {
    score += 20;
    if (varietyCount >= 3) score += 20;
    if (varietyCount === 4) score += 20;
  } else {
    feedback.push('Mix letters, numbers, and symbols');
  }

  // Optional requirement checks
  if (passwordRequirements.requireUppercase && !hasUpperCase) {
    feedback.push('Add uppercase letters');
    score = Math.max(0, score - 10);
  }
  if (passwordRequirements.requireLowercase && !hasLowerCase) {
    feedback.push('Add lowercase letters');
    score = Math.max(0, score - 10);
  }
  if (passwordRequirements.requireNumbers && !hasNumbers) {
    feedback.push('Add numbers');
    score = Math.max(0, score - 10);
  }
  if (passwordRequirements.requireSpecialChars && !hasSpecialChars) {
    feedback.push('Add special characters');
    score = Math.max(0, score - 10);
  }

  // Determine strength level
  let level: PasswordStrength = 'weak';
  if (score >= 75) level = 'very-strong';
  else if (score >= 50) level = 'strong';
  else if (score >= 25) level = 'fair';

  return { level, score, feedback };
}

/**
 * Get strength meter color for level
 */
export function getStrengthColor(level: PasswordStrength): string {
  const colors = {
    weak: '#ef4444',
    fair: '#f59e0b',
    strong: '#84cc16',
    'very-strong': '#22c55e',
  };
  return colors[level];
}

/**
 * Get strength label for level
 */
export function getStrengthLabel(level: PasswordStrength): string {
  const labels = {
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
    'very-strong': 'Very Strong',
  };
  return labels[level];
}

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string({
    required_error: 'Please enter a password',
  })
  .min(passwordRequirements.minLength, {
    message: `Password must be at least ${passwordRequirements.minLength} characters`,
  });

/**
 * Zod refinement for password confirmation
 */
export const confirmPasswordSchema = (passwordField: string = 'password') =>
  z
    .string({
      required_error: 'Please confirm your password',
    })
    .min(1, { message: 'Please confirm your password' })
    .refine((val, ctx) => val === ctx.parent[passwordField as keyof typeof ctx.parent], {
      message: 'Passwords do not match',
    });
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/validations/password.ts
git commit -m "feat: add configurable password validation with strength metering"
```

---

### Task 3: Create Auth Schemas

**Files:**
- Create: `mobile-app/validations/auth.ts`

**Step 1: Create the auth schemas file**

```typescript
import { z } from 'zod';
import { emailSchema, nonEmptyString, minLength } from './common';
import { passwordSchema, confirmPasswordSchema } from './password';

/**
 * Sign Up Form Schema
 */
export const signUpSchema = z
  .object({
    displayName: nonEmptyString('name').pipe(minLength(2, 'name')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema('password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Sign In Form Schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Please enter your password' }).min(1, {
    message: 'Please enter your password',
  }),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

/**
 * Forgot Password Form Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/validations/auth.ts
git add mobile-app/validations/index.ts
git commit -m "feat: add auth form Zod schemas"
```

---

### Task 4: Create Validation Index

**Files:**
- Create: `mobile-app/validations/index.ts`

**Step 1: Create the index file**

```typescript
// Re-export all validation modules
export * from './common';
export * from './password';
export * from './auth';
```

**Step 2: Commit**

```bash
git add mobile-app/validations/index.ts
git commit -m "feat: add validation index barrel export"
```

---

## Shared Form Hook

### Task 5: Create useAuthForm Hook

**Files:**
- Create: `mobile-app/hooks/use-auth-form.ts`

**Step 1: Create the shared form hook**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

/**
 * Generic hook for auth forms using react-hook-form + Zod
 *
 * @param schema - Zod schema for validation
 * @param defaultValues - Default form values
 * @returns Form control, handlers, and state
 */
export function useAuthForm<T extends z.ZodType>(
  schema: T,
  defaultValues: z.infer<T>
) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur', // Validate on field blur
    reValidateMode: 'onBlur',
  });

  return {
    control: form.control,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    handleSubmit: form.handleSubmit,
    reset: form.reset,
    setError: form.setError,
    clearErrors: form.clearErrors,
    getValues: form.getValues,
    watch: form.watch,
  };
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/hooks/use-auth-form.ts
git commit -m "feat: add shared useAuthForm hook with react-hook-form"
```

---

## UI Components

### Task 6: Create Password Strength Meter

**Files:**
- Create: `mobile-app/components/auth/password-strength-meter.tsx`

**Step 1: Create the password strength meter component**

```typescript
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { calculatePasswordStrength, getStrengthColor, getStrengthLabel, type PasswordStrength } from '@/validations/password';
import { Spacing, Typography } from '@/constants/design-system';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PasswordStrengthMeterProps {
  password: string;
  showLabel?: boolean;
  showFeedback?: boolean;
}

export function PasswordStrengthMeter({
  password,
  showLabel = true,
  showFeedback = true,
}: PasswordStrengthMeterProps) {
  const strength = useSharedValue(calculatePasswordStrength(password));
  const barWidth = useSharedValue(0);
  const strengthLevel = useSharedValue<PasswordStrength>('weak');

  React.useEffect(() => {
    const newStrength = calculatePasswordStrength(password);
    strength.value = newStrength;
    barWidth.value = withTiming(newStrength.score, { duration: 300 });
    strengthLevel.value = newStrength.level;
  }, [password, barWidth, strength, strengthLevel]);

  const animatedProps = useAnimatedProps(() => ({
    style: {
      width: `${barWidth.value}%`,
    },
  }));

  const currentStrength = strength.value as any as ReturnType<typeof calculatePasswordStrength>;

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <AnimatedLinearGradient
          colors={[getStrengthColor(strengthLevel.value), getStrengthColor(strengthLevel.value)]}
          animatedProps={animatedProps}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bar}
        />
      </View>
      {showLabel && (
        <ThemedText style={[styles.label, { color: getStrengthColor(strengthLevel.value) }]}>
          {getStrengthLabel(strengthLevel.value)}
        </ThemedText>
      )}
      {showFeedback && currentStrength.feedback.length > 0 && (
        <ThemedText style={styles.feedback}>
          {currentStrength.feedback[0]}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing[2],
  },
  barContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing[1],
  },
  feedback: {
    fontSize: Typography.fontSize.xs,
    opacity: 0.7,
    marginTop: Spacing[1],
  },
});
```

**Step 2: Create the index export**

File: `mobile-app/components/auth/index.ts`

```typescript
export * from './password-strength-meter';
export * from './oauth-button';
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 4: Commit**

```bash
git add mobile-app/components/auth/password-strength-meter.tsx mobile-app/components/auth/index.ts
git commit -m "feat: add PasswordStrengthMeter component"
```

---

## Refactor Auth Screens

### Task 7: Refactor Sign Up Screen

**Files:**
- Modify: `mobile-app/app/auth/sign-up.tsx`

**Step 1: Replace the sign-up form with react-hook-form**

Replace the entire component with:

```typescript
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
import { OAuthButton } from '@/components/auth';
import { PasswordStrengthMeter } from '@/components/auth';
import { useAuthStore } from '@/stores';
import { useAuthForm } from '@/hooks/use-auth-form';
import { signUpSchema, type SignUpFormValues } from '@/validations';
import { Spacing, Typography } from '@/constants/design-system';

export default function SignUpScreen() {
  const { signUpUser, isLoading, error, clearError } = useAuthStore();

  const form = useAuthForm(signUpSchema, {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSignUp = async (data: SignUpFormValues) => {
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

  return (
    <SafeAreaView style={styles.container}>
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
              onPress={form.handleSubmit(handleSignUp)}
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
    </SafeAreaView>
  );
}

// Keep existing styles unchanged
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
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: '#6b7280',
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
    color: '#6366f1',
  },
});
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/app/auth/sign-up.tsx
git commit -m "refactor: convert sign-up form to react-hook-form + Zod"
```

---

### Task 8: Refactor Sign In Screen

**Files:**
- Modify: `mobile-app/app/auth/sign-in.tsx`

**Step 1: Replace the sign-in form with react-hook-form**

Replace the component with:

```typescript
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
import { OAuthButton } from '@/components/auth';
import { useAuthStore } from '@/stores';
import { useAuthForm } from '@/hooks/use-auth-form';
import { signInSchema, type SignInFormValues } from '@/validations';
import { Spacing, Typography } from '@/constants/design-system';

export default function SignInScreen() {
  const { signInUser, isLoading, error, clearError } = useAuthStore();

  const form = useAuthForm(signInSchema, {
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const handleSignIn = async (data: SignInFormValues) => {
    clearError();

    try {
      await signInUser(data.email.trim(), data.password);
    } catch (err) {
      Alert.alert('Sign In Failed', error || 'Invalid email or password');
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
    clearError();

    try {
      await useAuthStore.getState().signInWithOAuth(provider);
    } catch (err) {
      Alert.alert('OAuth Failed', error || 'Failed to sign in with ' + provider);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <ThemedText style={styles.title}>Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>Sign in to your account</ThemedText>
          </View>
        </Animated.View>

        {/* Sign In Form */}
        <AnimatedCard style={styles.formCard} delay={200}>
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
              <AnimatedInput
                label="Password"
                leftIcon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                autoComplete="password"
                error={form.errors.password?.message}
              />
            )}
          />

          <PressableScale onPress={() => router.push('/auth/forgot-password')}>
            <ThemedText style={styles.forgotPassword}>Forgot Password?</ThemedText>
          </PressableScale>

          <View style={styles.signInButton}>
            <AnimatedButton
              onPress={form.handleSubmit(handleSignIn)}
              loading={isLoading}
              fullWidth
            >
              Sign In
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

        {/* Sign Up Link */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.footer}
        >
          <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
          <PressableScale onPress={() => router.push('/auth/sign-up')}>
            <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Keep existing styles unchanged
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
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
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
  forgotPassword: {
    fontSize: Typography.fontSize.sm,
    color: '#6366f1',
    textAlign: 'right',
    marginBottom: Spacing[4],
  },
  signInButton: {
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
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: '#6b7280',
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
  signUpLink: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#6366f1',
  },
});
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/app/auth/sign-in.tsx
git commit -m "refactor: convert sign-in form to react-hook-form + Zod"
```

---

### Task 9: Refactor Forgot Password Screen

**Files:**
- Modify: `mobile-app/app/auth/forgot-password.tsx`

**Step 1: Replace the forgot-password form with react-hook-form**

Replace the component with:

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  AnimatedInput,
  AnimatedButton,
  AnimatedCard,
  PressableScale,
} from '@/components/ui/animated';
import { resetPassword } from '@/services/api/auth';
import { useAuthForm } from '@/hooks/use-auth-form';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/validations';
import { Spacing, Typography } from '@/constants/design-system';
import { useThemeColors } from '@/hooks/use-theme-color';

export default function ForgotPasswordScreen() {
  const colors = useThemeColors();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const form = useAuthForm(forgotPasswordSchema, {
    email: '',
  });

  const handleResetPassword = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      await resetPassword(data.email.trim());
      setIsSuccess(true);

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
        <Stack.Screen options={{ headerShown: false }} />
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
                <ThemedText style={styles.maskedEmail}>
                  {maskEmail(form.getValues().email)}
                </ThemedText>
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
      <Stack.Screen options={{ headerShown: false }} />
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
          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Email"
                leftIcon="mail-outline"
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  form.clearErrors('email');
                }}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={form.errors.email?.message}
              />
            )}
          />

          <View style={styles.resetButton}>
            <AnimatedButton
              onPress={form.handleSubmit(handleResetPassword)}
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

// Keep existing styles unchanged
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors

**Step 3: Commit**

```bash
git add mobile-app/app/auth/forgot-password.tsx
git commit -m "refactor: convert forgot-password form to react-hook-form + Zod"
```

---

## Verification

### Task 10: Final Verification

**Step 1: Full TypeScript check**

Run:
```bash
cd mobile-app && npx tsc --noEmit
```

Expected: No type errors across the entire project

**Step 2: Verify all new files exist**

Run:
```bash
ls -la mobile-app/validations/
ls -la mobile-app/hooks/use-auth-form.ts
ls -la mobile-app/components/auth/password-strength-meter.tsx
```

Expected: All files present

**Step 3: Check for duplicate code removal**

Run:
```bash
cd mobile-app && grep -r "EMAIL_REGEX" app/auth/
```

Expected: No results (EMAIL_REGEX should only exist in validations/common.ts)

**Step 4: Final commit**

```bash
git add mobile-app/
git commit -m "refactor: complete auth forms refactoring with react-hook-form + Zod

- Added validation layer with Zod schemas
- Created useAuthForm shared hook
- Added PasswordStrengthMeter component
- Refactored sign-up, sign-in, and forgot-password screens
- Removed duplicate validation logic"
```

---

## Summary

This implementation plan:
1. Installs react-hook-form, Zod, and @hookform/resolvers
2. Creates a `validations/` folder with modular schemas
3. Adds configurable password validation with strength metering
4. Creates a shared `useAuthForm` hook
5. Refactors all three auth screens to use the new patterns
6. Preserves all existing UI/UX (animations, styling)

**Total tasks:** 10
**Estimated time:** 1-2 hours
**Dependencies installed:** react-hook-form, zod, @hookform/resolvers
