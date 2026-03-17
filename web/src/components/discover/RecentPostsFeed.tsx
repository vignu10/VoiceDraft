'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PostCard } from '../blog/PostCard';
import { PostCardSkeleton } from '../blog/PostCardSkeleton';
import type { PostCardData } from '@/types/blog';

interface RecentPostsFeedProps {
  initialPosts: PostCardData[];
  initialHasMore: boolean;
}

export function RecentPostsFeed({
  initialPosts,
  initialHasMore,
}: RecentPostsFeedProps) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedMore = useRef(false);

  // Sync state when props change (after initial fetch)
  // Only update from props if we haven't loaded more data manually
  useEffect(() => {
    if (!hasLoadedMore.current) {
      setPosts(initialPosts);
      setHasMore(initialHasMore);
    }
  }, [initialPosts, initialHasMore]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/discover?postsLimit=12&postsOffset=${posts.length}`
      );
      const data = await response.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMorePosts);
      hasLoadedMore.current = true;
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (posts.length === 0) {
    return (
      <section className="py-24 text-center">
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Latest from the Community
        </h2>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
          No posts yet. Be the first to share your voice!
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/record"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 min-h-[48px] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Post
          </Link>
          <Link
            href="/drafts"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white min-h-[48px] px-6 py-3.5 text-base font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
          >
            View My Drafts
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-neutral-200/60 bg-gradient-to-b from-neutral-50/50 to-white py-16 sm:py-20 dark:border-neutral-800/60 dark:from-neutral-900/50 dark:to-neutral-950 @container card-grid">
      <div className="container-wide">
        {/* Editorial section header - asymmetric */}
        <div className="mb-12 flex items-start gap-6 sm:gap-8">
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              Recent
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Latest Posts
            </h2>
          </div>
          {/* Geometric accent - right aligned */}
          <div className="hidden sm:block h-12 w-px bg-primary-500/30 dark:opacity-40" />
        </div>

        <div className="grid grid-cols-1 card-grid-gap card-grid-cards-1 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              urlPrefix={post.url_prefix || ''}
            />
          ))}
          {/* Show skeleton cards when loading more */}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={`skeleton-${i}`} />)
          }
          {/* Screen reader announcement for loading state */}
          {isLoading && (
            <span className="sr-only" role="status" aria-live="polite">
              Loading more posts...
            </span>
          )}
        </div>

        {hasMore && !isLoading && (
          <div className="mt-12 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="group inline-flex items-center justify-center gap-2 min-w-[200px] rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-primary-500/25 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Load More Posts</span>
                  <svg className="h-5 w-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
