import { useState, useCallback } from 'react';
import { useGuestDraftStore, useGuestStore } from '@/stores';
import { hasGuestDraftToSync, syncGuestDraft, getGuestDraftForPreview } from '@/services/api/guest-sync';

interface UseGuestSyncOptions {
  onSyncSuccess?: (postId: string) => void;
  onSyncError?: (error: string) => void;
}

/**
 * Hook to manage guest draft synchronization during sign-in/sign-up
 *
 * @example
 * const guestSync = useGuestSync({
 *   onSyncSuccess: (postId) => router.push(`/draft/${postId}`),
 *   onSyncError: (error) => Alert.alert('Sync Failed', error),
 * });
 *
 * // Show sync prompt if needed
 * if (guestSync.needsSync) {
 *   // Display prompt with guestSync.preview
 * }
 *
 * // Call sync after user confirms
 * await guestSync.sync(token);
 */
export function useGuestSync(options: UseGuestSyncOptions = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const guestDraft = useGuestDraftStore((state) => state.draft);

  const needsSync = hasGuestDraftToSync();
  const preview = getGuestDraftForPreview();

  const sync = useCallback(
    async (token: string): Promise<boolean> => {
      if (!needsSync) {
        return false;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        const result = await syncGuestDraft({ token });

        if (result.success && result.post) {
          options.onSyncSuccess?.(result.post.id);
          return true;
        } else {
          const errorMsg = result.message || 'Failed to sync guest draft';
          setSyncError(errorMsg);
          options.onSyncError?.(errorMsg);
          return false;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setSyncError(errorMsg);
        options.onSyncError?.(errorMsg);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [needsSync, options],
  );

  const dismiss = useCallback(() => {
    // User chose not to sync - clear the guest draft
    useGuestDraftStore.getState().clearGuestDraft();
    useGuestStore.getState().resetTrial();
  }, []);

  return {
    needsSync,
    guestDraft: preview,
    isSyncing,
    syncError,
    sync,
    dismiss,
  };
}
