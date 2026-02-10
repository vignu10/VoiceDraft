import { RecordButton, Timer, Waveform } from "@/components/recording";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FadeIn, SlideIn } from "@/components/ui/animated/animated-wrappers";
import { PressableScale } from "@/components/ui/animated/pressable-scale";
import { useDialog } from "@/components/ui/dialog";
import {
  MiniCelebration,
  WelcomeTooltip,
  useDelightToast,
} from "@/components/ui/delight";
import {
  MAX_RECORDING_DURATION,
  MIN_RECORDING_DURATION,
} from "@/constants/config";
import {
  BorderRadius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useThemeColors } from "@/hooks/use-theme-color";
import { recordingService } from "@/services/audio/recording-service";
import { useAchievementsStore, useRecordingStore } from "@/stores";
import {
  formatDuration,
  getContinueDraftMessage,
  getHeroMessage,
  getRecordingHint,
  getRecordingMilestone,
  getRecordingTip,
  getWarmErrorMessage,
} from "@/utils/delight-messages";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom hook for throttled metering levels
function useThrottledMeteringLevels(isRecording: boolean, isPaused: boolean) {
  const [levels, setLevels] = useState<number[]>([]);
  const getMeteringLevels = useRecordingStore((state) => state.getMeteringLevels);
  const lastUpdateRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isRecording || isPaused) {
      setLevels([]);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const updateLevels = () => {
      const now = Date.now();
      // Throttle updates to ~10fps (100ms) instead of 60fps
      if (now - lastUpdateRef.current >= 100) {
        setLevels(getMeteringLevels());
        lastUpdateRef.current = now;
      }
      rafRef.current = requestAnimationFrame(updateLevels);
    };

    rafRef.current = requestAnimationFrame(updateLevels);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isRecording, isPaused, getMeteringLevels]);

  return levels;
}

// Check if audio has meaningful sound levels
function hasAudioActivity(levels: number[]): boolean {
  if (levels.length < 10) return false;
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  return avgLevel > 0.05; // Adjusted threshold for 0-1 range
}

// Unified state card component that adapts to different states
type StateCardType = "resume" | "continueDraft" | "recordingReady";

interface StateCardProps {
  type: StateCardType;
  duration: number;
  lastDraftTitle?: string | null;
  lastDraftKeyword?: string | null;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function StateCard({
  type,
  duration,
  lastDraftTitle,
  lastDraftKeyword,
  onPrimaryAction,
  onSecondaryAction,
  colors,
}: StateCardProps) {
  // Card configuration based on type - memoized to prevent recreation
  const config = useMemo(() => ({
    resume: {
      icon: "play" as const,
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
      title: formatDuration(duration) + " recorded",
      subtitle: getRecordingTip("resume"),
      primaryLabel: "Resume",
      primaryBg: colors.primary,
      primaryIcon: "play" as const,
      secondaryLabel: "Start Fresh",
      showKeyword: false,
    },
    continueDraft: {
      icon: "document-text" as const,
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
      title: lastDraftTitle || "Untitled Draft",
      subtitle: getContinueDraftMessage("subtitles"),
      primaryLabel: "Continue",
      primaryBg: colors.primary,
      primaryIcon: "create" as const,
      secondaryLabel: "Discard",
      showKeyword: true,
    },
    recordingReady: {
      icon: "checkmark-circle" as const,
      iconBg: colors.successLight,
      iconColor: colors.success,
      title: "Recording Saved!",
      subtitle: `${formatDuration(duration)} `,
      primaryLabel: "Continue",
      primaryBg: colors.success,
      primaryIcon: "arrow-forward" as const,
      secondaryLabel: "Discard",
      showKeyword: false,
    },
  }[type]), [type, duration, lastDraftTitle, colors.primaryLight, colors.primary, colors.successLight, colors.success]);

  return (
    <SlideIn direction="up" delay={100}>
      <View
        style={[
          styles.stateCard,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadowColor,
          },
        ]}
        accessibilityLabel={`${config.title} - ${config.subtitle}`}
      >
        {/* Icon */}
        <View
          style={[styles.stateCardIcon, { backgroundColor: config.iconBg }]}
        >
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.stateCardContent}>
          <ThemedText style={[styles.stateCardTitle, { color: colors.text }]}>
            {config.title}
          </ThemedText>
          {config.showKeyword && lastDraftKeyword && (
            <View
              style={[
                styles.keywordTag,
                { backgroundColor: colors.accentLight },
              ]}
            >
              <Ionicons name="pricetag" size={12} color={colors.accent} />
              <ThemedText
                style={[styles.keywordText, { color: colors.accent }]}
              >
                {lastDraftKeyword}
              </ThemedText>
            </View>
          )}
          <ThemedText
            style={[styles.stateCardSubtitle, { color: colors.textSecondary }]}
          >
            {config.subtitle}
          </ThemedText>
        </View>

