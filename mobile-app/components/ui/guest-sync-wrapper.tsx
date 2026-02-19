import { useEffect, useState } from "react";
import { useGuestDraftStore, useAuthStore } from "@/stores";
import { GuestSyncModal } from "./guest-sync-modal";
import { router } from "expo-router";

/**
 * Wrapper component that shows the guest sync modal after successful sign-in/sign-up
 *
 * Usage: Include this component in your app root or auth layout
 *
 * @example
 * <GuestSyncWrapper />
 */
export function GuestSyncWrapper() {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const guestDraft = useGuestDraftStore((state) => state.draft);

  useEffect(() => {
    // Show sync modal when:
    // 1. User becomes authenticated
    // 2. Has an access token
    // 3. Has a guest draft to sync
    if (isAuthenticated && accessToken && guestDraft && !showSyncModal) {
      // Small delay to let the auth success UI settle
      const timer = setTimeout(() => {
        setSyncToken(accessToken);
        setShowSyncModal(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, accessToken, guestDraft, showSyncModal]);

  const handleDismiss = () => {
    setShowSyncModal(false);
    setSyncToken(null);
    // Navigate to home or drafts if no sync happened
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  };

  if (!syncToken || !guestDraft) {
    return null;
  }

  return (
    <GuestSyncModal
      visible={showSyncModal}
      token={syncToken}
      onDismiss={handleDismiss}
    />
  );
}
