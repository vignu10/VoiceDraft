import { router, useNavigation, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Controller } from "react-hook-form";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { OAuthButton } from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  PressableScale,
} from "@/components/ui/animated";
import {
  BorderRadius,
  Palette,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useAuthForm } from "@/hooks/use-auth-form";
import { useAuthStore } from "@/stores";
import { signInSchema } from "@/validations";

export default function SignInScreen() {
  const navigation = useNavigation();
  const { signInUser, isLoading, error, clearError } = useAuthStore();

  const form = useAuthForm(signInSchema, {
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const handleSignIn = async (data: { email: string; password: string }) => {
    clearError();

    try {
      await signInUser(data.email.trim(), data.password);
    } catch {
      Alert.alert("Sign In Failed", error || "Invalid email or password");
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "linkedin") => {
    clearError();

    try {
      await useAuthStore.getState().signInWithOAuth(provider);
    } catch {
      Alert.alert(
        "OAuth Failed",
        error || "Failed to sign in with " + provider,
      );
    }
  };

  return (
    // @ts-ignore - SafeAreaView needs flex: 1 to expand
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {/* Logo/Illustration area */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <ThemedText style={styles.logoText}>V</ThemedText>
            </View>
            <ThemedText style={styles.title}>Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to your account
            </ThemedText>
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
                rightIcon={showPassword ? "eye-outline" : "eye-off-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                autoComplete="password"
                error={form.errors.password?.message}
              />
            )}
          />

          <PressableScale onPress={() => router.push("/auth/forgot-password")}>
            <ThemedText style={styles.forgotPassword}>
              Forgot Password?
            </ThemedText>
          </PressableScale>

          <View style={styles.signInButton}>
            <AnimatedButton
              onPress={form.handleSubmit(handleSignIn as any)}
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
              onPress={() => handleOAuthSignIn("google")}
              isLoading={isLoading}
            />
          </View>
          <View style={styles.oauthButton}>
            <OAuthButton
              provider="linkedin"
              onPress={() => handleOAuthSignIn("linkedin")}
              isLoading={isLoading}
            />
          </View>
        </Animated.View>

        {/* Sign Up Link */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.footer}
        >
          <ThemedText style={styles.footerText}>
            Don&apos;t have an account?{" "}
          </ThemedText>
          <PressableScale onPress={() => router.replace("/auth/sign-up")}>
            <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1 removed - outer View wrapper provides flex behavior
  },
  scrollContent: {
    padding: Spacing[5],
    paddingTop: Spacing[10],
  },
  backButton: {
    position: "absolute",
    top: Spacing[6],
    left: Spacing[5],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing[8],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius["3xl"],
    backgroundColor: Palette.periwinkle[500],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing[4],
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: Palette.white,
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
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
    color: Palette.periwinkle[500],
    textAlign: "right",
    marginBottom: Spacing[4],
  },
  signInButton: {
    marginTop: Spacing[2],
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing[6],
  },
  footerText: {
    fontSize: Typography.fontSize.base,
  },
  signUpLink: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.periwinkle[500],
  },
});
