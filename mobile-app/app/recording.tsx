                                                                                                            import {
  AmbientRecordingBg,
  PremiumRecordButton,
  SimulatedWaveform,
  Timer,
} from "@/components/recording";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FadeIn, SlideIn } from "@/components/ui/animated/animated-wrappers";
import { PressableScale } from "@/components/ui/animated/pressable-scale";
import {
  MiniCelebration,
  useDelightToast,
} from "@/components/ui/delight";
import { useDialog } from "@/components/ui/dialog";
import { LoadingOverlay } from "@/components/ui/loading";
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
import { useGuestTrial } from "@/hooks/use-guest-trial";
import { useThemeColors } from "@/hooks/use-theme-color";
import { recordingService, PermissionError } from "@/services/audio/recording-service";
import { Audio } from "expo-av";
import {
  useAchievementsStore,
  useRecordingStore,
} from "@/stores";
import {
  formatDuration,
  getHeroMessage,
  getRecordingHint,
  getRecordingMilestone,
  getRecordingTip,
  getWarmErrorMessage,
} from "@/utils/delight-messages";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, Linking, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Check if audio has meaningful sound levels
function hasAudioActivity(levels: number[]): boolean {
  if (levels.length < 10) return false;
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  return avgLevel > 0.05; // Adjusted threshold for 0-1 range
}

// Unified state card component that adapts to different states
type StateCardType = "resume" | "recordingReady";

interface StateCardProps {
  type: StateCardType;
  duration: number;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  colors: ReturnType<typeof useThemeColors>;
  // Optional play functionality for resume card
  recordingUri?: string | null;
  isPlaying?: boolean;
  onPlayPress?: () => void;
}

