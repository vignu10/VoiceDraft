'use client';

import { useState } from 'react';
import { BlogDiscoveryCard } from './BlogDiscoveryCard';
import type { BlogDiscoveryCard as BlogCardType, DiscoverySort } from '@/types/discover';

interface FeaturedBlogsGridProps {
  initialBlogs: BlogCardType[];
  initialTotal: number;
  initialHasMore: boolean;
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
      <div id="featured-blogs" className="py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          No blogs yet
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Be the first to start a blog and share your voice!
        </p>
      </div>
    );
  }

  return (
    <section id="featured-blogs" className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Featured Blogs
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogDiscoveryCard key={blog.id} blog={blog} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {isLoading ? 'Loading...' : 'Load More Blogs'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
