import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuthStore } from '@/stores';
import { useGuestTrial } from './use-guest-trial';
import { Duration, Easings } from '@/constants/animations';

/**
 * Custom hook to manage content gating logic for guest trial drafts
 * Consolidates scattered gate logic into a single, testable hook
 *
 * @param options - Configuration options
 * @returns Content gate state and handlers
 */
export function useContentGate(options: {
  draftId?: string;
  onSignIn?: () => void;
  onSignUp?: () => void;
  debug?: boolean; // Enable debug logging in development
}) {
  const { draftId, onSignIn, onSignUp, debug = false } = options;

  // Get authentication and trial state
  const isActuallyAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { trialCompletedSuccessfully } = useGuestTrial();

  // Guest trial draft state - should be set by parent component
  const [isGuestTrialDraft, setIsGuestTrialDraft] = useState(false);
  const [isGuestFlow, setIsGuestFlow] = useState(false);

  // Content gating state
  const [showContentGate, setShowContentGate] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isImmediateGate, setIsImmediateGate] = useState(false);

  // Blur effect values - animated for smooth transitions
  const blurOverlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  // Worklet refs for gate trigger logic (stable references)
  const showContentGateRef = useRef(false);
  const authenticatedRef = useRef(false);
  const guestTrialRef = useRef(false);
  const trialCompletedRef = useRef(false);
  const guestFlowRef = useRef(false);

  // Signal to prevent duplicate gate triggers
  const shouldShowGate = useSharedValue(0);


  // Update refs when state changes
  useEffect(() => {
    showContentGateRef.current = showContentGate;
  }, [showContentGate]);

  useEffect(() => {
    authenticatedRef.current = isActuallyAuthenticated;
  }, [isActuallyAuthenticated]);

  useEffect(() => {
    guestTrialRef.current = isGuestTrialDraft;
  }, [isGuestTrialDraft]);

  useEffect(() => {
    trialCompletedRef.current = trialCompletedSuccessfully;
  }, [trialCompletedSuccessfully]);

  useEffect(() => {
    guestFlowRef.current = isGuestFlow;
  }, [isGuestFlow]);

  // Main effect: handle authentication changes and update content gate
  useEffect(() => {
    const shouldShowGate = !isActuallyAuthenticated && isGuestTrialDraft && !isGuestFlow;


    setShowContentGate(shouldShowGate);
    setIsImmediateGate(shouldShowGate);

    // Animate blur based on gate state using design system timing
    if (shouldShowGate) {
      blurOverlayOpacity.value = withTiming(1, {
        duration: Duration.slower,
      });
      contentOpacity.value = withTiming(0.4, {
        duration: Duration.slower,
      });
    } else {
      blurOverlayOpacity.value = withTiming(0, {
        duration: Duration.moderate,
      });
      contentOpacity.value = withTiming(1, {
        duration: Duration.moderate,
      });
    }
  }, [isActuallyAuthenticated, isGuestTrialDraft, isGuestFlow, draftId, blurOverlayOpacity, contentOpacity]);

  // Focus effect: re-check gate state when screen regains focus
  useFocusEffect(
    useCallback(() => {
      const checkAuthAndShowGate = () => {
        const shouldShowGate = !isActuallyAuthenticated && isGuestTrialDraft && !isGuestFlow;


        setShowContentGate(shouldShowGate);
        setIsImmediateGate(shouldShowGate);

        // Animate blur
        if (shouldShowGate) {
          blurOverlayOpacity.value = withTiming(1, { duration: Duration.slower });
          contentOpacity.value = withTiming(0.4, { duration: Duration.slower });
        } else {
          blurOverlayOpacity.value = withTiming(0, { duration: Duration.moderate });
          contentOpacity.value = withTiming(1, { duration: Duration.moderate });
        }
      };

      checkAuthAndShowGate();
    }, [isActuallyAuthenticated, isGuestTrialDraft, isGuestFlow, draftId, blurOverlayOpacity, contentOpacity])
  );

  // Worklet function to check and trigger content gate on scroll
  const checkAndTriggerGate = useCallback(() => {
    'worklet';
    const shouldTrigger =
      !authenticatedRef.current &&
      (guestTrialRef.current || trialCompletedRef.current) &&
      !showContentGateRef.current &&
      !guestFlowRef.current;

    if (shouldTrigger && shouldShowGate.value === 0) {
      shouldShowGate.value = 1;
      runOnJS(() => {
        setShowContentGate(true);
        setIsImmediateGate(false); // Scroll-triggered gate
        blurOverlayOpacity.value = withTiming(1, { duration: Duration.slower });
        contentOpacity.value = withTiming(0.4, { duration: Duration.slower });
        shouldShowGate.value = 0;
      })();
    }
  }, [blurOverlayOpacity]);

  // Animated style for content blur effect
  const blurAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Navigation handlers
  const handleSignIn = useCallback(() => {
    onSignIn?.();
  }, [onSignIn]);

  const handleSignUp = useCallback(() => {
    onSignUp?.();
  }, [onSignUp]);

  // Method to mark draft as guest trial draft (called by parent on load)
  const markAsGuestTrialDraft = useCallback(() => {
    setIsGuestTrialDraft(true);
  }, []);

  // Method to set guest flow mode
  const setGuestFlowMode = useCallback((isGuest: boolean) => {
    setIsGuestFlow(isGuest);
  }, []);

  return {
    // State
    showContentGate,
    scrollPercentage,
    isImmediateGate,
    isGuestTrialDraft,
    isGuestFlow,

    // Animated values
    blurOverlayOpacity,
    contentOpacity,
    blurAnimatedStyle,

    // Setters
    setScrollPercentage,
    markAsGuestTrialDraft,
    setGuestFlowMode,
    setIsGuestTrialDraft,

    // Actions
    triggerGateOnScroll: checkAndTriggerGate,
    handleSignIn,
    handleSignUp,
  };
}
