import { useRef, useCallback } from 'react';
import { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';

interface UseScrollGateOptions {
  threshold?: number; // 0-1, default 0.5 (50%)
  onTrigger: () => void;
}

interface UseScrollGateResult {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetTrigger: () => void;
}

export function useScrollGate(
  options: UseScrollGateOptions
): UseScrollGateResult {
  const { threshold = 0.5, onTrigger } = options;

  const hasTriggered = useRef(false);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        const { contentHeight, layoutMeasurement } = event;

        const maxScroll = contentHeight - layoutMeasurement.height;
        if (maxScroll <= 0) return;

        const scrollPercentage = event.contentOffset.y / maxScroll;

        if (scrollPercentage > threshold && !hasTriggered.current) {
          hasTriggered.current = true;
          runOnJS(onTrigger)();
        }
      },
    },
    [threshold, onTrigger]
  );

  const resetTrigger = useCallback(() => {
    hasTriggered.current = false;
  }, []);

  return { scrollHandler, resetTrigger };
}