        {/* Actions */}
        <View style={styles.stateCardActions}>
          {/* Secondary action as text-only link */}
          <PressableScale
            onPress={onSecondaryAction}
            hapticStyle="light"
            accessibilityLabel={config.secondaryLabel}
            style={styles.stateCardSecondaryBtn}
          >
            <ThemedText
              style={[
                styles.stateCardSecondaryText,
                { color: colors.textSecondary },
              ]}
            >
              {config.secondaryLabel}
            </ThemedText>
          </PressableScale>

          {/* Primary action button */}
          <PressableScale
            onPress={onPrimaryAction}
            hapticStyle="medium"
            accessibilityLabel={config.primaryLabel}
            style={[
              styles.stateCardPrimaryBtn,
              {
                backgroundColor: config.primaryBg,
                ...Shadows.glow,
              },
            ]}
          >
            {type !== "recordingReady" && (
              <Ionicons
                name={config.primaryIcon}
                size={18}
                color={colors.textInverse}
              />
            )}
            <ThemedText style={styles.stateCardPrimaryText}>
              {config.primaryLabel}
            </ThemedText>
            {type === "recordingReady" && (
              <Ionicons
                name={config.primaryIcon}
                size={18}
                color={colors.textInverse}
              />
            )}
          </PressableScale>
        </View>
      </View>
    </SlideIn>
  );
}

