import { ThemedView } from '@/components/themed-view';
import { ScrollTriggeredPrompt } from '@/components/ui/scroll-triggered-prompt';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import { useCallback, useRef, useState } from 'react';

const AnimatedScrollView = Animated.ScrollView;

interface GuestDraftScrollGateProps {
  children: React.ReactNode;
}

export function GuestDraftScrollGate({ children }: GuestDraftScrollGateProps) {
  const [promptVisible, setPromptVisible] = useState(false);
  const hasTriggeredRef = useRef(false);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const scrollThreshold = 0.5; // 50%

  const showPrompt = useCallback(() => {
    setPromptVisible(true);
  }, []);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      if (hasTriggeredRef.current) return;

      const { contentSize, layoutMeasurement, contentOffset } = event;
      const maxScroll = contentSize.height - layoutMeasurement.height;

      if (maxScroll <= 0) return;

      const scrollPercentage = contentOffset.y / maxScroll;

      if (scrollPercentage > scrollThreshold) {
        hasTriggeredRef.current = true;
        runOnJS(showPrompt)();
      }
    },
  }, [scrollThreshold, showPrompt]);

  const handleDismiss = useCallback(() => {
    setPromptVisible(false);
    hasTriggeredRef.current = false;
    // @ts-expect-error - Ref has scrollTo method
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <AnimatedScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        scrollEnabled={!promptVisible}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {children}
      </AnimatedScrollView>

      {/* Full-screen blur overlay - only shown when prompt is visible */}
      {promptVisible && (
        <View style={styles.blurOverlay} pointerEvents="none">
          <BlurView intensity={100} tint="dark" style={styles.blur}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            />
          </BlurView>
        </View>
      )}

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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  blur: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
