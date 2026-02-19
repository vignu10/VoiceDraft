import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/animated';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing, BorderRadius } from '@/constants/design-system';

export type OAuthProvider = 'google' | 'linkedin' | 'github' | 'apple';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const providerConfig: Record<
  OAuthProvider,
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
> = {
  google: { icon: 'logo-google', label: 'Continue with Google', color: '#DB4437' },
  linkedin: { icon: 'logo-linkedin', label: 'Continue with LinkedIn', color: '#0077B5' },
  github: { icon: 'logo-github', label: 'Continue with GitHub', color: '#333333' },
  apple: { icon: 'logo-apple', label: 'Continue with Apple', color: '#000000' },
};

export function OAuthButton({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
}: OAuthButtonProps) {
  const colors = useThemeColors();
  const config = providerConfig[provider];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || isLoading}
      hapticStyle="light"
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        (disabled || isLoading) && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} style={styles.loader} />
        ) : (
          <>
            <Ionicons name={config.icon} size={22} color={config.color} style={styles.icon} />
            <ThemedText
              style={[
                styles.text,
                {
                  color: colors.text,
                  fontSize: Typography.fontSize.base,
                },
              ]}
            >
              {config.label}
            </ThemedText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    height: 52,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
  icon: {
    width: 24,
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
  },
  disabled: {
    opacity: 0.5,
  },
});
