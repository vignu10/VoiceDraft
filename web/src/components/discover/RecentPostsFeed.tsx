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
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          Latest from the Community
        </h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          No posts yet. Check back soon!
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-stone-200 bg-stone-50 py-12 dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-stone-900 dark:text-stone-100">
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
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-8 py-3 text-base font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
            >
              {isLoading ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
