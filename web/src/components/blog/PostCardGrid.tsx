'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import { ErrorState } from './ErrorState';
import type { PostCardData, SortOption } from '@/types/blog';

interface PostCardGridProps {
  initialPosts: PostCardData[];
  urlPrefix: string;
  total: number;
}

export function PostCardGrid({ initialPosts, urlPrefix, total }: PostCardGridProps) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialPosts.length < total);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentSort, setCurrentSort] = useState<SortOption>('newest');
  const offsetRef = useRef(initialPosts.length);

  const fetchFilteredPosts = useCallback(async (search: string, sort: SortOption) => {
    // Reset to initial if no filters
    if (!search && sort === 'newest') {
      setPosts(initialPosts);
      setHasMore(initialPosts.length < total);
      offsetRef.current = initialPosts.length;
      setCurrentSearch('');
      setCurrentSort('newest');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: '0',
        sort,
        ...(search && { search }),
      });

      const response = await fetch(`/api/${urlPrefix}/posts?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();

      setPosts(data.posts);
      setHasMore(data.hasMore);
      offsetRef.current = data.posts.length;
      setCurrentSearch(search);
      setCurrentSort(sort);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Unable to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [urlPrefix, initialPosts, total]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: offsetRef.current.toString(),
        sort: currentSort,
        ...(currentSearch && { search: currentSearch }),
      });

      const response = await fetch(`/api/${urlPrefix}/posts?${params}`);
      const data = await response.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      offsetRef.current += data.posts.length;
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  }, [urlPrefix, currentSearch, currentSort]);

  // Register fetch function globally for controls
  useEffect(() => {
    (window as any).__blogFetch = fetchFilteredPosts;
  }, [fetchFilteredPosts]);

  // Show error state if there's an error
  if (error) {
    return <ErrorState message={error} onRetry={() => fetchFilteredPosts(currentSearch, currentSort)} />;
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">No posts found</h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} urlPrefix={urlPrefix} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded bg-stone-900 px-6 py-2.5 font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
