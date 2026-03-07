# Blog Discovery Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-blog discovery hub at the root route (`/`) that showcases multiple users/blogs with featured blogs grid, search/filter, and recent posts feed.

**Architecture:** Next.js 13+ App Router with React Server Components. Main page is a server component that fetches initial data server-side, with client components for interactive features (search, filter, load more).

**Tech Stack:** Next.js 13+, TypeScript, Supabase, Tailwind CSS, React Server Components

---

## Task 1: Create Discovery Types

**Files:**
- Create: `web/src/types/discover.ts`

**Step 1: Create discovery types**

Create `web/src/types/discover.ts`:

```typescript
// Discovery hub types

export interface BlogDiscoveryCard {
  id: string;
  url_prefix: string;
  display_name: string;
  description: string | null;
  created_at: string;
  post_count: number;
  latest_post: {
    id: string;
    title: string;
    slug: string;
    published_at: string;
  } | null;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface DiscoveryResponse {
  blogs: BlogDiscoveryCard[];
  posts: PostCardData[];
  blogsTotal: number;
  postsTotal: number;
  hasMoreBlogs: boolean;
  hasMorePosts: boolean;
}

export type DiscoverySort = 'newest' | 'active' | 'posts';

// Re-use PostCardData from blog.ts
import type { PostCardData } from './blog';
```

**Step 2: Commit**

```bash
git add web/src/types/discover.ts
git commit -m "feat: add discovery hub type definitions"
```

---

## Task 2: Create Discovery API Endpoint

**Files:**
- Create: `web/src/app/api/discover/route.ts`
- Reference: `web/src/lib/supabase.ts` (Supabase client)
- Reference: `web/src/lib/auth-helpers.ts` (handleError)

**Step 1: Create the discovery API endpoint**

