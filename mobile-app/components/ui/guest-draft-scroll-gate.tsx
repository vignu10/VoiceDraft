import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScrollTriggeredPrompt } from '@/components/ui/scroll-triggered-prompt';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useScrollGate } from '@/hooks/use-scroll-gate';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useRef, useState } from 'react';
import { Spacing, BorderRadius } from '@/constants/design-system';

const AnimatedScrollView = Animated.ScrollView;

interface GuestDraftScrollGateProps {
  children: React.ReactNode;
}

export function GuestDraftScrollGate({ children }: GuestDraftScrollGateProps) {
  const colors = useThemeColors();
  const [promptVisible, setPromptVisible] = useState(false);
  const scrollEnabledRef = useRef(true);

  // Use the scroll gate hook
  const { scrollHandler, resetTrigger } = useScrollGate({
    threshold: 0.5, // 50%
    onTrigger: () => setPromptVisible(true),
  });

  // Scroll handler wrapper that disables scroll when prompt is visible
  const handleScroll = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        if (!scrollEnabledRef.current) return;
        scrollHandler(event);
      },
    },
    [scrollHandler]
  );

  const handleDismiss = () => {
    setPromptVisible(false);
    // User can continue scrolling, but we'll reset trigger so it shows again
    resetTrigger();
    // Navigate back to top of content
    // @ts-expect-error - Ref has scrollTo method
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Re-enable scroll
    scrollEnabledRef.current = true;
  };

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  return (
    <ThemedView style={styles.container}>
      <AnimatedScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {children}
      </AnimatedScrollView>

      {/* Blur overlay for bottom 50% */}
      <View style={styles.blurOverlay} pointerEvents="none">
        <LinearGradient
          colors={['transparent', colors.surface]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />
      </View>

      {/* Scroll-triggered prompt */}
      <ScrollTriggeredPrompt
        visible={promptVisible}
        onDismiss={handleDismiss}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  blurOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%', // Slightly more than 50% for smoother transition
    pointerEvents: 'none',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
