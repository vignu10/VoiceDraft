/**
 * useLibraryData Hook
 *
 * Manages data fetching, loading state, error handling, sorting, and filtering for the library screen.
 * Extracted from library.tsx (lines 53-98, 260-285).
 */

import { listPosts } from '@/services/api/posts';
import { mapPostsToDrafts } from '@/services/mappers/post-to-draft.mapper';
import { useAuthStore } from '@/stores/auth-store';
import type { Draft } from '@/types/draft';
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UseLibraryDataReturn {
  drafts: Draft[];
  filteredDrafts: Draft[];
  isLoading: boolean;
  syncError: string | null;
  searchQuery: string;
  sortBy: 'date' | 'title';
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'date' | 'title') => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing library data
 *
 * @returns Library data state and operations
 */
export function useLibraryData(): UseLibraryDataReturn {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  /**
   * Load posts from API or AsyncStorage (for guest flow)
   */
  const loadPosts = async () => {
    setIsLoading(true);
    setSyncError(null);

    try {
      // Get current auth state directly from store
      const authState = useAuthStore.getState().isAuthenticated;

      if (authState) {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 10s')), 10000)
        );

        // Authenticated: load both draft and published posts from server with timeout
        const [draftPosts, publishedPosts] = await Promise.race([
          Promise.all([
            listPosts({ status: 'draft' }),
            listPosts({ status: 'published' })
          ]),
          timeoutPromise
        ]) as [Awaited<ReturnType<typeof listPosts>>, Awaited<ReturnType<typeof listPosts>>];

        // Merge both draft and published posts
        const allPosts = [...draftPosts, ...publishedPosts];
        const mappedDrafts = mapPostsToDrafts(allPosts);
        setDrafts(mappedDrafts);
      } else {
        // Not authenticated: load guest drafts from AsyncStorage
        // First try 'guest-drafts' key, then fall back to 'drafts' for backwards compatibility
        let guestDraftsData = await AsyncStorage.getItem('guest-drafts');
        if (!guestDraftsData) {
          guestDraftsData = await AsyncStorage.getItem('drafts');
        }

        if (guestDraftsData) {
          const guestDrafts: Draft[] = JSON.parse(guestDraftsData);
          setDrafts(guestDrafts);
        } else {
          setDrafts([]);
        }
      }
    } catch (error) {
      console.error('[useLibraryData] Failed to load posts:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to load posts');
      // Set empty drafts on error so loading completes
      setDrafts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load - only run once on mount
  useEffect(() => {
    let isMounted = true;

    // Set loading state immediately when mounting
    setIsLoading(true);

    loadPosts().finally(() => {
      // Cleanup reference
      isMounted = false;
    });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Memoized filtered and sorted drafts
  const filteredDrafts = useMemo(() => {
    return drafts
      .filter((draft) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          draft.title?.toLowerCase().includes(query) ||
          draft.content?.toLowerCase().includes(query) ||
          draft.targetKeyword?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [drafts, searchQuery, sortBy]);

  return {
    drafts,
    filteredDrafts,
    isLoading,
    syncError,
    searchQuery,
    sortBy,
    setSearchQuery,
    setSortBy,
    refresh: loadPosts,
  };
}
