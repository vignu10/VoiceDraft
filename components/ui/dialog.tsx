import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { ScaleIn, PressableScale } from '@/components/ui/animated';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';
import { Springs } from '@/constants/animations';

const AnimatedView = Animated.View;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dialog types and variants
export type DialogVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';
export type DialogIconName = keyof typeof Ionicons.glyphMap;

export interface DialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: DialogIconName;
  variant?: DialogVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => Promise<boolean>;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

// Provider component
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const resolveRef = React.useRef<(value: boolean) => void | undefined>(undefined);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog(options);
      setVisible(true);
      resolveRef.current = resolve;
    });
  }, []);

  const hideDialog = useCallback(() => {
    setVisible(false);
    setDialog(null);
  }, []);

  const handleConfirm = async () => {
    if (dialog?.onConfirm) {
      await dialog.onConfirm();
    }
    resolveRef.current?.(true);
    hideDialog();
  };

  const handleCancel = async () => {
    if (dialog?.onCancel) {
      await dialog.onCancel();
    }
    resolveRef.current?.(false);
    hideDialog();
  };

  const value = { showDialog, hideDialog };

  // Animate in/out
  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, Springs.snappy);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const dialogAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Dialog
        visible={visible}
        dialog={dialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        containerStyle={containerAnimatedStyle}
        dialogStyle={dialogAnimatedStyle}
      />
    </DialogContext.Provider>
  );
}

// Hook to use dialog
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

// Dialog component
function Dialog({
  visible,
  dialog,
  onConfirm,
  onCancel,
  containerStyle,
  dialogStyle,
}: {
  visible: boolean;
  dialog: DialogOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
  containerStyle: any;
  dialogStyle: any;
}) {
  const colors = useThemeColors();

  if (!visible || !dialog) return null;

  const variant = dialog.variant || 'default';
  const icon = dialog.icon || getDefaultIcon(variant);
  const confirmText = dialog.confirmText || getDefaultConfirmText(variant);
  const cancelText = dialog.cancelText || 'Cancel';

  const variantColors = getVariantColors(variant, colors);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <AnimatedView style={[styles.overlay, containerStyle]}>
        <Pressable style={styles.pressableOverlay} onPress={onCancel}>
          <ScaleIn delay={0}>
            <Pressable style={styles.dialogContainer} onPress={(e) => e.stopPropagation()}>
              <AnimatedView
                style={[
                  styles.dialog,
                  {
                    backgroundColor: colors.surface,
                    borderColor: variantColors.accent,
                    ...Shadows.xl,
                  },
                  dialogStyle,
                ]}
              >
                {/* Accent bar */}
                <View style={[styles.accentBar, { backgroundColor: variantColors.accent }]} />

                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: variantColors.lightBg }]}>
                  <Ionicons name={icon} size={36} color={variantColors.accent} />
                </View>

                {/* Title */}
                <ThemedText style={[styles.title, { color: variantColors.accent }]}>
                  {dialog.title}
                </ThemedText>

                {/* Message */}
                {dialog.message && (
                  <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
                    {dialog.message}
                  </ThemedText>
                )}

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <PressableScale
                    onPress={onCancel}
                    haptic={false}
                    style={[
                      styles.button,
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                  >
                    <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                      {cancelText}
                    </ThemedText>
                  </PressableScale>

                  <PressableScale
                    onPress={onConfirm}
                    haptic={variant === 'destructive'}
                    style={[
                      styles.button,
                      styles.confirmButton,
                      {
                        backgroundColor: variantColors.accent,
                        ...Shadows.md,
                      },
                    ]}
                  >
                    {variant === 'destructive' && (
                      <Ionicons name="trash-outline" size={18} color={colors.textInverse} />
                    )}
                    {variant === 'warning' && (
                      <Ionicons name="warning-outline" size={18} color={colors.textInverse} />
                    )}
                    <ThemedText
                      style={[styles.buttonText, styles.confirmButtonText, { color: colors.textInverse }]}
                    >
                      {confirmText}
                    </ThemedText>
                  </PressableScale>
                </View>
              </AnimatedView>
            </Pressable>
          </ScaleIn>
        </Pressable>
      </AnimatedView>
    </Modal>
  );
}

// Helper functions
function getDefaultIcon(variant: DialogVariant): DialogIconName {
  switch (variant) {
    case 'destructive':
      return 'warning';
    case 'warning':
      return 'alert-circle';
    case 'success':
      return 'checkmark-circle';
    case 'info':
      return 'information-circle';
    default:
      return 'help-circle';
  }
}

function getDefaultConfirmText(variant: DialogVariant): string {
  switch (variant) {
    case 'destructive':
      return 'Discard';
    case 'warning':
      return 'Continue';
    case 'success':
      return 'Done';
    case 'info':
      return 'Got it';
    default:
      return 'Confirm';
  }
}

function getVariantColors(
  variant: DialogVariant,
  colors: ReturnType<typeof useThemeColors>
): { accent: string; lightBg: string } {
  switch (variant) {
    case 'destructive':
      return { accent: colors.error, lightBg: colors.errorLight };
    case 'warning':
      return { accent: colors.warning, lightBg: colors.warningLight };
    case 'success':
      return { accent: colors.success, lightBg: colors.successLight };
    case 'info':
      return { accent: colors.info, lightBg: colors.infoLight };
    default:
      return { accent: colors.primary, lightBg: colors.primaryLight };
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  pressableOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH * 0.9,
    alignItems: 'center',
  },
  dialog: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[8],
    borderWidth: 1,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: Spacing[6],
    right: Spacing[6],
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing[5],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: 'center',
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  message: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing[2],
    marginBottom: Spacing[7],
    includeFontPadding: false,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    minHeight: 52,
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.extrabold,
  },
});
