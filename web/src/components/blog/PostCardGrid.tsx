'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import { PostCardSkeleton } from './PostCardSkeleton';
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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <svg
            className="h-10 w-10 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">No posts found</h3>
        <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="@container card-grid">
      <div className="grid grid-cols-1 card-grid-gap card-grid-cards-1 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} urlPrefix={urlPrefix} />
        ))}
        {/* Show skeleton cards when loading more */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={`skeleton-${i}`} />)
        }
      </div>

      {hasMore && !loading && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group inline-flex items-center justify-center gap-2 min-w-[160px] rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-primary-500/25 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load More</span>
                <svg className="h-5 w-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
