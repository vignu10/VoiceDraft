import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './pressable-scale';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing, BorderRadius } from '@/constants/design-system';
import { Springs, Stagger } from '@/constants/animations';

interface AnimatedListItemProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  onPress?: () => void;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

export function AnimatedListItem({
  children,
  title,
  subtitle,
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  onPress,
  delay = 0,
  style,
  showDivider = true,
}: AnimatedListItemProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, Springs.list));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 1],
            [-20, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const content = children || (
    <View style={styles.contentRow}>
      {(leftIcon || leftElement) && (
        <View style={styles.leftSection}>
          {leftIcon ? (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name={leftIcon} size={20} color={colors.primary} />
            </View>
          ) : (
            leftElement
          )}
        </View>
      )}

      <View style={styles.textSection}>
        {title && (
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {title}
          </ThemedText>
        )}
        {subtitle && (
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>

      {(rightIcon || rightElement) && (
        <View style={styles.rightSection}>
          {rightIcon ? (
            <Ionicons name={rightIcon} size={20} color={colors.textTertiary} />
          ) : (
            rightElement
          )}
        </View>
      )}
    </View>
  );

  const itemContent = (
    <Animated.View
      style={[
        styles.container,
        showDivider && {
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        animatedStyle,
        style,
      ]}
    >
      {content}
    </Animated.View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scale={0.99}>
        {itemContent}
      </PressableScale>
    );
  }

  return itemContent;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing[3.5],
    paddingHorizontal: Spacing[4],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: Spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: Spacing[3],
  },
});
