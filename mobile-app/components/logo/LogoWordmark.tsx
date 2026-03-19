import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

const fontSizeMap = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 48
};

const taglineSizeMap = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18
};

export const LogoWordmark: React.FC<LogoWordmarkProps> = ({
  size = 'md',
  showTagline = false
}) => {
  const { dark } = useTheme();
  const isDark = dark === true || dark === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.wordmarkRow}>
        <Text style={[styles.voiceText, { fontSize: fontSizeMap[size], color: isDark ? '#F0EDE6' : '#121210' }]}>
          Voice
        </Text>
        <Text style={[styles.draftText, { fontSize: fontSizeMap[size], color: '#7F77DD' }]}>
          Scribe
        </Text>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: taglineSizeMap[size], color: isDark ? '#73726c' : '#666666' }]}>
          Voice to blog, powered by AI
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceText: {
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  draftText: {
    fontWeight: '600',
    letterSpacing: -0.5,
    marginLeft: 4,
  },
  tagline: {
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
