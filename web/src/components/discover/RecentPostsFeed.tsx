'use client';

import { useState } from 'react';
import { PostCard } from '../blog/PostCard';
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
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (posts.length === 0) {
    return (
      <section className="py-16 text-center">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Latest from the Community
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          No posts yet. Check back soon!
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="container-wide">
        <h2 className="mb-8 text-2xl font-semibold text-neutral-900 dark:text-white">
          Latest from the Community
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              urlPrefix={post.url_prefix || ''}
            />
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-8 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:ring-neutral-500 dark:focus:ring-offset-neutral-950"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
