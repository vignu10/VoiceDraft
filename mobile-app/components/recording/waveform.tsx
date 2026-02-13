import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { memo } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';

interface WaveformProps {
  levels: number[];
  isRecording: boolean;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barCount?: number;
}

// Memoized waveform bar for better performance
const WaveformBar = memo(function WaveformBar({ level, maxHeight }: { level: number; maxHeight: number }) {
  const tintColor = useThemeColor({}, 'tint');

  const animatedStyle = useAnimatedStyle(() => {
    const height = Math.max(4, level * maxHeight);
    return {
      height: withSpring(height, {
        damping: 15,
        stiffness: 300,
      }),
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        { backgroundColor: tintColor },
      ]}
    />
  );
});

export const Waveform = memo(function Waveform({
  levels,
  isRecording,
  height = 100,
  barWidth = 4,
  barGap = 3,
  barCount = 20, // Reduced from 40 to 20 for better performance
}: WaveformProps) {
  const backgroundColor = useThemeColor({}, 'background');

  // Pad or slice levels to match barCount
  // Memoize this calculation to avoid recreating array on every render
  const displayLevels = levels.length > 0
    ? levels.slice(-barCount).concat(Array(Math.max(0, barCount - levels.length)).fill(isRecording ? 0.1 : 0.05))
    : Array(barCount).fill(isRecording ? 0.1 : 0.05);

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View style={styles.barsContainer}>
        {displayLevels.map((level, index) => (
          <View
            key={index}
            style={[styles.barWrapper, { width: barWidth, marginHorizontal: barGap / 2 }]}
          >
            <WaveformBar level={level} maxHeight={height * 0.8} />
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
  },
});
