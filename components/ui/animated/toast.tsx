import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  SlideInUp,
  SlideOutUp,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';
import { Duration, Springs } from '@/constants/animations';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  show: (toast: Omit<ToastData, 'id'>) => void;
  hide: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => show({ type: 'success', title, message }),
    [show]
  );

  const error = useCallback(
    (title: string, message?: string) => show({ type: 'error', title, message }),
    [show]
  );

  const warning = useCallback(
    (title: string, message?: string) => show({ type: 'warning', title, message }),
    [show]
  );

  const info = useCallback(
    (title: string, message?: string) => show({ type: 'info', title, message }),
    [show]
  );

  return (
    <ToastContext.Provider value={{ show, hide, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hide} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onHide: (id: string) => void;
}

function ToastContainer({ toasts, onHide }: ToastContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { top: insets.top + Spacing[2] },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </View>
  );
}

interface ToastProps {
  toast: ToastData;
  onHide: (id: string) => void;
}

export function Toast({ toast, onHide }: ToastProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(0);

  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success,
          bg: colors.successLight,
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: colors.error,
          bg: colors.errorLight,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: colors.warning,
          bg: colors.warningLight,
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          color: colors.info,
          bg: colors.infoLight,
        };
    }
  };

  const config = getConfig();
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    // Auto hide after duration
    const timeout = setTimeout(() => {
      onHide(toast.id);
    }, duration);

    return () => clearTimeout(timeout);
  }, [toast.id, duration, onHide]);

  // Progress bar animation
  useEffect(() => {
    progress.value = withTiming(1, { duration });
  }, [duration, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${(1 - progress.value) * 100}%`,
  }));

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(20).stiffness(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={[
        styles.toast,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        Shadows.lg,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {toast.title}
        </ThemedText>
        {toast.message && (
          <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
            {toast.message}
          </ThemedText>
        )}
      </View>

      {/* Action or Close */}
      {toast.action ? (
        <Pressable onPress={toast.action.onPress} style={styles.action}>
          <ThemedText style={[styles.actionText, { color: colors.primary }]}>
            {toast.action.label}
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable onPress={() => onHide(toast.id)} style={styles.close}>
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </Pressable>
      )}

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: config.color },
            progressStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing[4],
    right: Spacing[4],
    zIndex: 9999,
    gap: Spacing[2],
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  action: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  close: {
    padding: Spacing[2],
    marginLeft: Spacing[2],
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  progressBar: {
    height: '100%',
  },
});
