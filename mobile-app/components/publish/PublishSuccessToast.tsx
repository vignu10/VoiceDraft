import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, Text, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/design-system';

interface PublishSuccessToastProps {
  visible: boolean;
  postUrl: string;
  onViewPress: () => void;
  onSharePress: () => void;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

export function PublishSuccessToast({
  visible,
  postUrl,
  onViewPress,
  onSharePress,
  onDismiss,
}: PublishSuccessToastProps) {
  const [copiedText, setCopiedText] = useState<'Copied!' | ''>('');

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
      const timer = setTimeout(() => { handleDismiss(); }, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    'worklet';
    translateY.value = withSpring(-100, { damping: 15 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const handleCopyUrl = async () => {
    await Clipboard.setStringAsync(postUrl);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedText('Copied!');
    setTimeout(() => setCopiedText(''), 2000);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable onPress={handleCopyUrl} style={styles.toastContent}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Published!</Text>
          <Text style={styles.url} numberOfLines={2}>
            {postUrl.replace('https://', '').replace('http://', '')}
          </Text>
          <Text style={styles.hint}>{copiedText || 'Tap to copy URL'}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onViewPress} style={styles.actionButton}>
            <Ionicons name="open-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View</Text>
          </Pressable>
          <Pressable onPress={onSharePress} style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Share</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: Spacing[4],
  },
  toastContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadows.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: { marginRight: Spacing[3] },
  content: { flex: 1 },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#10B981',
    marginBottom: Spacing[1],
  },
  url: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#1F2937',
    marginBottom: Spacing[1],
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#3B82F6',
  },
});
