import React from 'react';
import { View, StyleSheet } from 'react-native';
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
          disableHardwareAcceleration={true}
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
