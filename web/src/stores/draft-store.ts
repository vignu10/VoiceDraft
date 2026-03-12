import { create } from 'zustand';
import { Post, PostStatus } from '@/lib/types';

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
      const response = await fetch('/api/drafts');
      if (!response.ok) throw new Error('Failed to fetch drafts');
      const drafts = await response.json();
      set({ drafts, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch drafts',
        isLoading: false,
      });
    }
  },

  createDraft: async (audioBlob, title) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (title) formData.append('title', title);

      const response = await fetch('/api/drafts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create draft');
      const draft = await response.json();
      set((state) => ({ drafts: [draft, ...state.drafts], isLoading: false }));
      return draft;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create draft',
        isLoading: false,
      });
      throw error;
    }
  },

  updateDraft: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update draft');
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
      const response = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete draft');
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
    await get().updateDraft(id, { status: 'published' });
  },

  archiveDraft: async (id) => {
    await get().updateDraft(id, { status: 'archived' });
  },
}));
