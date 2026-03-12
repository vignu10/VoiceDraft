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
      <FeaturedBlogsGrid
        initialBlogs={initialData.blogs}
        initialTotal={initialData.blogsTotal}
        initialHasMore={initialData.hasMoreBlogs}
      />
      <RecentPostsFeed
        initialPosts={initialData.posts}
        initialHasMore={initialData.hasMorePosts}
      />
    </main>
  );
}
