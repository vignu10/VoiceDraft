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
import { useCallback } from 'react';
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
}

export interface UseDraftActionsReturn {
  handleMenuAction: (action: string) => Promise<void>;
  handlePublishToggle: (draft: Draft) => Promise<void>;
}

/**
 * Hook for managing draft actions
 *
 * @param props - Configuration props
 * @returns Draft action handlers
 */
export function useDraftActions(props: UseDraftActionsProps): UseDraftActionsReturn {
  const { drafts, setDrafts, menuDraftId, setShowMenu, showDialog } = props;

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
          const confirmed = await showDialog({
            title: 'Delete Draft',
            message: 'Are you sure you want to delete this draft?',
            variant: 'destructive',
            confirmText: 'Delete',
            onConfirm: async () => {
              try {
                await deletePost(draft.id);
                setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
              } catch (error) {
                console.error('Failed to delete draft:', error);
              }
            },
          });

          if (confirmed) {
            // Clear old AsyncStorage
            await AsyncStorage.removeItem('drafts');
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
          setDrafts((prev) => [newDraft, ...prev]);
          await AsyncStorage.setItem('drafts', JSON.stringify([newDraft, ...drafts]));
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
    [drafts, menuDraftId, setDrafts, setShowMenu, showDialog]
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
        } else {
          await publishPost(draft.serverId!);
          setDrafts((prev) =>
            prev.map((d) => (d.id === draft.id ? { ...d, status: ('published' as const) } : d))
          );
        }
      } catch (error) {
        console.error('Failed to toggle publish:', error);
      }
    },
    [setDrafts]
  );

  return {
    handleMenuAction,
    handlePublishToggle,
  };
}