export default function RecordingScreen() {
  const {
    isRecording,
    isPaused,
    duration,
    audioUri,
    hasExistingRecording,
    lastDraftId,
    lastDraftTitle,
    lastDraftKeyword,
    setRecording,
    setPaused,
    setDuration,
    setAudioUri,
    addMeteringLevel,
    setMeteringLevels,
    reset: resetStore,
    clearExisting,
    markAsExisting,
    clearLastDraft,
  } = useRecordingStore();

  // Use throttled metering levels for smooth waveform rendering
  const meteringLevels = useThrottledMeteringLevels(isRecording, isPaused);

  const colors = useThemeColors();
  const { showDialog } = useDialog();

  const [celebration, setCelebration] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: "",
  });

  // Track timers for cleanup
  const celebrationTimerRef = useRef<number | null>(null);

  // Hero message state for empty ready state
  const [heroMessage, setHeroMessage] = useState("");

  // Recording milestone state
  const [lastMilestone, setLastMilestone] = useState(0);

  // Toast for micro-interactions
  const { showToast } = useDelightToast();

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  // Track recording for achievements
  const recordRecording = useAchievementsStore(
    (state) => state.recordRecording,
  );
  const totalDrafts = useAchievementsStore((state) => state.totalDrafts);
  const isFirstRecording = totalDrafts === 0;

  // Set hero message on mount
  useEffect(() => {
    setHeroMessage(getHeroMessage());
  }, []);

  // Recording milestones - show encouraging messages at 30s, 1min, 2min, etc.
  useEffect(() => {
    if (isRecording && !isPaused) {
      const milestone = getRecordingMilestone(duration);
      if (milestone && duration > lastMilestone) {
        setLastMilestone(duration);
        showToast(milestone, "celebration");
      }
    }
  }, [duration, isRecording, isPaused, lastMilestone, showToast]);

  const processRecording = useCallback(async () => {
    try {
      const result = await recordingService.stopRecording();

      setAudioUri(result.uri);
      setRecording(false);
      setPaused(false);

      // Reset milestone tracking for next recording
      setLastMilestone(0);

      // Show warm celebration for successful recording
      const completionMessages = [
        "Beautiful! Let's turn this into content.",
        "Nice work! That sounded great",
        "Wonderful! Your voice is powerful.",
      ];
      const randomMessage =
        completionMessages[
          Math.floor(Math.random() * completionMessages.length)
        ];

      setCelebration({
        visible: true,
        message: randomMessage,
      });

      // Track recording for achievements
      recordRecording(result.duration);

      // Navigate after celebration - track timer for cleanup
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
      celebrationTimerRef.current = setTimeout(() => {
        setCelebration({ visible: false, message: "" });
        router.push({
          pathname: "/keyword",
          params: { audioUri: result.uri, duration: result.duration },
        });
      }, 1500);
    } catch (error) {
      console.error("Recording error:", error);
      const warmError = getWarmErrorMessage("recordingError");

      Alert.alert(warmError.title, warmError.message, [
        {
          text: "OK",
          onPress: async () => {
            await resetStore();
          },
        },
      ]);
    }
  }, [setAudioUri, setRecording, setPaused, resetStore, recordRecording]);

  const handleStop = useCallback(async () => {
    // Validate minimum duration - use warm message
    if (duration < MIN_RECORDING_DURATION) {
      const warmError = getWarmErrorMessage("tooShort");
      Alert.alert(warmError.title, warmError.message, [{ text: "Got it" }]);
      return;
    }

    // Check for audio activity - use warm message
    // Get the current metering levels from the buffer
    const getMeteringLevels = useRecordingStore.getState().getMeteringLevels;
    const currentLevels = getMeteringLevels();
    if (!hasAudioActivity(currentLevels)) {
      const warmError = getWarmErrorMessage("noAudio");
      Alert.alert(warmError.title, warmError.message, [
        { text: "Try Again", style: "cancel" },
        {
          text: "Continue Anyway",
          onPress: async () => {
            await processRecording();
          },
        },
      ]);
      return;
    }

    await processRecording();
  }, [duration, processRecording]);

  useEffect(() => {
    if (duration >= MAX_RECORDING_DURATION) {
      handleStop();
    }
  }, [duration, handleStop]);

  const handleStartRecording = useCallback(async () => {
    try {
      await recordingService.startRecording(
        (level: number) => addMeteringLevel(level),
        (seconds: number) => setDuration(seconds),
      );
      setRecording(true);
      setPaused(false);
      // Clear the existing recording flag when starting fresh
      if (!hasExistingRecording) {
        setDuration(0);
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      const warmError = getWarmErrorMessage("recordingError");

      Alert.alert(warmError.title, warmError.message, [
        {
          text: "OK",
          onPress: async () => {
            await resetStore();
          },
        },
      ]);
    }
  }, [
    addMeteringLevel,
    setDuration,
    setRecording,
    setPaused,
    resetStore,
    hasExistingRecording,
  ]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await recordingService.resumeRecording();
        setPaused(false);
      } else {
        await recordingService.pauseRecording();
        setPaused(true);
      }
    } catch (error) {
      console.error("Error pausing/resuming:", error);
      const warmError = getWarmErrorMessage("recordingError");

      Alert.alert(warmError.title, warmError.message, [
        {
          text: "OK",
          onPress: async () => {
            await resetStore();
          },
        },
      ]);
    }
  }, [isPaused, setPaused, resetStore]);

  const handleCancel = useCallback(async () => {
    if (isRecording) {
      Alert.alert("Discard Recording?", "Your recording will be lost.", [
        { text: "Keep Recording", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await recordingService.cancelRecording();
            await resetStore();
            router.back();
          },
        },
      ]);
    } else {
      await resetStore();
      router.back();
    }
  }, [isRecording, resetStore]);

  const handleReset = useCallback(async () => {
    const confirmed = await showDialog({
      title: "Reset Recording?",
      message: "This will discard your current recording and you can start fresh.",
      confirmText: "Reset",
      variant: "destructive",
      onConfirm: async () => {
        await recordingService.cancelRecording();
        await resetStore();
      },
    });
    if (confirmed) {
      await recordingService.cancelRecording();
      await resetStore();
    }
  }, [resetStore, showDialog]);

  const handleResume = useCallback(async () => {
    try {
      await recordingService.startRecording(
        (level: number) => addMeteringLevel(level),
        (seconds: number) => setDuration(seconds),
      );
      setRecording(true);
      setPaused(false);
      // Mark that we're continuing the existing recording
      markAsExisting();

      // Show celebration for resuming
      setCelebration({
        visible: true,
        message: getRecordingTip("resume"),
      });

      // Clear previous timer and set new one
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
      celebrationTimerRef.current = setTimeout(() => {
        setCelebration({ visible: false, message: "" });
      }, 1200);
    } catch (error) {
      console.error("Error resuming recording:", error);
      const warmError = getWarmErrorMessage("recordingError");

      Alert.alert(warmError.title, warmError.message, [
        {
          text: "OK",
          onPress: async () => {
            await resetStore();
          },
        },
      ]);
    }
  }, [
    addMeteringLevel,
    setDuration,
    setRecording,
    setPaused,
    resetStore,
    markAsExisting,
  ]);

  const handleStartFresh = useCallback(async () => {
    const confirmed = await showDialog({
      title: "Start Fresh?",
      message: "This will discard your existing recording and begin a new one.",
      confirmText: "Start Fresh",
      variant: "destructive",
      onConfirm: async () => {
        await recordingService.cancelRecording();
        clearExisting();
      },
    });
    if (confirmed) {
      await recordingService.cancelRecording();
      clearExisting();
    }
  }, [clearExisting, showDialog]);

  // Continue Draft handlers
  const handleContinueDraft = useCallback(() => {
    if (lastDraftId) {
      // Show celebration before navigating
      setCelebration({
        visible: true,
        message: getContinueDraftMessage("readyMessages"),
      });

      // Clear previous timer and set new one
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
      celebrationTimerRef.current = setTimeout(() => {
        setCelebration({ visible: false, message: "" });
        router.push({
          pathname: "/draft/[id]",
          params: { id: lastDraftId },
        });
      }, 800);
    }
  }, [lastDraftId]);

  const handleDiscardDraft = useCallback(async () => {
    const confirmed = await showDialog({
      title: "Discard Draft?",
      message: "This will remove the draft and you can start fresh. Your draft will still be available in the library.",
      confirmText: "Discard",
      cancelText: "Keep Draft",
      variant: "destructive",
      onConfirm: () => {
        clearLastDraft();
        showToast(getContinueDraftMessage("discarded"), "info");
      },
    });
    if (confirmed) {
      clearLastDraft();
      showToast(getContinueDraftMessage("discarded"), "info");
    }
  }, [clearLastDraft, showToast, showDialog]);

  // Recording Ready handlers (recording done, waiting for keyword)
  const handleContinueToKeyword = useCallback(() => {
    if (audioUri) {
      router.push({
        pathname: "/keyword",
        params: { audioUri, duration: duration.toString() },
      });
    }
  }, [audioUri, duration]);

  const handleDiscardRecording = useCallback(async () => {
    const confirmed = await showDialog({
      title: "Discard Recording?",
      message: "This will remove your recording and you can start fresh.",
      confirmText: "Discard",
      cancelText: "Keep Recording",
      variant: "destructive",
      onConfirm: () => {
        setAudioUri(null);
        setDuration(0);
        setMeteringLevels([]);
        showToast("Recording discarded", "info");
      },
    });
    if (confirmed) {
      setAudioUri(null);
      setDuration(0);
      setMeteringLevels([]);
      showToast("Recording discarded", "info");
    }
  }, [setAudioUri, setDuration, setMeteringLevels, showToast, showDialog]);

  // Determine if we should show the continue draft card (highest priority)
  const showContinueDraftCard =
    !isRecording &&
    !isPaused &&
    lastDraftId !== null &&
    lastDraftId !== undefined;

  // Determine if we should show the recording ready card (recording done, waiting for keyword)
  const showRecordingReadyCard =
    !isRecording && !isPaused && audioUri !== null && !showContinueDraftCard;

  // Determine if we should show the resume card
  const showResumeCard =
    !isRecording &&
    !isPaused &&
    hasExistingRecording &&
    duration > 0 &&
    !audioUri &&
    !showContinueDraftCard &&
    !showRecordingReadyCard;

  const handleRecordPress = useCallback(() => {
    if (!isRecording) {
      handleStartRecording();
    } else {
      handlePauseResume();
    }
  }, [isRecording, handleStartRecording, handlePauseResume]);

  const getTipText = () => {
    if (showContinueDraftCard) {
      return getContinueDraftMessage("subtitles");
    }
    if (showRecordingReadyCard) {
      return "Your recording is saved!";
    }
    if (showResumeCard) {
      return getRecordingTip("resume");
    }
    if (!isRecording) {
      return getRecordingTip("beforeStart");
    }
    if (isPaused) {
      return getRecordingTip("paused");
    }
    return getRecordingTip("whileRecording");
  };

  return (
    <ThemedView style={styles.container}>
      {/* Celebration overlay */}
      <MiniCelebration
        visible={celebration.visible}
        message={celebration.message}
        icon="checkmark-circle"
        onComplete={() => setCelebration({ visible: false, message: "" })}
      />

      {/* Welcome tooltip for first-time users */}
      <WelcomeTooltip
        visible={
          isFirstRecording &&
          !isRecording &&
          !isPaused &&
          !showResumeCard &&
          !showContinueDraftCard &&
          !showRecordingReadyCard
        }
        message="Tap the microphone to start recording your voice. Speak naturally!"
        position="top"
        delay={800}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <FadeIn>
          <View
            style={styles.header}
            accessibilityLabel={`${isRecording ? (isPaused ? "Recording paused" : "Recording in progress") : "Ready to record"}`}
          >
            <PressableScale
              onPress={handleCancel}
              hapticStyle="light"
              accessibilityLabel="Cancel recording and return to home"
            >
              <ThemedText
                style={[styles.cancelButton, { color: colors.primary }]}
              >
                Cancel
              </ThemedText>
            </PressableScale>
            <View style={styles.titleContainer}>
              {isRecording && !isPaused && (
                <View
                  style={[
                    styles.recordingDot,
                    { backgroundColor: colors.recording },
                  ]}
                  accessibilityLabel="Recording indicator"
                />
              )}
              {isRecording && isPaused && (
                <View
                  style={[
                    styles.recordingDot,
                    { backgroundColor: colors.paused },
                  ]}
                  accessibilityLabel="Paused indicator"
                />
              )}
              <ThemedText style={[styles.title, { color: colors.text }]}>
                {isRecording ? (isPaused ? "Paused" : "Recording") : "Ready"}
              </ThemedText>
            </View>
            <View style={styles.placeholder} />
          </View>
        </FadeIn>

        {/* Content */}
        <View style={styles.content}>
          {/* Hero Message - shown in empty ready state */}
          {!isRecording &&
            !isPaused &&
            !showResumeCard &&
            !showContinueDraftCard &&
            !showRecordingReadyCard && (
              <FadeIn delay={100}>
                <View style={styles.heroContainer}>
                  <ThemedText
                    style={[styles.heroMessage, { color: colors.text }]}
                  >
                    {heroMessage}
                  </ThemedText>
                  <ThemedText
                    style={[styles.heroHint, { color: colors.textSecondary }]}
                  >
                    {getRecordingHint()}
                  </ThemedText>
                </View>
              </FadeIn>
            )}

          {/* Waveform - simplified without border container */}
          <SlideIn direction="up" delay={100}>
            <View
              style={[
                styles.waveformContainer,
                {
                  backgroundColor:
                    isRecording && !isPaused
                      ? colors.recordingLight
                      : colors.backgroundSecondary,
                },
              ]}
              accessibilityLabel={`Audio waveform ${isRecording && !isPaused ? "showing recording levels" : "ready to record"}`}
            >
              <Waveform
                levels={meteringLevels}
                isRecording={isRecording && !isPaused}
                height={120}
              />
            </View>
          </SlideIn>

          {/* Timer - simplified with less vertical space */}
          <SlideIn direction="up" delay={200}>
            <View
              style={styles.timerContainer}
              accessibilityLabel={`Recording duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds`}
            >
              <Timer
                seconds={duration}
                isRecording={isRecording}
                isPaused={isPaused}
              />
            </View>
          </SlideIn>

          {/* Tip - only show when no state card is visible */}
          {!showResumeCard &&
            !showContinueDraftCard &&
            !showRecordingReadyCard && (
              <FadeIn delay={300}>
                <ThemedText
                  style={[styles.tip, { color: colors.textSecondary }]}
                  accessibilityLiveRegion="polite"
                >
                  {getTipText()}
                </ThemedText>
              </FadeIn>
            )}
        </View>

        {/* Unified State Card - adapts to current state */}
        {showResumeCard && (
          <StateCard
            type="resume"
            duration={duration}
            onPrimaryAction={handleResume}
            onSecondaryAction={handleStartFresh}
            colors={colors}
          />
        )}

        {showContinueDraftCard && (
          <StateCard
            type="continueDraft"
            duration={duration}
            lastDraftTitle={lastDraftTitle}
            lastDraftKeyword={lastDraftKeyword}
            onPrimaryAction={handleContinueDraft}
            onSecondaryAction={handleDiscardDraft}
            colors={colors}
          />
        )}

        {showRecordingReadyCard && (
          <StateCard
            type="recordingReady"
            duration={duration}
            onPrimaryAction={handleContinueToKeyword}
            onSecondaryAction={handleDiscardRecording}
            colors={colors}
          />
        )}

        {/* Controls */}
        <SlideIn direction="up" delay={150}>
          <View
            style={[
              styles.controls,
              (showResumeCard ||
                showContinueDraftCard ||
                showRecordingReadyCard) &&
                styles.controlsHidden,
            ]}
            accessibilityLabel="Recording controls"
          >
            {/* Main Record/Pause Button */}
            <RecordButton
              isRecording={isRecording}
              isPaused={isPaused}
              onPress={handleRecordPress}
              size={80}
            />

            {/* Action Buttons */}
            {isRecording && (
              <FadeIn delay={100}>
                <View
                  style={styles.actionButtons}
                  accessibilityLabel="Recording action buttons"
                >
                  {/* Reset Button */}
                  <PressableScale
                    onPress={handleReset}
                    hapticStyle="medium"
                    accessibilityLabel="Reset recording - Start over"
                    style={[
                      styles.resetButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="refresh" size={20} color={colors.text} />
                    <ThemedText
                      style={[styles.resetButtonText, { color: colors.text }]}
                    >
                      Reset
                    </ThemedText>
                  </PressableScale>

                  {/* Done Button */}
                  <PressableScale
                    onPress={handleStop}
                    hapticStyle="medium"
                    accessibilityLabel="Done - Finish and save recording"
                    style={[
                      styles.doneButton,
                      {
                        backgroundColor: colors.success,
                        ...Shadows.md,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={colors.textInverse}
                    />
                    <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                  </PressableScale>
                </View>
              </FadeIn>
            )}
          </View>
        </SlideIn>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    minHeight: 60,
  },
  cancelButton: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  heroContainer: {
    alignItems: "center",
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[4],
  },
  heroMessage: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: "center",
    lineHeight: Typography.fontSize["3xl"] * Typography.lineHeight.tight,
    marginBottom: Spacing[2],
    includeFontPadding: false,
  },
  heroHint: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  waveformContainer: {
    width: "100%",
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    marginBottom: Spacing[10],
    padding: Spacing[4],
  },
  timerContainer: {
    marginBottom: Spacing[4],
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  tip: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing[4],
    includeFontPadding: false,
  },
  controls: {
    alignItems: "center",
    paddingBottom: Spacing[14],
    gap: Spacing[6],
  },
  controlsHidden: {
    display: "none",
  },
  // Unified State Card Styles
  stateCard: {
    marginHorizontal: Spacing[6],
    padding: Spacing[5],
    borderRadius: BorderRadius["2xl"],
    ...Shadows.md,
  },
  stateCardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing[4],
  },
  stateCardContent: {
    alignItems: "center",
    marginBottom: Spacing[5],
    gap: Spacing[2],
  },
  stateCardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.tight,
  },
  stateCardSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  keywordTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.lg,
  },
  keywordText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  stateCardActions: {
    flexDirection: "row",
    gap: Spacing[4],
    width: "100%",
    alignItems: "center",
  },
  stateCardSecondaryBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  stateCardSecondaryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  stateCardPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.xl,
  },
  stateCardPrimaryText: {
    color: "white",
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.extrabold,
    includeFontPadding: false,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing[4],
    width: "100%",
    paddingHorizontal: Spacing[6],
  },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  resetButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  doneButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[7],
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.xl,
  },
  doneButtonText: {
    color: "white",
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
});
