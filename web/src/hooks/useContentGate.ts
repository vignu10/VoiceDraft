import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useGuestStore } from '@/stores/guest-store';

interface ContentGateOptions {
  draftId?: string;
  onSignIn?: () => void;
  onSignUp?: () => void;
}

interface ContentGateReturn {
  showContentGate: boolean;
  scrollPercentage: number;
  isImmediateGate: boolean;
  setScrollPercentage: (percentage: number) => void;
  handleSignIn: () => void;
  handleSignUp: () => void;
  markAsGuestTrialDraft: () => void;
}

/**
 * Custom hook to manage content gating logic for guest trial drafts
 * Web version of the mobile useContentGate hook
 *
 * @param options - Configuration options
 * @returns Content gate state and handlers
 */
export function useContentGate(options: ContentGateOptions = {}): ContentGateReturn {
  const { draftId, onSignIn, onSignUp } = options;

  // Get authentication and guest state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isGuest } = useGuestStore();

  // Content gating state
  const [showContentGate, setShowContentGate] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isImmediateGate, setIsImmediateGate] = useState(false);
  const [isGuestTrialDraft, setIsGuestTrialDraft] = useState(false);

  // Refs to prevent duplicate gate triggers
  const hasTriggeredGateRef = useRef(false);

  // Main effect: handle authentication changes and update content gate
  useEffect(() => {
    // Show gate if:
    // 1. User is NOT authenticated
    // 2. This is a guest trial draft (created during guest session)
    // 3. Draft ID exists (not a new/unsaved draft)
    const shouldShowGate =
      !isAuthenticated && isGuestTrialDraft && draftId;

    setShowContentGate(shouldShowGate);
    setIsImmediateGate(shouldShowGate);

    // Reset trigger ref when gate state changes
    if (!shouldShowGate) {
      hasTriggeredGateRef.current = false;
    }
  }, [isAuthenticated, isGuestTrialDraft, draftId]);

  // Navigation handlers
  const handleSignIn = useCallback(() => {
    setShowContentGate(false);
    if (onSignIn) {
      onSignIn();
    }
  }, [onSignIn]);

  const handleSignUp = useCallback(() => {
    setShowContentGate(false);
    if (onSignUp) {
      onSignUp();
    }
  }, [onSignUp]);

  // Method to mark draft as guest trial draft (called by parent on load)
  const markAsGuestTrialDraft = useCallback(() => {
    setIsGuestTrialDraft(true);
  }, []);

  // Check if we should trigger gate on scroll
  const checkScrollThreshold = useCallback((percentage: number) => {
    const SCROLL_THRESHOLD = 30; // 30%

    if (
      !isAuthenticated &&
      isGuestTrialDraft &&
      !hasTriggeredGateRef.current &&
      percentage > SCROLL_THRESHOLD
    ) {
      hasTriggeredGateRef.current = true;
      setShowContentGate(true);
      setIsImmediateGate(false); // Scroll-triggered gate
    }
  }, [isAuthenticated, isGuestTrialDraft]);

  // Update scroll percentage and check threshold
  const handleScrollPercentageChange = useCallback((percentage: number) => {
    setScrollPercentage(percentage);
    checkScrollThreshold(percentage);
  }, [checkScrollThreshold]);

  return {
    showContentGate,
    scrollPercentage,
    isImmediateGate,
    setScrollPercentage: handleScrollPercentageChange,
    handleSignIn,
    handleSignUp,
    markAsGuestTrialDraft,
  };
}
