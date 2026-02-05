import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemeColors, Shadows, BorderRadius } from '@/constants/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Springs, Duration } from '@/constants/animations';
import { Ionicons } from '@expo/vector-icons';

// Animated Tab Icon Component
function AnimatedTabIcon({ focused, name, color }: { focused: boolean; name: string; color: string }) {
  const scale = useSharedValue(focused ? 1 : 0.8);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1, Springs.snappy);
      rotate.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100, easing: Easing.out(Easing.cubic) })
      );
    } else {
      scale.value = withSpring(0.8, Springs.gentle);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {name === 'mic.fill' || name === 'mic' ? (
        <AnimatedMicIcon focused={focused} color={color} />
      ) : (
        <IconSymbol size={focused ? 25 : 23} name={name as any} color={color} />
      )}
    </Animated.View>
  );
}

// Special animated mic icon
function AnimatedMicIcon({ focused, color }: { focused: boolean; color: string }) {
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (focused) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="mic" size={focused ? 25 : 23} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = ThemeColors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.iconMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 83 : 60,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingHorizontal: 4,
          ...Shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 3,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 0,
        },
        // Add smooth transition
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: Duration.pageTransition,
            easing: Easing.out(Easing.cubic),
          },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} name="mic.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} name="doc.text.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
