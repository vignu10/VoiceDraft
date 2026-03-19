# Blog Listing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a blog listing page at `example.com/[url_prefix]` that displays published posts with rich magazine-style cards, search, filtering, sorting, and pagination.

**Architecture:** Next.js 13+ App Router with React Server Components for optimal performance. Main page is a server component that fetches initial data server-side, with client components for interactive features (search, filter, sort, pagination).

**Tech Stack:** Next.js 13+, TypeScript, Supabase, Tailwind CSS, React Server Components

---

## Task 1: Extend API Endpoint for Posts Listing

**Files:**
- Create: `web/src/app/api/[url_prefix]/posts/route.ts`
- Reference: `web/src/app/api/[url_prefix]/route.ts` (existing journal API)
- Reference: `web/src/lib/supabase.ts` (Supabase client)

**Step 1: Create the posts listing API endpoint**

Create `web/src/app/api/[url_prefix]/posts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

interface PostsResponse {
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    meta_description: string | null;
    target_keyword: string | null;
    published_at: string;
    word_count: number;
    reading_time_minutes: number;
    view_count: number;
    audio_file_url: string | null;
    audio_duration_seconds: number | null;
    style_used: number;
  }>;
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

// GET published posts for a journal with pagination, sorting, and search
export async function GET(
  req: NextRequest,
  { params }: { params: { url_prefix: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    // First get the journal by url_prefix
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('id')
      .eq('url_prefix', params.url_prefix)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    // Build query with filters
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('journal_id', journal.id)
      .eq('status', 'published');

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Add sorting
    switch (sort) {
      case 'oldest':
        query = query.order('published_at', { ascending: true });
        break;
      case 'views':
        query = query.order('view_count', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      return handleError(error);
    }

    // Generate excerpts for posts
    const postsWithExcerpts = (posts || []).map(post => ({
      ...post,
      excerpt: post.content.slice(0, 150) + (post.content.length > 150 ? '...' : ''),
    }));

    const response: PostsResponse = {
      posts: postsWithExcerpts,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      limit,
      offset,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
```

**Step 2: Verify the API endpoint works**

Run: `curl http://localhost:3000/api/test-journal/posts?limit=5&offset=0&sort=newest`
Expected: JSON response with posts array, total count, and hasMore boolean

**Step 3: Commit**

```bash
git add web/src/app/api/[url_prefix]/posts/route.ts
git commit -m "feat: add posts listing API endpoint with pagination, sorting, and search"
```

---

## Task 2: Create Blog-Specific Type Definitions

**Files:**
- Create: `web/src/types/blog.ts`
- Reference: `mobile-app/types/draft.ts` (existing post types)

**Step 1: Create blog types**

Create `web/src/types/blog.ts`:

```typescript
// Blog listing page types
export interface JournalWithAuthor {
  id: string;
  url_prefix: string;
  display_name: string;
  description: string | null;
  created_at: string;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export interface PostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_description: string | null;
  target_keyword: string | null;
  published_at: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_file_url: string | null;
  audio_duration_seconds: number | null;
  style_used: number;
}

export interface PostsResponse {
  posts: PostCardData[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export type SortOption = 'newest' | 'oldest' | 'views' | 'title';

export interface BlogFilters {
  search: string;
  sort: SortOption;
}
```

**Step 2: Commit**

```bash
git add web/src/types/blog.ts
git commit -m "feat: add blog-specific type definitions"
```

---

## Task 3: Create Blog Utility Functions

**Files:**
- Create: `web/src/lib/blog-utils.ts`

**Step 1: Create blog utility functions**

Create `web/src/lib/blog-utils.ts`:

