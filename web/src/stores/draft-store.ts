import { create } from 'zustand';
import { Post, PostStatus } from '@/lib/types';
import * as idb from '@/lib/indexedDB';
import { api, ApiError } from '@/lib/api-client';

interface DraftState {
  drafts: Post[];
  isLoading: boolean;
  error: string | null;
  filter: PostStatus | 'all';
  sortBy: 'date' | 'title' | 'wordCount';
  sortOrder: 'asc' | 'desc';

  // Actions
  setDrafts: (drafts: Post[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: PostStatus | 'all') => void;
  setSortBy: (sortBy: 'date' | 'title' | 'wordCount') => void;
  toggleSortOrder: () => void;

  // CRUD operations
  fetchDrafts: () => Promise<void>;
  createDraft: (audioBlob: Blob, title?: string) => Promise<Post>;
  updateDraft: (id: string, updates: Partial<Post>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  publishDraft: (id: string) => Promise<void>;
  unpublishDraft: (id: string) => Promise<void>;
  archiveDraft: (id: string) => Promise<void>;

  // Computed
  filteredDrafts: () => Post[];
}

export const useDraftStore = create<DraftState>()((set, get) => ({
  drafts: [],
  isLoading: false,
  error: null,
  filter: 'all',
  sortBy: 'date',
  sortOrder: 'desc',

  setDrafts: (drafts) => set({ drafts }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set({ filter }),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),

  filteredDrafts: () => {
    const { drafts, filter, sortBy, sortOrder } = get();
    let filtered = filter === 'all' ? drafts : drafts.filter((d) => d.status === filter);

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'wordCount':
          comparison = a.word_count - b.word_count;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  },

  fetchDrafts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/drafts');
      const drafts = await response.json();

      // Also get offline drafts
      const offlineDrafts = await idb.getOfflineDrafts();

      set({ drafts, isLoading: false });
    } catch (error) {
      // Handle ApiError specifically
      if (error instanceof ApiError) {
        console.error('[Draft Store] API Error:', error.status, error.message);
      }

      // On error, try to load from offline storage
      const offlineDrafts = await idb.getOfflineDrafts();
      if (offlineDrafts.length > 0) {
        set({ drafts: offlineDrafts, isLoading: false });
      } else {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch drafts',
          isLoading: false,
        });
      }
    }
  },

  createDraft: async (audioBlob, title) => {
    set({ isLoading: true, error: null });
    const tempId = `temp-${Date.now()}`;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (title) formData.append('title', title);

      const response = await api.post('/api/drafts', formData);
      const draft = await response.json();
      set((state) => ({ drafts: [draft, ...state.drafts], isLoading: false }));

      // Save to IndexedDB
      await idb.saveDraftOffline({
        id: draft.id,
        title: draft.title,
        content: draft.content || '',
        transcript: draft.transcript,
        status: draft.status,
        word_count: draft.word_count,
        created_at: draft.created_at,
        updated_at: draft.updated_at,
        synced: true,
      });

      return draft;
    } catch (error) {
      // Save offline
      const offlineDraft = {
        id: tempId,
        title: title || 'Untitled Draft',
        content: '',
        status: 'draft' as const,
        word_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false,
        audio_blob: audioBlob,
      };

      await idb.saveDraftOffline(offlineDraft);
      set((state) => ({
        drafts: [{ ...offlineDraft, id: tempId } as Post, ...state.drafts],
        isLoading: false,
        error: 'Draft saved locally. Will sync when online.',
      }));

      throw error;
    }
  },

  updateDraft: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/api/drafts/${id}`, updates);
      const updatedDraft = await response.json();
      set((state) => ({
        drafts: state.drafts.map((d) => (d.id === id ? updatedDraft : d)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update draft',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDraft: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/drafts/${id}`);
      set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete draft',
        isLoading: false,
      });
      throw error;
    }
  },

  publishDraft: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/api/posts/${id}/publish`, {});
      const publishedPost = await response.json();

      // Update local state to reflect published status
      set((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === id ? { ...d, status: 'published' as PostStatus, published_at: publishedPost.published_at } : d
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to publish draft',
        isLoading: false,
      });
      throw error;
    }
  },

  unpublishDraft: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/api/posts/${id}/unpublish`, {});
      const unpublishedPost = await response.json();

      // Update local state to reflect unpublished status
      set((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === id ? { ...d, status: 'draft' as PostStatus } : d
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unpublish draft',
        isLoading: false,
      });
      throw error;
    }
  },

  archiveDraft: async (id) => {
    await get().updateDraft(id, { status: 'archived' });
  },
}));
