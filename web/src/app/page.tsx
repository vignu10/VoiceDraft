import { HeroSection } from '@/components/discover/HeroSection';
import { DiscoverySearch } from '@/components/discover/DiscoverySearch';
import { FeaturedBlogsGrid } from '@/components/discover/FeaturedBlogsGrid';
import { RecentPostsFeed } from '@/components/discover/RecentPostsFeed';
import type { DiscoveryResponse } from '@/types/discover';

// Fetch initial data server-side
async function getDiscoveryData(): Promise<DiscoveryResponse> {
  try {
    // Use relative URL - works both locally and on Vercel
    const res = await fetch(`/api/discover?blogsLimit=12&postsLimit=12`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch discovery data, status:', res.status);
      return {
        blogs: [],
        posts: [],
        blogsTotal: 0,
        postsTotal: 0,
        hasMoreBlogs: false,
        hasMorePosts: false,
      };
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('getDiscoveryData error:', error);
    return {
      blogs: [],
      posts: [],
      blogsTotal: 0,
      postsTotal: 0,
      hasMoreBlogs: false,
      hasMorePosts: false,
    };
  }
}

export default async function HomePage() {
  const initialData = await getDiscoveryData();

  return (
    <main className="min-h-screen">
      <HeroSection />
      <DiscoverySearch onSortChange={() => {}} initialSort="newest" />
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

// SEO metadata
export const metadata = {
  title: 'VoiceDraft - Discover Blogs & Stories',
  description: 'Explore a community of writers, thinkers, and creators sharing their perspectives through voice and text.',
  openGraph: {
    title: 'VoiceDraft - Discover Blogs & Stories',
    description: 'Explore a community of writers, thinkers, and creators.',
    type: 'website',
  },
};
