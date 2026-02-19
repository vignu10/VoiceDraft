/**
 * Loading Overlay - Fullscreen loading indicator
 * Use for blocking operations that prevent user interaction
 */

import React from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/design-system';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0-100 for progress indication
}

export function LoadingOverlay({
  visible,
  message = 'Loading...',
  progress,
}: LoadingOverlayProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      testID="loading-overlay"
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            { backgroundColor: colors.surface },
          ]}
        >
          {/* Activity Indicator */}
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.spinner}
          />

          {/* Message */}
          <ThemedText
            style={[styles.message, { color: colors.text }]}
          >
            {message}
          </ThemedText>

          {/* Progress Bar (if provided) */}
          {progress !== undefined && (
            <>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, Math.max(0, progress))}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {Math.round(progress)}%
              </ThemedText>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  content: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 300,
    ...StyleSheet.absoluteFillObject,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: Spacing[4],
  },
  message: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    includeFontPadding: false,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: Spacing[4],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing[2],
    includeFontPadding: false,
  },
});