```typescript
/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format view count for display
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Format reading time
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength = 150): string {
  const cleaned = content.replace(/[#*`_\[\]]/g, '').slice(0, maxLength);
  return cleaned + (content.length > maxLength ? '...' : '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
```

**Step 2: Commit**

```bash
git add web/src/lib/blog-utils.ts
git commit -m "feat: add blog utility functions for formatting"
```

---

## Task 4: Create Blog Header Component

**Files:**
- Create: `web/src/components/blog/BlogHeader.tsx`

**Step 1: Create BlogHeader client component**

Create `web/src/components/blog/BlogHeader.tsx`:

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { JournalWithAuthor } from '@/types/blog';

interface BlogHeaderProps {
  journal: JournalWithAuthor;
}

export function BlogHeader({ journal }: BlogHeaderProps) {
  const { display_name, description, user_profiles } = journal;

  return (
    <header className="border-b border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          {/* Author Avatar */}
          <Link
            href={`/${journal.url_prefix}`}
            className="flex-shrink-0"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 sm:h-20 sm:w-20">
              {user_profiles.avatar_url ? (
                <Image
                  src={user_profiles.avatar_url}
                  alt={user_profiles.full_name || display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          {/* Journal Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {display_name}
            </h1>

            {description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                {description}
              </p>
            )}

            {user_profiles.bio && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                By {user_profiles.full_name || 'Anonymous'}
              </p>
            )}
          </div>

          {/* Action Buttons - Placeholder for future features */}
          <div className="flex gap-2 sm:mt-0">
            <button
              className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Share journal"
              title="Share (coming soon)"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog/BlogHeader.tsx
git commit -m "feat: add BlogHeader component with journal info"
```

---

## Task 5: Create Blog Controls Component

**Files:**
- Create: `web/src/components/blog/BlogControls.tsx`

**Step 1: Create BlogControls client component**

Create `web/src/components/blog/BlogControls.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { SortOption } from '@/types/blog';

interface BlogControlsProps {
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortOption) => void;
  initialSort?: SortOption;
}

export function BlogControls({
  onSearchChange,
  onSortChange,
  initialSort = 'newest'
}: BlogControlsProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Notify parent when debounced search changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'title', label: 'A-Z' },
  ];

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
              Sort:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value as SortOption;
                setSort(newSort);
                onSortChange(newSort);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog/BlogControls.tsx
git commit -m "feat: add BlogControls component with search and sort"
```

---

## Task 6: Create PostCard Component

**Files:**
- Create: `web/src/components/blog/PostCard.tsx`

**Step 1: Create PostCard client component**

Create `web/src/components/blog/PostCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { formatViewCount, formatDate, formatReadingTime } from '@/lib/blog-utils';
import type { PostCardData } from '@/types/blog';

interface PostCardProps {
  post: PostCardData;
  urlPrefix: string;
}

export function PostCard({ post, urlPrefix }: PostCardProps) {
  const {
    title,
    slug,
    excerpt,
    target_keyword,
    published_at,
    word_count,
    reading_time_minutes,
    view_count,
    audio_file_url,
    audio_duration_seconds,
  } = post;

  const postUrl = `/${urlPrefix}/${slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      {/* Featured Media - Audio Player or Placeholder */}
      <Link href={postUrl} className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
        {audio_file_url ? (
          <div className="flex h-full w-full items-center justify-center text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {audio_duration_seconds && (
                <span className="text-sm font-medium">
                  {Math.floor(audio_duration_seconds / 60)}:{(audio_duration_seconds % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-16 w-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Tags and Reading Time */}
        <div className="mb-2 flex items-center gap-2 text-xs">
          {target_keyword && (
            <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {target_keyword.toUpperCase()}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-500">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            {formatReadingTime(reading_time_minutes)}
          </span>
        </div>

        {/* Title */}
        <Link href={postUrl}>
          <h3 className="mb-2 text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {excerpt}
        </p>

        {/* Divider */}
        <hr className="my-3 border-gray-200 dark:border-gray-800" />

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-3">
            {/* View Count */}
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {formatViewCount(view_count)}
            </span>

            {/* Publish Date */}
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
              {formatDate(published_at)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Share post"
              title="Share"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog/PostCard.tsx
git commit -m "feat: add PostCard component with rich magazine-style layout"
```

---

## Task 7: Create PostCardGrid Component

**Files:**
- Create: `web/src/components/blog/PostCardGrid.tsx`

**Step 1: Create PostCardGrid client component**

Create `web/src/components/blog/PostCardGrid.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import type { PostCardData, SortOption } from '@/types/blog';

interface PostCardGridProps {
  initialPosts: PostCardData[];
  urlPrefix: string;
  total: number;
}

export function PostCardGrid({ initialPosts, urlPrefix, total }: PostCardGridProps) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < total);

  const fetchFilteredPosts = async (search: string, sort: SortOption) => {
    if (!search && sort === 'newest') {
      // Reset to initial posts
      setPosts(initialPosts);
      setHasMore(initialPosts.length < total);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: '0',
        sort,
        ...(search && { search }),
      });

      const response = await fetch(`/api/${urlPrefix}/posts?${params}`);
      const data = await response.json();

      setPosts(data.posts);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${urlPrefix}/posts?limit=12&offset=${posts.length}`);
      const data = await response.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose methods for parent controls
  useEffect(() => {
    // Store fetch function in window for controls component
    (window as any).__blogFetch = fetchFilteredPosts;
  }, [urlPrefix]);

  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No posts found</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Posts Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} urlPrefix={urlPrefix} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog/PostCardGrid.tsx
git commit -m "feat: add PostCardGrid component with filtering and pagination"
```

---

## Task 8: Create Loading Skeleton Component

**Files:**
- Create: `web/src/app/[url_prefix]/loading.tsx`

**Step 1: Create loading skeleton**

Create `web/src/app/[url_prefix]/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800 sm:h-20 sm:w-20" />
            <div className="flex-1 space-y-2">
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls Skeleton */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-t-xl bg-gray-200 dark:bg-gray-800" />
              <div className="rounded-b-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-2 h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-4 h-6 w-full rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-4 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-px bg-gray-200 dark:bg-gray-800" />
                <div className="mt-3 flex justify-between">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/app/[url_prefix]/loading.tsx
git commit -m "feat: add loading skeleton for blog listing page"
```

---

## Task 9: Create Main Blog Listing Page

**Files:**
- Create: `web/src/app/[url_prefix]/page.tsx`
- Create: `web/src/app/[url_prefix]/layout.tsx`

**Step 1: Create page layout**

Create `web/src/app/[url_prefix]/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'VoiceScribe - Blog',
  description: 'Voice-to-blog platform',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

**Step 2: Create main page server component**

Create `web/src/app/[url_prefix]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogControls } from '@/components/blog/BlogControls';
import { PostCardGrid } from '@/components/blog/PostCardGrid';
import type { JournalWithAuthor, PostCardData, SortOption } from '@/types/blog';

interface PageProps {
  params: {
    url_prefix: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: journal } = await supabase
    .from('journals')
    .select('display_name, description, user_profiles!inner(full_name, avatar_url)')
    .eq('url_prefix', params.url_prefix)
    .eq('is_active', true)
    .single();

  if (!journal) {
    return {
      title: 'Journal Not Found',
    };
  }

  return {
    title: `${journal.display_name} - Blog`,
    description: journal.description || `Read ${journal.display_name}'s latest blog posts`,
    openGraph: {
      title: journal.display_name,
      description: journal.description || '',
      type: 'website',
    },
  };
}

// Fetch data server-side
async function getJournalData(urlPrefix: string) {
  const { data: journal, error } = await supabase
    .from('journals')
    .select(
      `
      *,
      user_profiles!inner (
        full_name,
        avatar_url,
        bio
      )
    `
    )
    .eq('url_prefix', urlPrefix)
    .eq('is_active', true)
    .single();

  if (error || !journal) {
    return null;
  }

  // Fetch initial posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  const postsWithExcerpts = (posts || []).map((post) => ({
    ...post,
    excerpt: post.content.slice(0, 150) + (post.content.length > 150 ? '...' : ''),
  }));

  return {
    journal,
    posts: postsWithExcerpts,
    total: posts?.length || 0,
  };
}

export default async function BlogPage({ params }: PageProps) {
  const data = await getJournalData(params.url_prefix);

  if (!data) {
    notFound();
  }

  const { journal, posts, total } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <BlogHeader journal={journal as JournalWithAuthor} />

      <div className="sticky top-0 z-20">
        <BlogControls
          onSearchChange={(search) => {
            // Handled by PostCardGrid via window.__blogFetch
            if (typeof window !== 'undefined' && (window as any).__blogFetch) {
              (window as any).__blogFetch(search, 'newest');
            }
          }}
          onSortChange={(sort) => {
            if (typeof window !== 'undefined' && (window as any).__blogFetch) {
              (window as any).__blogFetch('', sort);
            }
          }}
        />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PostCardGrid
          initialPosts={posts as PostCardData[]}
          urlPrefix={params.url_prefix}
          total={total}
        />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add web/src/app/[url_prefix]/layout.tsx web/src/app/[url_prefix]/page.tsx
git commit -m "feat: add main blog listing page with SEO metadata"
```

---

## Task 10: Update Existing Journal API for Better Response

**Files:**
- Modify: `web/src/app/api/[url_prefix]/route.ts`

**Step 1: Update journal API to include user profile data**

The existing file already does this correctly. No changes needed.

**Step 2: Verify the API works**

Run: `curl http://localhost:3000/api/test-journal`
Expected: JSON response with journal data and user_profiles nested

---

## Task 11: Add Not Found Page

**Files:**
- Create: `web/src/app/[url_prefix]/not-found.tsx`

**Step 1: Create not found page**

Create `web/src/app/[url_prefix]/not-found.tsx`:

```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Journal not found
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          The journal you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/app/[url_prefix]/not-found.tsx
git commit -m "feat: add not found page for invalid journal URLs"
```

---

## Task 12: Update PostCardGrid with Better State Management

**Files:**
- Modify: `web/src/components/blog/PostCardGrid.tsx`

**Step 1: Update PostCardGrid to properly handle filter changes**

Replace the entire `web/src/components/blog/PostCardGrid.tsx` with this improved version:

```typescript
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import type { PostCardData, SortOption } from '@/types/blog';

interface PostCardGridProps {
  initialPosts: PostCardData[];
  urlPrefix: string;
  total: number;
}

export function PostCardGrid({ initialPosts, urlPrefix, total }: PostCardGridProps) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < total);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentSort, setCurrentSort] = useState<SortOption>('newest');
  const offsetRef = useRef(initialPosts.length);

  const fetchFilteredPosts = useCallback(async (search: string, sort: SortOption) => {
    // Reset to initial if no filters
    if (!search && sort === 'newest') {
      setPosts(initialPosts);
      setHasMore(initialPosts.length < total);
      offsetRef.current = initialPosts.length;
      setCurrentSearch('');
      setCurrentSort('newest');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: '0',
        sort,
        ...(search && { search }),
      });

      const response = await fetch(`/api/${urlPrefix}/posts?${params}`);
      const data = await response.json();

      setPosts(data.posts);
      setHasMore(data.hasMore);
      offsetRef.current = data.posts.length;
      setCurrentSearch(search);
      setCurrentSort(sort);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [urlPrefix, initialPosts, total]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '12',
        offset: offsetRef.current.toString(),
        sort: currentSort,
        ...(currentSearch && { search: currentSearch }),
      });

      const response = await fetch(`/api/${urlPrefix}/posts?${params}`);
      const data = await response.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      offsetRef.current += data.posts.length;
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  }, [urlPrefix, currentSearch, currentSort]);

  // Register fetch function globally for controls
  useEffect(() => {
    (window as any).__blogFetch = fetchFilteredPosts;
  }, [fetchFilteredPosts]);

  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No posts found</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} urlPrefix={urlPrefix} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog/PostCardGrid.tsx
git commit -m "fix: improve PostCardGrid state management for filters and pagination"
```

---

## Task 13: Test the Implementation

**Files:**
- Test: Manual browser testing
- Reference: `docs/database-schema copy.md`

**Step 1: Start the development server**

Run: `cd web && npm run dev`
Expected: Server starts on http://localhost:3000

**Step 2: Create test data via the mobile app or directly in the database**

Use Supabase dashboard or create a test journal with published posts:
```sql
-- Verify test journal exists
SELECT * FROM journals WHERE url_prefix = 'test-journal';

-- Verify published posts exist
SELECT id, title, slug, status FROM posts WHERE status = 'published' LIMIT 5;
```

**Step 3: Test the blog listing page**

1. Navigate to `http://localhost:3000/test-journal`
2. Verify:
   - Journal header displays correctly
   - Posts render as rich cards in a grid
   - Search input filters posts
   - Sort dropdown reorders posts
   - Load More button appears and works
   - Empty state shows when no results
   - Loading skeleton appears during navigation
   - 404 page shows for invalid URLs

**Step 4: Test responsive design**

1. Open browser DevTools
2. Test at:
   - Mobile: 375px wide
   - Tablet: 768px wide
   - Desktop: 1024px+ wide
3. Verify grid adjusts: 1 column → 2 columns → 3 columns

**Step 5: Test accessibility**

1. Use keyboard to navigate (Tab key)
2. Verify all interactive elements are focusable
3. Verify ARIA labels on buttons
4. Verify semantic HTML structure

**Step 6: Test API endpoints directly**

```bash
# Test posts listing
curl http://localhost:3000/api/test-journal/posts?limit=5&offset=0&sort=newest

# Test search
curl http://localhost:3000/api/test-journal/posts?search=productivity

# Test sorting
curl http://localhost:3000/api/test-journal/posts?sort=views
```

---

## Task 14: Add Error Handling

**Files:**
- Modify: `web/src/app/[url_prefix]/page.tsx`
- Create: `web/src/components/blog/ErrorState.tsx`

**Step 1: Create error state component**

Create `web/src/components/blog/ErrorState.tsx`:

```typescript
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-4 h-16 w-16 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Oops! Something went wrong</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {message || 'Failed to load posts. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
```

**Step 2: Update PostCardGrid to use error boundary**

Update the fetchFilteredPosts in `web/src/components/blog/PostCardGrid.tsx`:

```typescript
// Add error state
const [error, setError] = useState<string | null>(null);

// Update fetchFilteredPosts to handle errors
const fetchFilteredPosts = useCallback(async (search: string, sort: SortOption) => {
  // ... existing reset logic ...

  setLoading(true);
  setError(null);

  try {
    const params = new URLSearchParams({
      limit: '12',
      offset: '0',
      sort,
      ...(search && { search }),
    });

    const response = await fetch(`/api/${urlPrefix}/posts?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const data = await response.json();
    setPosts(data.posts);
    setHasMore(data.hasMore);
    offsetRef.current = data.posts.length;
    setCurrentSearch(search);
    setCurrentSort(sort);
  } catch (err) {
    console.error('Failed to fetch posts:', err);
    setError('Unable to load posts. Please try again.');
  } finally {
    setLoading(false);
  }
}, [urlPrefix, initialPosts, total]);

// Add error display in return
if (error) {
  return <ErrorState message={error} onRetry={() => fetchFilteredPosts(currentSearch, currentSort)} />;
}
```

**Step 3: Commit**

```bash
git add web/src/components/blog/ErrorState.tsx web/src/components/blog/PostCardGrid.tsx
git commit -m "feat: add error handling with error state component"
```

---

## Task 15: Final Polish and Documentation

**Files:**
- Create: `docs/BLOG_PAGE_GUIDE.md`

**Step 1: Create documentation**

Create `docs/BLOG_PAGE_GUIDE.md`:

```markdown
# Blog Listing Page Guide

## Overview

The blog listing page displays published posts from a user's journal at `example.com/[url_prefix]`.

## File Structure

```
web/src/
├── app/
│   └── [url_prefix]/
│       ├── page.tsx              (Main server component)
│       ├── loading.tsx           (Loading skeleton)
│       ├── layout.tsx            (Page layout)
│       └── not-found.tsx         (404 page)
├── components/
│   └── blog/
│       ├── BlogHeader.tsx        (Journal info header)
│       ├── BlogControls.tsx      (Search and sort controls)
│       ├── PostCard.tsx          (Individual post card)
│       ├── PostCardGrid.tsx      (Grid with state management)
│       └── ErrorState.tsx        (Error display)
├── lib/
│   └── blog-utils.ts             (Helper functions)
├── types/
│   └── blog.ts                   (Type definitions)
└── app/
    └── api/
        └── [url_prefix]/
            └── posts/
                └── route.ts      (Posts API endpoint)
```

## API Endpoints

### GET /api/[url_prefix]/posts

Fetch published posts for a journal.

**Query Parameters:**
- `limit` (number, default: 12) - Posts per page
- `offset` (number, default: 0) - Pagination offset
- `sort` (string, default: 'newest') - Sort order: 'newest', 'oldest', 'views', 'title'
- `search` (string) - Search query

**Response:**
```json
{
  "posts": [...],
  "total": 25,
  "hasMore": true,
  "limit": 12,
  "offset": 0
}
```

## Component Props Reference

### BlogHeader
```typescript
interface BlogHeaderProps {
  journal: JournalWithAuthor;
}
```

### BlogControls
```typescript
interface BlogControlsProps {
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortOption) => void;
  initialSort?: SortOption;
}
```

### PostCard
```typescript
interface PostCardProps {
  post: PostCardData;
  urlPrefix: string;
}
```

### PostCardGrid
```typescript
interface PostCardGridProps {
  initialPosts: PostCardData[];
  urlPrefix: string;
  total: number;
}
```

## Utility Functions

### formatDate(dateString: string)
Returns human-readable date (e.g., "2 days ago", "3 weeks ago").

### formatViewCount(count: number)
Returns formatted view count (e.g., "1.2K", "1.5M").

### formatReadingTime(minutes: number)
Returns reading time string (e.g., "5 min read").

### generateExcerpt(content: string, maxLength?: number)
Generates excerpt from markdown content.

## Styling Guidelines

- Use Tailwind CSS classes
- Support light and dark modes
- Responsive: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Use semantic HTML: `<article>`, `<header>`, `<main>`

## Testing Checklist

- [ ] Journal header displays correctly
- [ ] Posts render in grid layout
- [ ] Search filters posts
- [ ] Sort dropdown reorders posts
- [ ] Load More button works
- [ ] Empty state displays
- [ ] Error state displays
- [ ] Loading skeleton shows
- [ ] 404 page for invalid URLs
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Keyboard navigation
- [ ] SEO metadata renders
```

**Step 2: Final commit**

```bash
git add docs/BLOG_PAGE_GUIDE.md
git commit -m "docs: add blog listing page guide"
```

---

## Verification Checklist

After completing all tasks:

- [ ] All components created and committed
- [ ] API endpoints return correct data
- [ ] Blog listing page renders at `localhost:3000/[url_prefix]`
- [ ] Search functionality works
- [ ] Sort options work correctly
- [ ] Load More pagination works
- [ ] Empty state displays when no posts
- [ ] Error state displays on API failures
- [ ] Loading skeleton shows during navigation
- [ ] 404 page for invalid journal URLs
- [ ] Responsive grid layout (1/2/3 columns)
- [ ] SEO metadata renders correctly
- [ ] Dark mode styling works
- [ ] Keyboard navigation works
- [ ] ARIA labels present on interactive elements

---

**Total Estimated Time:** 3-4 hours

**Dependencies:**
- Next.js 13+ with App Router
- Supabase client configured
- Existing journal and posts data in database

**Next Steps After Implementation:**
1. Deploy to Vercel for testing
2. Add cover image support for posts
3. Add social sharing functionality
4. Add RSS feed generation
5. Add subscribe/follow feature
