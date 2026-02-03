import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-color';

interface WaveformProps {
  levels: number[];
  isRecording: boolean;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barCount?: number;
}

function WaveformBar({ level, maxHeight }: { level: number; maxHeight: number }) {
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
}

export function Waveform({
  levels,
  isRecording,
  height = 100,
  barWidth = 4,
  barGap = 3,
  barCount = 40,
}: WaveformProps) {
  const backgroundColor = useThemeColor({}, 'background');

  // Pad or slice levels to match barCount
  const displayLevels = [...Array(barCount)].map((_, i) => {
    const levelIndex = levels.length - barCount + i;
    if (levelIndex >= 0 && levelIndex < levels.length) {
      return levels[levelIndex];
    }
    return isRecording ? 0.1 : 0.05; // Minimum bar height
  });

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
}

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
