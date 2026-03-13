'use client';

import { HeroSection } from '@/components/discover/HeroSection';
import { DiscoverySearch } from '@/components/discover/DiscoverySearch';
import { FeaturedBlogsGrid } from '@/components/discover/FeaturedBlogsGrid';
import { RecentPostsFeed } from '@/components/discover/RecentPostsFeed';
import { useEffect, useState } from 'react';
import type { DiscoveryResponse } from '@/types/discover';

export default function HomePage() {
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
    <main className="min-h-screen">
      <HeroSection />
      <DiscoverySearch initialSort="newest" />
      {isLoading ? (
        <>
          {/* Blog skeleton */}
          <section className="py-16">
            <div className="container-wide">
              <div className="mb-10 flex items-center gap-4">
                <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
                <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
                <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-gradient-card rounded-2xl animate-pulse border border-neutral-200/30 dark:border-neutral-800/30" />
                ))}
              </div>
            </div>
          </section>
          {/* Posts skeleton */}
          <section className="border-t-2 border-neutral-200/50 bg-frosted dark:border-neutral-800/50 py-16">
            <div className="container-wide">
              <div className="mb-10 flex items-center gap-4">
                <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
                <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
                <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-80 bg-gradient-card rounded-2xl animate-pulse border border-neutral-200/30 dark:border-neutral-800/30" />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
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
  );
}
