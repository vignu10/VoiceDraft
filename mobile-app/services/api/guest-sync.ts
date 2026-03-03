import { apiClient } from './client';
import type { ApiResponse } from './client';
import { useGuestDraftStore, useGuestStore } from '@/stores';

interface SyncGuestDraftOptions {
  token: string;
}

interface SyncGuestDraftResult {
  success: boolean;
  post?: {
    id: string;
    title: string;
    slug: string;
  };
  message?: string;
}

/**
 * Sync a guest draft to the authenticated user's account
 * This should be called after a guest user signs in
 *
 * @param options - The sync options containing the auth token
 * @returns The sync result with the created post
 */
export async function syncGuestDraft(
  options: SyncGuestDraftOptions,
): Promise<SyncGuestDraftResult> {
  // Get guest draft from store
  const guestDraft = useGuestDraftStore.getState().draft;

  if (!guestDraft) {
    return {
      success: false,
      message: 'No guest draft found to sync',
    };
  }

  try {
    // Set the token for this request
    apiClient.setToken(options.token);

    // Call the sync endpoint
    const response: ApiResponse<{
      post: {
        id: string;
        title: string;
        slug: string;
      };
      message: string;
    }> = await apiClient.post('/api/guest/sync', {
      guestId: guestDraft.guestId,
      title: guestDraft.title,
      content: guestDraft.content,
      transcription: guestDraft.transcription,
      keywords: guestDraft.keywords,
      createdAt: guestDraft.createdAt,
      audioDuration: guestDraft.audioDuration,
      // Optional metadata
      tone: guestDraft.tone,
      length: guestDraft.length,
    });

    // Clear token after request
    apiClient.clearToken();

    if (response.success && response.data) {
      // Clear guest draft and reset guest trial state on success
      useGuestDraftStore.getState().clearGuestDraft();
      useGuestStore.getState().resetTrial();

      return {
        success: true,
        post: {
          id: response.data.post.id,
          title: response.data.post.title,
          slug: response.data.post.slug,
        },
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.error || 'Failed to sync guest draft',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if there's a guest draft that needs syncing
 * Returns true if a guest draft exists
 */
export function hasGuestDraftToSync(): boolean {
  const guestDraft = useGuestDraftStore.getState().draft;
  return guestDraft !== null;
}

/**
 * Get the guest draft for preview before syncing
 */
export function getGuestDraftForPreview() {
  return useGuestDraftStore.getState().draft;
}
