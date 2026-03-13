import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPost } from '@/services/api/posts';
import { useGuestDraftStore } from '@/stores/guest-draft-store';
import { useGuestStore } from '@/stores/guest-store';
import type { Draft } from '@/types/draft';

/**
 * Sync guest drafts from AsyncStorage to the server
 * Called after user signs up/signs in
 */
export async function syncGuestDrafts(): Promise<{
  synced: number;
  failed: number;
}> {
  try {
    const guestDraftsData = await AsyncStorage.getItem('guest-drafts');
    if (!guestDraftsData) {
      return { synced: 0, failed: 0 };
    }

    const guestDrafts: Draft[] = JSON.parse(guestDraftsData);
    if (guestDrafts.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const draft of guestDrafts) {
      try {
        await createPost({
          title: draft.title || '',
          content: draft.content,
          meta_description: draft.metaDescription,
          transcript: draft.transcript,
          target_keyword: draft.targetKeyword,
          tone: draft.tone,
          length: draft.length,
        });
        synced++;
      } catch (error) {
        console.error(`Failed to sync draft ${draft.id}:`, error);
        failed++;
      }
    }

    // Always clear guest drafts from AsyncStorage after sync attempt
    // This prevents stale guest data from leaking into authenticated user's view
    await AsyncStorage.removeItem('guest-drafts');
    await AsyncStorage.removeItem('drafts'); // Also clear legacy key

    // Clear the GuestDraftStore (current guest flow draft)
    useGuestDraftStore.getState().clearGuestDraft();
    // Reset guest trial state so they start fresh as authenticated user
    useGuestStore.getState().resetAll();

    return { synced, failed };
  } catch (error) {
    console.error('Error syncing guest drafts:', error);
    return { synced: 0, failed: 0 };
  }
}

/**
 * Check if there are any guest drafts that need syncing
 */
export async function hasGuestDraftsToSync(): Promise<boolean> {
  try {
    const guestDraftsData = await AsyncStorage.getItem('guest-drafts');
    if (!guestDraftsData) return false;

    const guestDrafts: Draft[] = JSON.parse(guestDraftsData);
    return guestDrafts.length > 0;
  } catch {
    return false;
  }
}
