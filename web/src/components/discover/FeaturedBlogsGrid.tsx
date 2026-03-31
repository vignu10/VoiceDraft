'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlogDiscoveryCard } from './BlogDiscoveryCard';
import { BlogCardSkeleton } from './BlogCardSkeleton';
import type { BlogDiscoveryCard as BlogCardType, DiscoverySort } from '@/types/discover';

interface FeaturedBlogsGridProps {
  initialBlogs: BlogCardType[];
  initialTotal: number;
  initialHasMore: boolean;
}

type CardVariant = 'featured' | 'standard';

// Determine card variant based on index for asymmetric layout
function getCardVariant(index: number, total: number): CardVariant {
  // First card is always featured if we have at least 3 blogs
  if (index === 0 && total >= 3) return 'featured';

  // Every 5th card is featured for visual rhythm
  if (index > 0 && index % 5 === 0) return 'featured';

  // Default to standard
  return 'standard';
}

export function FeaturedBlogsGrid({
  initialBlogs,
  initialTotal,
  initialHasMore,
}: FeaturedBlogsGridProps) {
  const [blogs, setBlogs] = useState<BlogCardType[]>(initialBlogs);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState<DiscoverySort>('newest');
  const hasLoadedMore = useRef(false);

  // Sync state when props change (after initial fetch)
  // Only update from props if we haven't loaded more data manually
  useEffect(() => {
    if (!hasLoadedMore.current) {
      setBlogs(initialBlogs);
      setHasMore(initialHasMore);
    }
  }, [initialBlogs, initialHasMore]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/discover?blogsLimit=12&blogsOffset=${blogs.length}&sort=${currentSort}`
      );
      const data = await response.json();

      setBlogs((prev) => [...prev, ...data.blogs]);
      setHasMore(data.hasMoreBlogs);
      hasLoadedMore.current = true;
    } catch (error) {
      console.error('Failed to load more blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = async (sort: DiscoverySort) => {
    setCurrentSort(sort);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/discover?blogsLimit=12&blogsOffset=0&sort=${sort}`);
      const data = await response.json();

      setBlogs(data.blogs);
      setHasMore(data.hasMoreBlogs);
    } catch (error) {
      console.error('Failed to sort blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (blogs.length === 0) {
    return (
      <div id="featured-blogs" className="py-24 text-center">
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
          No blogs yet
        </h2>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
          Be the first to start a blog and share your voice!
        </p>
        <div className="mt-8">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 min-h-[48px] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-shadow transition-transform hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section id="featured-blogs" className="py-16 sm:py-20">
      <div className="container-wide">
        {/* Editorial section header - asymmetric */}
        <div className="mb-12 flex items-start gap-6 sm:gap-8">
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
              Creators
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Featured Blogs
            </h2>
          </div>
          {/* Geometric accent - right aligned */}
          <div className="hidden sm:block h-12 w-px bg-accent-500/30 dark:opacity-40" />
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 auto-rows-max">
          {blogs.map((blog, index) => {
            const variant = getCardVariant(index, blogs.length);
            return (
              <BlogDiscoveryCard key={blog.id} blog={blog} variant={variant} />
            );
          })}
          {/* Show skeleton cards when loading */}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <BlogCardSkeleton key={`skeleton-${i}`} />)
          }
          {/* Screen reader announcement for loading state */}
          {isLoading && (
            <span className="sr-only" role="status" aria-live="polite">
              Loading more blogs...
            </span>
          )}
        </div>

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="group inline-flex items-center justify-center gap-2 min-w-[220px] rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-accent-500/25 transition-shadow transition-transform hover:shadow-2xl hover:shadow-accent-500/40 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-accent-500/50 focus:ring-offset-2"
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
                  <span>Discover More Blogs</span>
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
