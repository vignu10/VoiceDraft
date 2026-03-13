/**
 * useDraftActions Hook
 *
 * Manages draft actions (delete, duplicate, publish, share, favorite) for the library screen.
 * Extracted from library.tsx (lines 177-257).
 */

import {
  deletePost,
  publishPost,
  unpublishPost,
} from '@/services/api/posts';
import type { Draft } from '@/types/draft';
import { useAuthStore } from '@/stores/auth-store';
import { generateBlogUrl } from '@/utils/url-utils';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

export interface UseDraftActionsProps {
  drafts: Draft[];
  setDrafts: (drafts: Draft[] | ((prev: Draft[]) => Draft[])) => void;
  menuDraftId: string | null;
  setShowMenu: (show: boolean) => void;
  showDialog: (options: {
    title: string;
    message: string;
    variant?: 'default' | 'destructive';
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }) => Promise<boolean>;
  isAuthenticated: boolean;
  onRefresh?: () => Promise<void>;
}

export interface UseDraftActionsReturn {
  handleMenuAction: (action: string) => Promise<void>;
  handlePublishToggle: (draft: Draft) => Promise<void>;
  publishedPostUrl: string | null;
  setPublishedPostUrl: (url: string | null) => void;
}

/**
 * Hook for managing draft actions
 *
 * @param props - Configuration props
 * @returns Draft action handlers
 */
export function useDraftActions(props: UseDraftActionsProps): UseDraftActionsReturn {
  const { drafts, setDrafts, menuDraftId, setShowMenu, showDialog, isAuthenticated, onRefresh } = props;
  const { journal } = useAuthStore();
  const [publishedPostUrl, setPublishedPostUrl] = useState<string | null>(null);

  /**
   * Handle menu action for a draft
   */
  const handleMenuAction = useCallback(
    async (action: string) => {
      if (!menuDraftId) return;
      setShowMenu(false);

      const draft = drafts.find((d) => d.id === menuDraftId);
      if (!draft) return;

      switch (action) {
        case 'delete': {
          // If post is published, warn user to unpublish first (like Medium)
          if (draft.status === 'published') {
            const shouldUnpublish = await showDialog({
              title: 'Published Post Detected',
              message: 'This post is currently published. Please unpublish it first before deleting.',
              variant: 'default',
              confirmText: 'Unpublish Now',
              onConfirm: async () => {
                try {
                  await unpublishPost(draft.serverId!);
                  // Update local state to reflect unpublished status
                  setDrafts((prev) =>
                    prev.map((d) =>
                      d.id === draft.id
                        ? { ...d, status: ('ready' as const) }
                        : d
                    )
                  );
                  // Refresh from server to get latest state
                  if (onRefresh) {
                    await onRefresh();
                  }
                } catch (error) {
                  console.error('[useDraftActions] Failed to unpublish:', error);
                  throw error;
                }
              },
            });
            return; // Exit without deleting - user must explicitly delete again
          }

          // Normal delete flow for unpublished drafts
          const confirmed = await showDialog({
            title: 'Delete Draft',
            message: 'Are you sure you want to delete this draft?',
            variant: 'destructive',
            confirmText: 'Delete',
            onConfirm: async () => {
              try {
                // For authenticated users with server posts, use serverId to delete from API
                // For guest users, draft.id is used but there's no server deletion
                if (isAuthenticated && draft.serverId) {
                  await deletePost(draft.serverId);
                }
                // Remove from local state regardless of authentication
                setDrafts((prev) => prev.filter((d) => d.id !== draft.id));

                // Refresh data from server for authenticated users
                if (isAuthenticated && onRefresh) {
                  await onRefresh();
                }
              } catch (error) {
                console.error('Failed to delete draft:', error);
                throw error;
              }
            },
          });

          if (confirmed) {
            // Only clear AsyncStorage for non-authenticated users (guest flow)
            // Authenticated users' data comes from API, not AsyncStorage
            if (!isAuthenticated) {
              try {
                await AsyncStorage.multiRemove(['drafts', 'guest-drafts']);
              } catch (error) {
                console.error('Failed to clear drafts from storage:', error);
              }
            }
          }
          break;
        }

        case 'duplicate': {
          const newDraft: Draft = {
            ...draft,
            id: Date.now().toString(),
            title: draft.title ? `${draft.title} (Copy)` : 'Untitled Draft (Copy)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          // Create updated array once to avoid race condition
          const updatedDrafts = [newDraft, ...drafts];
          setDrafts(updatedDrafts);
          await AsyncStorage.setItem('drafts', JSON.stringify(updatedDrafts));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }

        case 'share': {
          router.push({
            pathname: '/keyword',
            params: { shareDraftId: draft.id },
          });
          break;
        }

        case 'favorite': {
          const favDrafts = drafts.map((d) =>
            d.id === menuDraftId ? { ...d, isFavorite: !d.isFavorite } : d
          );
          setDrafts(favDrafts);
          await AsyncStorage.setItem('drafts', JSON.stringify(favDrafts));
          break;
        }
      }
    },
    [drafts, menuDraftId, setDrafts, setShowMenu, showDialog, isAuthenticated, onRefresh]
  );

  /**
   * Toggle publish status for a draft
   */
  const handlePublishToggle = useCallback(
    async (draft: Draft) => {
      try {
        if (draft.status === 'published') {
          await unpublishPost(draft.serverId!);
          setDrafts((prev) =>
            prev.map((d) => (d.id === draft.id ? { ...d, status: ('ready' as const) } : d))
          );
          setPublishedPostUrl(null);
        } else {
          const publishedPost = await publishPost(draft.serverId!);
          setDrafts((prev) =>
            prev.map((d) => (d.id === draft.id ? { ...d, status: ('published' as const) } : d))
          );
          // Generate URL using journal's url_prefix and post's slug
          if (journal?.url_prefix && publishedPost.slug) {
            const postUrl = generateBlogUrl(journal.url_prefix, publishedPost.slug);
            setPublishedPostUrl(postUrl);
          }
        }
      } catch (error) {
        console.error('Failed to toggle publish:', error);
        // Show error feedback to user
        await showDialog({
          title: 'Publish Failed',
          message: `Failed to ${draft.status === 'published' ? 'unpublish' : 'publish'} this draft. Please try again.`,
          variant: 'default',
          confirmText: 'OK',
          onConfirm: () => {},
        });
      }
    },
    [setDrafts, journal, showDialog]
  );

  return {
    handleMenuAction,
    handlePublishToggle,
    publishedPostUrl,
    setPublishedPostUrl,
  };
}
