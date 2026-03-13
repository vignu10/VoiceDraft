import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTags: (tags: Tag[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Computed
  getTagById: (id: string) => Tag | undefined;
  getTagNames: () => string[];
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
];

export const useTagStore = create<TagState>()((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  setTags: (tags) => set({ tags }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/tags');

      if (!response.ok) throw new Error('Failed to fetch tags');
      const tags = await response.json();
      set({ tags, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tags', isLoading: false });
    }
  },

  createTag: async (name, color) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/tags', { name, color });

      if (!response.ok) throw new Error('Failed to create tag');
      const tag = await response.json();
      set((state) => ({ tags: [...state.tags, tag], isLoading: false }));
      return tag;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create tag', isLoading: false });
      throw error;
    }
  },

  updateTag: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/api/tags/${id}`, updates);

      if (!response.ok) throw new Error('Failed to update tag');
      const updatedTag = await response.json();
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? updatedTag : t)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update tag', isLoading: false });
      throw error;
    }
  },

  deleteTag: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/api/tags/${id}`);

      if (!response.ok) throw new Error('Failed to delete tag');
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete tag', isLoading: false });
      throw error;
    }
  },

  getTagById: (id) => {
    return get().tags.find((t) => t.id === id);
  },

  getTagNames: () => {
    return get().tags.map((t) => t.name);
  },
}));

export { DEFAULT_COLORS };
