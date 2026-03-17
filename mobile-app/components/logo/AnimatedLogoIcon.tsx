import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LogoIcon as StaticLogoIcon } from './LogoIcon';

interface AnimatedLogoIconProps {
  size?: number;
}

export const AnimatedLogoIcon: React.FC<AnimatedLogoIconProps> = ({
  size = 128
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    const entranceAnim = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    entranceAnim.start();

    // Pulse animation (idle)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start pulse after entrance
    setTimeout(() => {
      pulseLoop.start();
    }, 800);

    return () => {
      entranceAnim.stop();
      pulseLoop.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ],
        },
      ]}
    >
      <StaticLogoIcon size={size} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
