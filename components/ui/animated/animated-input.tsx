import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TextInputProps,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing, BorderRadius } from '@/constants/design-system';
import { Duration, Springs, Easings } from '@/constants/animations';

interface AnimatedInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  hint?: string;
}

export function AnimatedInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  hint,
  value,
  onFocus,
  onBlur,
  ...props
}: AnimatedInputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const focusProgress = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const labelPosition = useSharedValue(value ? 1 : 0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, Springs.snappy);
    labelPosition.value = withSpring(1, Springs.snappy);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withSpring(0, Springs.snappy);
    if (!value) {
      labelPosition.value = withSpring(0, Springs.snappy);
    }
    onBlur?.(e);
  };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.error
      : focusProgress.value
        ? colors.primary
        : colors.inputBorder,
    borderWidth: focusProgress.value ? 2 : 1.5,
    transform: [
      {
        translateX: errorShake.value,
      },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelPosition.value * -28 },
      { scale: 1 - labelPosition.value * 0.15 },
    ],
    color: error
      ? colors.error
      : isFocused
        ? colors.primary
        : colors.textSecondary,
  }));

  // Trigger shake animation when error appears
  React.useEffect(() => {
    if (error) {
      errorShake.value = withSpring(0, { damping: 4, stiffness: 300 }, () => {
        errorShake.value = 0;
      });
      errorShake.value = 10;
    }
  }, [error, errorShake]);

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.inputBg },
            containerStyle,
          ]}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary : colors.textTertiary}
              style={styles.leftIcon}
            />
          )}

          <View style={styles.inputWrapper}>
            {label && (
              <Animated.Text
                style={[
                  styles.label,
                  labelStyle,
                  { backgroundColor: colors.inputBg },
                ]}
              >
                {label}
              </Animated.Text>
            )}
            <TextInput
              ref={inputRef}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={[
                styles.input,
                { color: colors.text },
                leftIcon && styles.inputWithLeftIcon,
                rightIcon && styles.inputWithRightIcon,
              ]}
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              {...props}
            />
          </View>

          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIcon}
              hitSlop={10}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
        </Animated.View>
      </Pressable>

      {(error || hint) && (
        <ThemedText
          style={[
            styles.helperText,
            { color: error ? colors.error : colors.textTertiary },
          ]}
        >
          {error || hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing[4],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    minHeight: 56,
    paddingHorizontal: Spacing[4],
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontSize: Typography.fontSize.base,
    paddingHorizontal: Spacing[1],
  },
  input: {
    fontSize: Typography.fontSize.base,
    paddingVertical: Spacing[3],
  },
  inputWithLeftIcon: {
    marginLeft: Spacing[1],
  },
  inputWithRightIcon: {
    marginRight: Spacing[1],
  },
  leftIcon: {
    marginRight: Spacing[2],
  },
  rightIcon: {
    marginLeft: Spacing[2],
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing[1],
    marginLeft: Spacing[1],
  },
});
