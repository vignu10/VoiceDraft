import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Rect, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoIconProps {
  size?: number;
  animate?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 128,
  animate = false
}) => {
  // TODO: Add animations in next task
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 480 480">
        <Defs>
          <LinearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#AFA9EC" stopOpacity={1} />
            <Stop offset="50%" stopColor="#9FE1CB" stopOpacity={1} />
            <Stop offset="100%" stopColor="#5DCAA5" stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect x="0" y="0" width="480" height="480" rx="108" fill="#121210"/>

        {/* Sound wave bars */}
        <G x={68} y={112}>
          <Rect x="0"   y="50" width="14" height="64" rx="7" fill="url(#waveGrad)" opacity={0.55}/>
          <Rect x="32"  y="24" width="14" height="116" rx="7" fill="url(#waveGrad)" opacity={0.70}/>
          <Rect x="64"  y="0"  width="14" height="164" rx="7" fill="url(#waveGrad)" opacity={0.85}/>
          <Rect x="96"  y="16" width="14" height="132" rx="7" fill="url(#waveGrad)" opacity={0.80}/>
          <Rect x="128" y="40" width="14" height="84"  rx="7" fill="url(#waveGrad)" opacity={0.60}/>
        </G>

        {/* Arrow */}
        <Path d="M236 240 L256 240" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" opacity={0.5}/>
        <Path d="M252 232 L262 240 L252 248" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>

        {/* Text lines */}
        <G x={278} y={130}>
          <Rect x="0" y="0"   width="124" height="10" rx="5" fill="#EEEDFE" opacity={0.85}/>
          <Rect x="0" y="32"  width="94"  height="10" rx="5" fill="#CECBF6" opacity={0.65}/>
          <Rect x="0" y="64"  width="112" height="10" rx="5" fill="#CECBF6" opacity={0.55}/>
          <Rect x="0" y="96"  width="72"  height="10" rx="5" fill="#AFA9EC" opacity={0.45}/>
          <Rect x="0" y="128" width="124" height="10" rx="5" fill="#CECBF6" opacity={0.60}/>
          <Rect x="0" y="160" width="86"  height="10" rx="5" fill="#AFA9EC" opacity={0.40}/>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
