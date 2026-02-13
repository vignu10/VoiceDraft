/**
 * Circular Tab Bar Navigation
 * Clean circular navigation with audio-reactive elements
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useThemeColors } from '@/hooks/use-theme-color';
import { useRecordingStore } from '@/stores';
import { Spacing } from '@/constants/design-system';
import { Springs } from '@/constants/animations';

interface TabItem {
  name: string;
  icon: string;
  route: string;
  position: 'left' | 'center' | 'right';
}

const TABS: TabItem[] = [
  { name: 'Library', icon: 'library', route: '/library', position: 'left' },
  { name: 'Record', icon: 'mic', route: '/', position: 'center' },
  { name: 'Settings', icon: 'settings', route: '/settings', position: 'right' },
];

// Animated Circular Tab Button
function CircularTabButton({
  tab,
  isFocused,
  isRecording,
  meteringLevel = 0,
  onPress,
}: {
  tab: TabItem;
  isFocused: boolean;
  isRecording: boolean;
  meteringLevel?: number;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(isFocused ? 1 : 0.85);
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Animate when focused state changes
  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1, Springs.snappy);
      rotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100, easing: Easing.out(Easing.cubic) })
      );
    } else {
      scale.value = withSpring(0.85, Springs.gentle);
    }
  }, [isFocused, scale, rotation]);

  // Pulse to rhythm when recording and on Record tab
  useEffect(() => {
    if (tab.position === 'center' && isRecording) {
      const pulse = () => {
        // Pulse based on metering level for organic feel
        const pulseAmount = 1 + (meteringLevel * 0.15);
        pulseScale.value = withSequence(
          withSpring(pulseAmount, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 150 })
        );
      };

      const interval = setInterval(pulse, 150);
      return () => clearInterval(interval);
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isRecording, meteringLevel, tab.position, pulseScale]);

  const buttonSize = tab.position === 'center' ? 68 : 52;

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Waveform ring for center button when recording
  const waveformAnimatedStyle = useAnimatedStyle(() => {
    if (tab.position !== 'center' || !isRecording) {
      return {
        width: 0,
        height: 0,
        opacity: 0,
      };
    }

    const ringSize = buttonSize + 16 + (meteringLevel * 20);
    return {
      width: ringSize,
      height: ringSize,
      opacity: 0.3 + (meteringLevel * 0.3),
    };
  });

  const isCenter = tab.position === 'center';
  const bgColor = isCenter
    ? (isRecording ? colors.recording : colors.primary)
    : (isFocused ? colors.surface : 'transparent');
  const iconColor = isCenter
    ? colors.textInverse
    : (isFocused ? colors.primary : colors.textMuted);

  return (
    <Pressable onPress={onPress} style={styles.tabContainer}>
      <View style={[styles.tabWrapper, { width: buttonSize + 20 }]}>
        {/* Waveform ring behind center button when recording */}
        {isCenter && (
          <Animated.View
            style={[
              styles.waveformRing,
              waveformAnimatedStyle,
              { backgroundColor: colors.recording },
            ]}
          />
        )}

        <Animated.View style={pulseAnimatedStyle}>
          <Animated.View
            style={[
              styles.tabButton,
              buttonAnimatedStyle,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: bgColor,
                borderWidth: isCenter ? 0 : 2,
                borderColor: isFocused ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={tab.icon as any}
              size={isCenter ? 28 : 22}
              color={iconColor}
            />
          </Animated.View>
        </Animated.View>

        {/* Recording dot when on Record tab */}
        {isCenter && isRecording && (
          <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
        )}
      </View>
    </Pressable>
  );
}

export function CircularTabBar() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();

  const [currentRoute, setCurrentRoute] = useState('/');
  const [meteringLevel, setMeteringLevel] = useState(0);

  const isRecording = useRecordingStore((state) => state.isRecording);
  const getMeteringLevels = useRecordingStore((state) => state.getMeteringLevels);

  // Track current route
  useEffect(() => {
    const lastSegment = segments[segments.length - 1];
    setCurrentRoute((lastSegment as string) === '' ? '/' : `/${lastSegment as string}`);
  }, [segments]);

  // Animate metering levels when recording
  useEffect(() => {
    if (!isRecording) {
      setMeteringLevel(0);
      return;
    }

    const interval = setInterval(() => {
      const levels = getMeteringLevels();
      if (levels.length > 0) {
        // Get the most recent level
        const avgLevel = levels[levels.length - 1];
        setMeteringLevel(avgLevel);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, getMeteringLevels]);

  const handleTabPress = (tab: TabItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(tab.route as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : insets.bottom + 12 }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 40}
        tint={colors.isDark ? 'dark' : 'light'}
        style={[
          styles.navigationBar,
          {
            backgroundColor: colors.isDark
              ? colors.surface
              : colors.surface,
            borderTopColor: colors.border,
            shadowColor: colors.shadowColorStrong,
          },
        ]}
      >
        {TABS.map((tab) => (
          <CircularTabButton
            key={tab.name}
            tab={tab}
            isFocused={currentRoute === tab.route}
            isRecording={isRecording}
            meteringLevel={meteringLevel}
            onPress={() => handleTabPress(tab)}
          />
        ))}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[4],
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderRadius: 32,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 88,
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waveformRing: {
    position: 'absolute',
    borderRadius: 999,
    pointerEvents: 'none',
  },
  recordingDot: {
    position: 'absolute',
    bottom: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
