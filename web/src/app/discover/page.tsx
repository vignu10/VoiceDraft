'use client';

import { WithBottomNav } from '@/components/layout/BottomNav';
import { DiscoverySearch } from '@/components/discover/DiscoverySearch';
import { FeaturedBlogsGrid } from '@/components/discover/FeaturedBlogsGrid';
import { RecentPostsFeed } from '@/components/discover/RecentPostsFeed';
import { useEffect, useState } from 'react';
import type { DiscoveryResponse } from '@/types/discover';

export default function DiscoverPage() {
  const [initialData, setInitialData] = useState<DiscoveryResponse>({
    blogs: [],
    posts: [],
    blogsTotal: 0,
    postsTotal: 0,
    hasMoreBlogs: false,
    hasMorePosts: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDiscoveryData() {
      try {
        const res = await fetch('/api/discover?blogsLimit=12&postsLimit=12', {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          setInitialData(data);
        }
      } catch (error) {
        console.error('Failed to fetch discovery data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiscoveryData();
  }, []);

  return (
    <WithBottomNav>
      <main className="min-h-screen pb-16 lg:pb-0">
        {/* Editorial header with asymmetric layout */}
        <header className="relative border-b border-neutral-200/80 dark:border-neutral-800/80">
          {/* Subtle geometric accent */}
          <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-accent-500/5 to-transparent" />
          <div className="absolute right-8 top-8 h-16 w-px bg-accent-500/20" />

          <div className="relative">
            {/* Asymmetric layout: content left, stats right */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
              {/* Main title section - left aligned */}
              <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 lg:pb-16 lg:max-w-2xl">
                {/* Small label above title */}
                <p className="mb-4 text-xs font-semibold tracking-widest uppercase text-accent-600 dark:text-accent-400">
                  Explore
                </p>

                {/* Dramatic editorial headline */}
                <h1 className="text-balance font-bold tracking-tight text-neutral-900 dark:text-white text-4xl sm:text-5xl lg:text-6xl">
                  Voices from the<br />
                  <span className="text-accent-600 dark:text-accent-400">community</span>
                </h1>

                {/* Subtle subtitle - not generic */}
                <p className="mt-6 text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
                  Discover blogs and posts from creators who speak their mind.
                  {initialData.blogsTotal > 0 && ` ${initialData.blogsTotal.toLocaleString()} blogs waiting.`}
                </p>
              </div>

              {/* Stats section - right aligned, vertical stack */}
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-8 lg:px-8 lg:pb-16">
                {!isLoading && initialData.blogsTotal > 0 && (
                  <div className="text-right">
                    <div className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
                      {initialData.blogsTotal.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      active blogs
                    </div>
                  </div>
                )}
                {!isLoading && initialData.postsTotal > 0 && (
                  <div className="text-right">
                    <div className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
                      {initialData.postsTotal.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      posts published
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Geometric line accent - asymmetric */}
            <div className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-accent-500/50 to-transparent" />
          </div>
        </header>

        <DiscoverySearch initialSort="newest" />
        {!isLoading && (
          <>
            <FeaturedBlogsGrid
              initialBlogs={initialData.blogs}
              initialTotal={initialData.blogsTotal}
              initialHasMore={initialData.hasMoreBlogs}
            />
            <RecentPostsFeed
              initialPosts={initialData.posts}
              initialHasMore={initialData.hasMorePosts}
            />
          </>
        )}
      </main>
    </WithBottomNav>
  );
}