function StateCard({
  type,
  duration,
  onPrimaryAction,
  onSecondaryAction,
  colors,
  recordingUri,
  isPlaying,
  onPlayPress,
}: StateCardProps) {
  // Card configuration based on type - memoized to prevent recreation
  const config = useMemo(
    () =>
      ({
        resume: {
          icon: "play" as const,
          iconBg: colors.primaryLight,
          iconColor: colors.primary,
          title: formatDuration(duration) + " recorded",
          subtitle: getRecordingTip("resume"),
          primaryLabel: "Continue",
          primaryBg: colors.primary,
          primaryIcon: "play" as const,
          secondaryLabel: "Start Fresh",
          showKeyword: false,
          showPlayButton: true,
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
      }[type]),
    [
      type,
      duration,
      colors.primaryLight,
      colors.primary,
      colors.successLight,
      colors.success,
    ],
  );

  return (
    <SlideIn direction="up" delay={100}>
      <View
        style={[
          styles.stateCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
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
          <ThemedText
            style={[styles.stateCardSubtitle, { color: colors.textSecondary }]}
          >
            {config.subtitle}
          </ThemedText>
        </View>

        {/* Actions */}
        <View style={styles.stateCardActions}>
          {/* Play button for resume card */}
          {type === "resume" && recordingUri && onPlayPress && (
            <PressableScale
              onPress={onPlayPress}
              hapticStyle="light"
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
              style={[
                styles.playButton,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color={colors.primary}
              />
            </PressableScale>
          )}

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
            <ThemedText
              style={[
                styles.stateCardPrimaryText,
                { color: colors.textInverse },
              ]}
            >
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
    savedRecordingUri,
    setRecording,
    setPaused,
    setDuration,
    setAudioUri,
    addMeteringLevel,
    setMeteringLevels,
    reset: resetStore,
    clearExisting,
    markAsExisting,
    setSavedRecordingUri,
  } = useRecordingStore();

  // Guest trial hook - check if user can record
  const {
    isAuthenticated,
    canRecord,
    shouldPromptSignIn,
    remainingDrafts,
    maxFreeDrafts,
    minutesUntilReset,
  } = useGuestTrial();

  // Use throttled metering levels for smooth waveform rendering
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
  const celebrationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hero message state for empty ready state
  const [heroMessage, setHeroMessage] = useState("");

  // Recording milestone state
  const [lastMilestone, setLastMilestone] = useState(0);

  // Toast for micro-interactions
  const { showToast } = useDelightToast();

  // Upload loading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  // App state for detecting background/foreground changes
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Audio playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
      // Cleanup sound
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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

  // Monitor app state changes to auto-save recording when navigating away
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // When app goes to background while recording
      if (
        appState.match(/active|foreground/) &&
        nextAppState === "background" &&
        isRecording &&
        !isPaused
      ) {
        // Save the recording before leaving
        recordingService.saveTemporaryRecording()
          .then((savedUri) => {
            setSavedRecordingUri(savedUri);
            setRecording(false);
            setPaused(true);
          })
          .catch(() => {
            // If save fails, just continue
          });
      }

      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, isRecording, isPaused, setRecording, setSavedRecordingUri]);

  const processRecording = useCallback(async () => {
    // Both guest and authenticated users: stop recording locally and navigate to keyword screen
    try {
      const result = await recordingService.stopRecording();
      if (!result?.uri) {
        await showDialog({
          title: "Recording Error",
          message: "Failed to save recording",
          confirmText: "Got it",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(false);
      setRecording(false);
      setPaused(false);
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
          params: {
            audioUri: result.uri,
            duration: result.duration.toString(),
            isGuestFlow: isAuthenticated ? undefined : "true",
          },
        });
      }, 1500);
    } catch (error) {
      setIsUploading(false);
      console.error("Recording error:", error);
      const warmError = getWarmErrorMessage("recordingError");

      await showDialog({
        title: warmError.title,
        message: warmError.message,
        confirmText: "Got it",
        variant: "warning",
        onConfirm: async () => {
          await resetStore();
        },
      });
    }
  }, [
    setRecording,
    setPaused,
    resetStore,
    recordRecording,
    isAuthenticated,
    duration,
    showDialog,
  ]);

  const handleStop = useCallback(async () => {
    // Validate minimum duration - use warm message
    if (duration < MIN_RECORDING_DURATION) {
      const warmError = getWarmErrorMessage("tooShort");
      await showDialog({
        title: warmError.title,
        message: warmError.message,
        confirmText: "Got it",
        variant: "warning",
      });
      return;
    }

    // Check for audio activity - use warm message
    // Get the current metering levels from the buffer
    const getMeteringLevels = useRecordingStore.getState().getMeteringLevels;
    const currentLevels = getMeteringLevels();
    if (!hasAudioActivity(currentLevels)) {
      const warmError = getWarmErrorMessage("noAudio");
      const confirmed = await showDialog({
        title: warmError.title,
        message: warmError.message,
        confirmText: "Continue Anyway",
        cancelText: "Try Again",
        variant: "warning",
      });
      if (confirmed) {
        await processRecording();
      }
      return;
    }

    await processRecording();
  }, [duration, processRecording, showDialog]);

  useEffect(() => {
    if (duration >= MAX_RECORDING_DURATION) {
      handleStop();
    }
  }, [duration, handleStop]);

  const handleStartRecording = useCallback(async () => {
    // Check if user can record (authenticated or has remaining drafts)
    if (!canRecord) {
      // User is not authenticated and has no remaining drafts
      const resetMessage = minutesUntilReset
        ? ` Try again in ${minutesUntilReset} minutes.`
        : "";

      const confirmed = await showDialog({
        title: "Free Trial Limit Reached",
        message: `You've used all ${maxFreeDrafts} free drafts.${resetMessage}`,
        confirmText: "Sign Up",
        cancelText: "Cancel",
        variant: "info",
        onConfirm: () => {
          router.push("/auth/sign-up");
        },
      });
      return;
    }

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

      // Check for permission error
      if (error instanceof PermissionError) {
        await showDialog({
          title: "Microphone Access Required",
          message: "To record audio, you need to grant microphone permission to VoiceScribe.\n\nTo enable:\n\n1. Open your device Settings\n2. Find VoiceScribe in your apps\n3. Enable Microphone permission\n4. Return to the app and tap the microphone button",
          confirmText: "Open Settings",
          cancelText: "Got it",
          variant: "warning",
          onConfirm: async () => {
            // Try to open app settings (works on iOS)
            try {
              await Linking.openSettings();
            } catch (e) {
              console.error("Couldn't open settings:", e);
            }
          },
          // No onCancel needed - user just closes the dialog and tries again
        });
        return;
      }

      const warmError = getWarmErrorMessage("recordingError");

      await showDialog({
        title: warmError.title,
        message: warmError.message,
        confirmText: "Got it",
        variant: "warning",
        onConfirm: async () => {
          await resetStore();
        },
      });
    }
  }, [
    canRecord,
    addMeteringLevel,
    setDuration,
    setRecording,
    setPaused,
    resetStore,
    hasExistingRecording,
    maxFreeDrafts,
    minutesUntilReset,
    showDialog,
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

      await showDialog({
        title: warmError.title,
        message: warmError.message,
        confirmText: "Got it",
        variant: "warning",
        onConfirm: async () => {
          await resetStore();
        },
      });
    }
  }, [isPaused, setPaused, resetStore, showDialog]);

  const handleCancel = useCallback(async () => {
    if (isRecording) {
      const confirmed = await showDialog({
        title: "Discard Recording?",
        message: "Your recording will be lost.",
        confirmText: "Discard",
        cancelText: "Keep Recording",
        variant: "destructive",
        onConfirm: async () => {
          await recordingService.cancelRecording();
          await resetStore();
          router.back();
        },
      });
    } else {
      await resetStore();
      router.back();
    }
  }, [isRecording, resetStore, showDialog]);

  const handleReset = useCallback(async () => {
    const confirmed = await showDialog({
      title: "Reset Recording?",
      message:
        "This will discard your current recording and you can start fresh.",
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
      let uriToUse = savedRecordingUri || audioUri;

      // If we don't have a saved URI, save the current recording first
      if (!uriToUse && recordingService.isRecording()) {
        uriToUse = await recordingService.saveTemporaryRecording();
        setSavedRecordingUri(uriToUse);
      }

      if (uriToUse) {
        // Navigate to keyword page with the saved recording
        router.push({
          pathname: "/keyword",
          params: {
            audioUri: uriToUse,
            duration: duration.toString(),
            isGuestFlow: isAuthenticated ? undefined : "true",
          },
        });
      } else {
        // No recording to continue - show custom dialog
        await showDialog({
          title: "No Recording Found",
          message: "Please start a new recording.",
          confirmText: "Got it",
          variant: "info",
        });
      }
    } catch (error) {
      console.error("Error continuing to keyword page:", error);
      const warmError = getWarmErrorMessage("recordingError");

      await showDialog({
        title: warmError.title,
        message: warmError.message,
        confirmText: "Got it",
        variant: "warning",
        onConfirm: async () => {
          await resetStore();
        },
      });
    }
  }, [
    savedRecordingUri,
    audioUri,
    duration,
    isAuthenticated,
    setSavedRecordingUri,
    resetStore,
    showDialog,
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

  // Play/Pause the saved recording
  const handlePlayPress = useCallback(async () => {
    if (!savedRecordingUri) return;

    try {
      if (isPlaying && sound) {
        // Pause
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Play
        if (sound) {
          await sound.stopAsync();
          await sound.playAsync();
          setIsPlaying(true);
        } else {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: savedRecordingUri },
            { shouldPlay: true },
            onPlaybackStatusUpdate => {
              if (onPlaybackStatusUpdate.isLoaded && onPlaybackStatusUpdate.didJustFinish) {
                setIsPlaying(false);
                setSound(null);
              }
            }
          );
          setSound(newSound);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [savedRecordingUri, isPlaying, sound]);

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

  // Determine if we should show the recording ready card (recording done, waiting for keyword)
  const showRecordingReadyCard =
    !isRecording && !isPaused && audioUri !== null;

  // Determine if we should show the resume card
  const showResumeCard =
    !isRecording &&
    !isPaused &&
    (savedRecordingUri !== null || hasExistingRecording) &&
    duration > 0 &&
    !audioUri &&
    !showRecordingReadyCard;

  const handleRecordPress = useCallback(() => {
    if (!isRecording) {
      handleStartRecording();
    } else {
      handlePauseResume();
    }
  }, [isRecording, handleStartRecording, handlePauseResume]);

  const getTipText = () => {
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

      {/* Upload loading overlay */}
      <LoadingOverlay
        visible={isUploading}
        message={uploadMessage}
        progress={uploadProgress}
      />

      {/* Ambient background that appears during recording */}
      <AmbientRecordingBg isRecording={isRecording} isPaused={isPaused} />

      <SafeAreaView
        mode="padding"
        edges={["top", "bottom"]}
        /* @ts-ignore - SafeAreaView needs flex: 1 to expand */

        style={{ flex: 1 }}
      >
        <View style={styles.safeArea}>
          {/* Header */}
          <FadeIn>
            <View
              style={styles.header}
              accessibilityLabel={`${
                isRecording
                  ? isPaused
                    ? "Recording paused"
                    : "Recording in progress"
                  : "Ready to record"
              }`}
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
            {/* Guest Draft Counter - simplified, more subtle */}
            {!isAuthenticated && remainingDrafts < maxFreeDrafts && (
              <FadeIn delay={50}>
                <View style={styles.guestCounterSimple}>
                  <ThemedText style={[styles.guestCounterTextSimple, { color: colors.textMuted }]}>
                    {remainingDrafts} free draft{remainingDrafts !== 1 ? "s" : ""} left
                  </ThemedText>
                </View>
              </FadeIn>
            )}

            {/* Single Message - consolidated from hero + hint + tip */}
            {!isRecording &&
              !isPaused &&
              !showResumeCard &&
              !showRecordingReadyCard && (
                <FadeIn delay={100}>
                  <View style={styles.messageContainer}>
                    <ThemedText style={[styles.messageText, { color: colors.text }]}>
                      {heroMessage}
                    </ThemedText>
                  </View>
                </FadeIn>
              )}

            {/* Waveform - simplified with less visual weight */}
            <SlideIn direction="up" delay={100}>
              <View
                style={styles.waveformContainer}
                accessibilityLabel={`Audio waveform ${
                  isRecording && !isPaused
                    ? "showing recording levels"
                    : "ready to record"
                }`}
              >
                <SimulatedWaveform
                  isRecording={isRecording && !isPaused}
                  height={100}
                  barCount={40}
                  barWidth={4}
                  barGap={2}
                />
              </View>
            </SlideIn>

            {/* Timer */}
            <SlideIn direction="up" delay={200}>
              <View
                style={styles.timerContainer}
                accessibilityLabel={`Recording duration: ${Math.floor(
                  duration / 60,
                )} minutes ${duration % 60} seconds`}
              >
                <Timer
                  seconds={duration}
                  isRecording={isRecording}
                  isPaused={isPaused}
                />
              </View>
            </SlideIn>
          </View>

          {/* Unified State Card - adapts to current state */}
          {showResumeCard && (
            <StateCard
              type="resume"
              duration={duration}
              onPrimaryAction={handleResume}
              onSecondaryAction={handleStartFresh}
              colors={colors}
              recordingUri={savedRecordingUri}
              isPlaying={isPlaying}
              onPlayPress={handlePlayPress}
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
                (showResumeCard || showRecordingReadyCard) &&
                  styles.controlsHidden,
              ]}
              accessibilityLabel="Recording controls"
            >
              {/* Main Record/Pause Button - Premium with multi-layer glow */}
              <PremiumRecordButton
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
                      <ThemedText
                        style={[
                          styles.doneButtonText,
                          { color: colors.textInverse },
                        ]}
                      >
                        Done
                      </ThemedText>
                    </PressableScale>
                  </View>
                </FadeIn>
              )}
            </View>
          </SlideIn>
        </View>
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
    paddingBottom: Spacing[10],
    gap: Spacing[5],
  },
  controlsHidden: {
    display: "none",
  },
  // Simplified Styles
  messageContainer: {
    alignItems: "center",
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[5],
  },
  messageText: {
    fontSize: Typography.fontSize["xl"],
    fontWeight: Typography.fontWeight.semibold,
    textAlign: "center",
    lineHeight: Typography.fontSize["xl"] * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  guestCounterSimple: {
    alignSelf: "center",
    marginBottom: Spacing[3],
  },
  guestCounterTextSimple: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
  waveformContainer: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing[5],
    padding: Spacing[3],
  },
  timerContainer: {
    marginBottom: Spacing[5],
    minHeight: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  // Unified State Card Styles - Simplified
  stateCard: {
    marginHorizontal: Spacing[5],
    padding: Spacing[3.5],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  stateCardIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing[2],
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  stateCardContent: {
    alignItems: "center",
    marginBottom: Spacing[4],
    gap: Spacing[1],
  },
  stateCardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.tight,
  },
  stateCardSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  guestCounterBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: BorderRadius.full,
    marginBottom: Spacing[4],
  },
  guestCounterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
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
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
});