Create `web/src/app/api/discover/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { DiscoveryResponse } from '@/types/discover';

// GET featured blogs and recent posts for discovery hub
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const blogsLimit = parseInt(searchParams.get('blogsLimit') || '12');
    const blogsOffset = parseInt(searchParams.get('blogsOffset') || '0');
    const postsLimit = parseInt(searchParams.get('postsLimit') || '12');
    const postsOffset = parseInt(searchParams.get('postsOffset') || '0');
    const sort = searchParams.get('sort') || 'newest';

    // Fetch featured blogs with post counts and latest post
    let blogsQuery = supabase
      .from('journals')
      .select(`
        id,
        url_prefix,
        display_name,
        description,
        created_at,
        user_profiles (
          full_name,
          avatar_url
        ),
        posts (
          id,
          title,
          slug,
          published_at
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Add sorting for blogs
    switch (sort) {
      case 'active':
        // Sort by most recent activity (latest post)
        blogsQuery = blogsQuery.order('updated_at', { ascending: false });
        break;
      case 'posts':
        // Sort by post count (handled post-query for now)
        break;
      case 'newest':
      default:
        blogsQuery = blogsQuery.order('created_at', { ascending: false });
        break;
    }

    // Add pagination for blogs
    const blogsFrom = blogsOffset;
    const blogsTo = blogsOffset + blogsLimit - 1;
    blogsQuery = blogsQuery.range(blogsFrom, blogsTo);

    const { data: journals, error: journalsError, count: journalsCount } = await blogsQuery;

    if (journalsError) {
      return handleError(journalsError);
    }

    // Transform journals into blog discovery cards
    const blogs = (journals || []).map((journal: any) => {
      const posts = journal.posts || [];
      const latestPost = posts.length > 0
        ? posts.sort((a: any, b: any) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          )[0]
        : null;

      return {
        id: journal.id,
        url_prefix: journal.url_prefix,
        display_name: journal.display_name,
        description: journal.description,
        created_at: journal.created_at,
        post_count: posts.length,
        latest_post: latestPost ? {
          id: latestPost.id,
          title: latestPost.title,
          slug: latestPost.slug,
          published_at: latestPost.published_at,
        } : null,
        user_profiles: journal.user_profiles || {
          full_name: null,
          avatar_url: null,
        },
      };
    });

    // Sort by post count if requested
    if (sort === 'posts') {
      blogs.sort((a: any, b: any) => b.post_count - a.post_count);
    }

    // Fetch recent posts across all blogs
    const { data: posts, error: postsError, count: postsCount } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        meta_description,
        target_keyword,
        published_at,
        word_count,
        reading_time_minutes,
        view_count,
        audio_file_url,
        audio_duration_seconds,
        style_used,
        journals (
          url_prefix
        )
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(postsOffset, postsOffset + postsLimit - 1);

    if (postsError) {
      return handleError(postsError);
    }

    // Transform posts to include url_prefix
    const postsWithPrefix = (posts || []).map((post: any) => ({
      ...post,
      url_prefix: post.journals?.url_prefix || '',
    }));

    const response: DiscoveryResponse = {
      blogs,
      posts: postsWithPrefix,
      blogsTotal: journalsCount || 0,
      postsTotal: postsCount || 0,
      hasMoreBlogs: (journalsCount || 0) > blogsOffset + blogsLimit,
      hasMorePosts: (postsCount || 0) > postsOffset + postsLimit,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
```

**Step 2: Verify the API endpoint works**

Run: `curl http://localhost:3000/api/discover?blogsLimit=5&postsLimit=5&sort=newest`
Expected: JSON response with blogs array, posts array, and pagination info

**Step 3: Commit**

```bash
git add web/src/app/api/discover/route.ts
git commit -m "feat: add discovery API endpoint with blogs and posts aggregation"
```

---

## Task 3: Create Discovery Utility Functions

**Files:**
- Create: `web/src/lib/discover-utils.ts`
- Reference: `web/src/lib/blog-utils.ts` (existing utilities)

**Step 1: Create discovery utility functions**

Create `web/src/lib/discover-utils.ts`:

```typescript
import type { BlogDiscoveryCard } from '@/types/discover';

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format post count for display
 */
export function formatPostCount(count: number): string {
  if (count === 1) return '1 post';
  return `${count} posts`;
}

/**
 * Generate initials from name for avatar fallback
 */
export function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
```

**Step 2: Commit**

```bash
git add web/src/lib/discover-utils.ts
git commit -m "feat: add discovery utility functions"
```

---

## Task 4: Create Hero Section Component

**Files:**
- Create: `web/src/components/discover/HeroSection.tsx`

**Step 1: Create the hero section component**

Create `web/src/components/discover/HeroSection.tsx`:

```typescript
'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl dark:bg-purple-600/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Discover Voices & Stories
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Explore a community of writers, thinkers, and creators sharing their perspectives through voice and text.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Start Your Blog
            </Link>
            <Link
              href="#featured-blogs"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/discover/HeroSection.tsx
git commit -m "feat: add hero section component for discovery hub"
```

---

## Task 5: Create Blog Discovery Card Component

**Files:**
- Create: `web/src/components/discover/BlogDiscoveryCard.tsx`
- Reference: `web/src/components/blog/BlogHeader.tsx` (avatar pattern)

**Step 1: Create the blog discovery card component**

Create `web/src/components/discover/BlogDiscoveryCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { truncate, formatPostCount, getInitials } from '@/lib/discover-utils';
import { formatDate } from '@/lib/blog-utils';
import type { BlogDiscoveryCard } from '@/types/discover';

interface BlogDiscoveryCardProps {
  blog: BlogDiscoveryCard;
}

export function BlogDiscoveryCard({ blog }: BlogDiscoveryCardProps) {
  const { url_prefix, display_name, description, post_count, latest_post, user_profiles } = blog;
  const authorName = user_profiles?.full_name || display_name;

  return (
    <Link
      href={`/${url_prefix}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="p-6">
        {/* Author Header */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              {user_profiles?.avatar_url ? (
                <Image
                  src={user_profiles.avatar_url}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                  {getInitials(authorName)}
                </div>
              )}
            </div>
          </div>

          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {display_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatPostCount(post_count)}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {truncate(description, 100)}
          </p>
        )}

        {/* Latest Post */}
        {latest_post && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Latest post
            </p>
            <p className="mt-1 truncate text-sm font-medium text-gray-900 dark:text-white">
              {latest_post.title}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {formatDate(latest_post.published_at)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/discover/BlogDiscoveryCard.tsx
git commit -m "feat: add blog discovery card component"
```

---

## Task 6: Create Discovery Search Component

**Files:**
- Create: `web/src/components/discover/DiscoverySearch.tsx`

**Step 1: Create the discovery search component**

Create `web/src/components/discover/DiscoverySearch.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type DiscoverySort = 'newest' | 'active' | 'posts';

const sortOptions: { value: DiscoverySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'active', label: 'Most Active' },
  { value: 'posts', label: 'Most Posts' },
];

interface DiscoverySearchProps {
  onSortChange: (sort: DiscoverySort) => void;
  initialSort?: DiscoverySort;
}

export function DiscoverySearch({ onSortChange, initialSort = 'newest' }: DiscoverySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<DiscoverySort>(initialSort);

  const handleSortChange = (sort: DiscoverySort) => {
    setSelectedSort(sort);
    onSortChange(sort);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: Implement search debouncing and filtering
  };

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search blogs..."
              className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <div className="flex rounded-full border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedSort === option.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/discover/DiscoverySearch.tsx
git commit -m "feat: add discovery search and filter component"
```

---

## Task 7: Create Featured Blogs Grid Component

**Files:**
- Create: `web/src/components/discover/FeaturedBlogsGrid.tsx`

**Step 1: Create the featured blogs grid component**

Create `web/src/components/discover/FeaturedBlogsGrid.tsx`:

```typescript
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
```

**Step 2: Commit**

```bash
git add web/src/components/discover/FeaturedBlogsGrid.tsx
git commit -m "feat: add featured blogs grid component with pagination"
```

---

## Task 8: Create Recent Posts Feed Component

**Files:**
- Create: `web/src/components/discover/RecentPostsFeed.tsx`
- Reference: `web/src/components/blog/PostCard.tsx` (existing post card)

**Step 1: Create the recent posts feed component**

Create `web/src/components/discover/RecentPostsFeed.tsx`:

```typescript
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Latest from the Community
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          No posts yet. Check back soon!
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
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
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {isLoading ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/discover/RecentPostsFeed.tsx
git commit -m "feat: add recent posts feed component"
```

---

## Task 9: Create Root Discovery Page

**Files:**
- Create: `web/src/app/page.tsx`
- Create: `web/src/app/layout.tsx` (if not exists)
- Create: `web/src/app/loading.tsx`

**Step 1: Create the root page server component**

Create `web/src/app/page.tsx`:

```typescript
import { HeroSection } from '@/components/discover/HeroSection';
import { DiscoverySearch } from '@/components/discover/DiscoverySearch';
import { FeaturedBlogsGrid } from '@/components/discover/FeaturedBlogsGrid';
import { RecentPostsFeed } from '@/components/discover/RecentPostsFeed';
import type { DiscoveryResponse } from '@/types/discover';

// Fetch initial data server-side
async function getDiscoveryData(): Promise<DiscoveryResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/discover?blogsLimit=12&postsLimit=12`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Failed to fetch discovery data');
    return {
      blogs: [],
      posts: [],
      blogsTotal: 0,
      postsTotal: 0,
      hasMoreBlogs: false,
      hasMorePosts: false,
    };
  }

  return res.json();
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
```

**Step 2: Create loading skeleton**

Create `web/src/app/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Hero skeleton */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="animate-pulse text-center">
            <div className="mx-auto h-12 w-3/4 rounded bg-gray-300 dark:bg-gray-700 sm:h-16" />
            <div className="mx-auto mt-6 h-6 w-1/2 rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
      </section>

      {/* Search skeleton */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* Blogs grid skeleton */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-5 w-3/4 rounded bg-gray-300 dark:bg-gray-700" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
```

**Step 3: Verify the page loads**

Run: `curl http://localhost:3000/`
Expected: HTML page with hero, search, and blog sections

**Step 4: Commit**

```bash
git add web/src/app/page.tsx web/src/app/loading.tsx
git commit -m "feat: add root discovery page with hero, blogs, and posts"
```

---

## Task 10: Test Responsive Design

**Files:**
- Test: Manual browser testing

**Step 1: Test mobile view (< 640px)**
1. Open browser dev tools and set viewport to 375px
2. Navigate to `http://localhost:3000/`
3. Verify:
   - Hero stacks vertically
   - Search bar is full width
   - Blog grid shows 1 column
   - Post grid shows 1 column
   - All text is readable

**Step 2: Test tablet view (640px - 1024px)**
1. Set viewport to 768px
2. Verify:
   - Blog grid shows 2 columns
   - Post grid shows 2 columns

**Step 3: Test desktop view (> 1024px)**
1. Set viewport to 1280px
2. Verify:
   - Blog grid shows 3 columns
   - Post grid shows 3 columns
   - Content is centered with max-width

**Step 4: Test dark mode**
1. Toggle dark mode in browser/system
2. Verify all colors adapt correctly
3. Check contrast ratios

---

## Task 11: Test Interactive Features

**Files:**
- Test: Manual browser testing

**Step 1: Test search functionality**
1. Type in search box
2. Verify input accepts text
3. (Search filtering requires additional implementation)

**Step 2: Test sort options**
1. Click "Newest" - verify blogs re-sort
2. Click "Most Active" - verify blogs re-sort
3. Click "Most Posts" - verify blogs re-sort

**Step 3: Test load more buttons**
1. Scroll to "Load More Blogs" button
2. Click and verify new blogs appear
3. Scroll to "Load More Posts" button
4. Click and verify new posts appear

**Step 4: Test navigation**
1. Click blog card - verify navigates to blog page
2. Click latest post in card - verify navigates to post
3. Click post card in feed - verify navigates to post
4. Click "Start Your Blog" - verify navigates appropriately

---

## Task 12: Test Empty States

**Files:**
- Test: Manual database testing

**Step 1: Test empty blogs state**
1. Clear all active journals from database
2. Navigate to `http://localhost:3000/`
3. Verify "No blogs yet" message displays
4. Verify CTA to start blog is shown

**Step 2: Test empty posts state**
1. Clear all published posts from database
2. Navigate to `http://localhost:3000/`
3. Verify "No posts yet" message displays in feed section

**Step 3: Restore test data**
1. Re-add sample journals and posts
2. Verify normal page loads

---

## Summary Checklist

After completing all tasks, verify:

- [ ] Root page loads without errors
- [ ] Hero section displays with CTAs
- [ ] Search bar accepts input
- [ ] Sort options work correctly
- [ ] Featured blogs grid displays
- [ ] Blog cards show avatar, name, post count, latest post
- [ ] Recent posts feed displays aggregated posts
- [ ] Load more buttons work for both sections
- [ ] Empty states display when no data
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Dark mode works
- [ ] SEO metadata is present
- [ ] Navigation links work correctly
