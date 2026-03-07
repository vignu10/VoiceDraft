# Blog Post Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a blog post detail page with markdown rendering, syntax-highlighted code blocks, table of contents, post metadata, and related posts.

**Architecture:** Server-side data fetching from Supabase with client-side markdown rendering using react-markdown + react-syntax-highlighter. Modular component structure with reusable MarkdownRenderer, TableOfContents, PostMeta, and RelatedPosts components.

**Tech Stack:** Next.js 13+, TypeScript, Supabase, Tailwind CSS, react-markdown, react-syntax-highlighter, remark-gfm, rehype-raw, rehype-slug

---

## Task 1: Install NPM Dependencies

**Files:**
- Modify: `web/package.json`

**Step 1: Install markdown and syntax highlighting packages**

Run: `cd web && npm install react-markdown react-syntax-highlighter remark-gfm rehype-raw rehype-slug unist-util-visit @types/react-syntax-highlighter`

Expected: Packages installed successfully

**Step 2: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "deps: install markdown rendering and syntax highlighting packages"
```

---

## Task 2: Create Blog Post Types

**Files:**
- Create: `web/src/types/blog-post.ts`

**Step 1: Create type definitions**

```typescript
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  target_keyword: string | null;
  published_at: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_file_url: string | null;
  audio_duration_seconds: number | null;
  journal_id: string;
  journals: {
    id: string;
    display_name: string;
    url_prefix: string;
    user_profiles: {
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    } | null;
  };
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  headings: Heading[];
  activeId: string;
  urlPrefix: string;
}

export interface MarkdownRendererProps {
  content: string;
}

export interface PostMetaProps {
  post: BlogPost;
  urlPrefix: string;
}

export interface RelatedPostsProps {
  currentPostId: string;
  journalId: string;
  urlPrefix: string;
}
```

**Step 2: Commit**

```bash
git add web/src/types/blog-post.ts
git commit -m "types: add blog post detail page types"
```

---

## Task 3: Create Markdown Utility Functions

**Files:**
- Create: `web/src/lib/markdown-utils.ts`

**Step 1: Create markdown utilities**

```typescript
import { visit } from 'unist-util-visit';
import type { Heading } from '@/types/blog-post';

/**
 * Extract headings from markdown content for table of contents
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Match ## or ### headings
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = generateSlug(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Calculate reading time from word count
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
```

**Step 2: Commit**

```bash
git add web/src/lib/markdown-utils.ts
git commit -m "utils: add markdown utility functions"
```

---

## Task 4: Create MarkdownRenderer Component

**Files:**
- Create: `web/src/components/blog-post/MarkdownRenderer.tsx`

**Step 1: Create MarkdownRenderer component**

```tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MarkdownRendererProps } from '@/types/blog-post';
import { useTheme } from 'next-themes';

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={{
        // Headings with anchor links
        h1: ({ children, id }) => (
          <h1 id={id} className="scroll-mt-20 text-4xl font-bold text-neutral-900 dark:text-white">
            {children}
          </h1>
        ),
        h2: ({ children, id }) => (
          <h2 id={id} className="scroll-mt-20 mt-12 mb-4 text-3xl font-semibold text-neutral-900 dark:text-white">
            {children}
          </h2>
        ),
        h3: ({ children, id }) => (
          <h3 id={id} className="scroll-mt-20 mt-8 mb-3 text-2xl font-semibold text-neutral-900 dark:text-white">
            {children}
          </h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed text-neutral-700 dark:text-neutral-300">
            {children}
          </p>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-accent hover:underline"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-2 text-neutral-700 dark:text-neutral-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-2 text-neutral-700 dark:text-neutral-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-neutral-700 dark:text-neutral-300">{children}</li>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-accent pl-4 italic text-neutral-600 dark:text-neutral-400">
            {children}
          </blockquote>
        ),
        // Code blocks with syntax highlighting
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          if (language) {
            return (
              <div className="group relative mb-4">
                <SyntaxHighlighter
                  language={language}
                  style={isDark ? vscDarkPlus : vs}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
                <button
                  onClick={() => navigator.clipboard.writeText(String(children))}
                  className="absolute right-2 top-2 rounded bg-neutral-700 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Copy code"
                >
                  Copy
                </button>
              </div>
            );
          }

          return (
            <code
              className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="my-4 rounded-lg"
            loading="lazy"
          />
        ),
        // Horizontal rule
        hr: () => <hr className="my-8 border-neutral-300 dark:border-neutral-700" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog-post/MarkdownRenderer.tsx
git commit -m "feat: add MarkdownRenderer component with syntax highlighting"
```

---

## Task 5: Create TableOfContents Component

**Files:**
- Create: `web/src/components/blog-post/TableOfContents.tsx`

**Step 1: Create TableOfContents component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TableOfContentsProps, Heading } from '@/types/blog-post';

export function TableOfContents({ headings, activeId, urlPrefix }: TableOfContentsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter only H2 and H3 headings
  const tocHeadings = headings.filter(h => h.level >= 2 && h.level <= 3);

  if (tocHeadings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile TOC Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden mb-4 w-full rounded-lg border border-neutral-200 bg-white p-3 text-left dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="font-medium text-neutral-900 dark:text-white">
          {isMobileOpen ? 'Hide' : 'Show'} Table of Contents
        </span>
      </button>

      {/* TOC Sidebar */}
      <nav
        className={cn(
          'lg:sticky lg:top-20 lg:self-start',
          isMobileOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">
            On This Page
          </h3>
          <ul className="space-y-2">
            {tocHeadings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    'block text-sm transition-colors hover:text-accent',
                    heading.level === 3 && 'pl-4',
                    activeId === heading.id
                      ? 'font-medium text-accent'
                      : 'text-neutral-600 dark:text-neutral-400'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                    setIsMobileOpen(false);
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

// Hook to detect active heading on scroll
export function useActiveHeading(headings: Heading[]) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%', threshold: 0 }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog-post/TableOfContents.tsx
git commit -m "feat: add TableOfContents component with active section tracking"
```

---

## Task 6: Create PostMeta Component

**Files:**
- Create: `web/src/components/blog-post/PostMeta.tsx`

**Step 1: Create PostMeta component**

```tsx
import { formatDate, formatReadingTime, formatViewCount } from '@/lib/blog-utils';
import type { PostMetaProps } from '@/types/blog-post';

export function PostMeta({ post, urlPrefix }: PostMetaProps) {
  const { title, published_at, reading_time_minutes, view_count, target_keyword, journals } = post;

  return (
    <div className="mb-8">
      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold text-neutral-900 dark:text-white sm:text-5xl">
        {title}
      </h1>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        {/* Date */}
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span>{formatDate(published_at)}</span>
        </div>

        {/* Reading time */}
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span>{formatReadingTime(reading_time_minutes)}</span>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <span>{formatViewCount(view_count)} views</span>
        </div>

        {/* Tags */}
        {target_keyword && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="font-medium text-accent">{target_keyword}</span>
          </>
        )}
      </div>

      {/* Author info */}
      {journals?.user_profiles && (
        <div className="mt-4 flex items-center gap-3">
          {journals.user_profiles.avatar_url ? (
            <img
              src={journals.user_profiles.avatar_url}
              alt={journals.user_profiles.full_name || 'Author'}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
              {journals.user_profiles.full_name?.[0] || '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {journals.user_profiles.full_name || journals.display_name}
            </p>
            {journals.user_profiles.bio && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {journals.user_profiles.bio}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog-post/PostMeta.tsx
git commit -m "feat: add PostMeta component with author info"
```

---

## Task 7: Create RelatedPosts Component

**Files:**
- Create: `web/src/components/blog-post/RelatedPosts.tsx`

**Step 1: Create RelatedPosts component**

```tsx
import { supabase } from '@/lib/supabase';
import type { RelatedPostsProps, BlogPost } from '@/types/blog-post';
import { PostCard } from '@/components/blog/PostCard';

async function getRelatedPosts(journalId: string, currentPostId: string, limit = 4) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journalId)
    .eq('status', 'published')
    .neq('id', currentPostId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((post) => ({
    id: post.id,
    title: post.title || 'Untitled',
    slug: post.slug || '',
    excerpt: post.content ? post.content.slice(0, 150) + '...' : '',
    content: post.content || '',
    meta_description: post.meta_description,
    target_keyword: post.target_keyword,
    published_at: post.published_at || new Date().toISOString(),
    word_count: post.word_count || 0,
    reading_time_minutes: post.reading_time_minutes || 1,
    view_count: post.view_count || 0,
    audio_file_url: post.audio_file_url,
    audio_duration_seconds: post.audio_duration_seconds,
    style_used: post.style_used || 0,
  }));
}

export async function RelatedPosts({ currentPostId, journalId, urlPrefix }: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts(journalId, currentPostId);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white">
        Related Posts
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {relatedPosts.map((post) => (
          <PostCard key={post.id} post={post} urlPrefix={urlPrefix} />
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/blog-post/RelatedPosts.tsx
git commit -m "feat: add RelatedPosts component"
```

---

## Task 8: Create Blog Post Detail Page

**Files:**
- Create: `web/src/app/[url_prefix]/[slug]/page.tsx`
- Create: `web/src/app/[url_prefix]/[slug]/loading.tsx`

**Step 1: Create the page component**

```tsx
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogControls } from '@/components/blog/BlogControls';
import { MarkdownRenderer } from '@/components/blog-post/MarkdownRenderer';
import { TableOfContents, useActiveHeading } from '@/components/blog-post/TableOfContents';
import { PostMeta } from '@/components/blog-post/PostMeta';
import { RelatedPosts } from '@/components/blog-post/RelatedPosts';
import { extractHeadings } from '@/lib/markdown-utils';
import type { BlogPost, Heading } from '@/types/blog-post';
import 'react-syntax-highlighter/dist/esm/styles/prism';

interface PageProps {
  params: {
    url_prefix: string;
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      journals (
        display_name,
        url_prefix
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - ${post.journals?.display_name || 'Blog'}`,
    description: post.meta_description || post.content?.slice(0, 160) || '',
    openGraph: {
      title: post.title,
      description: post.meta_description || post.content?.slice(0, 160) || '',
      type: 'article',
      publishedTime: post.published_at,
    },
  };
}

// Fetch data server-side
async function getPostData(urlPrefix: string, slug: string) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        journals (
          *,
          user_profiles (
            full_name,
            avatar_url,
            bio
          )
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      console.error('Post fetch error:', error);
      return null;
    }

    // Verify URL prefix matches
    if (post.journals?.url_prefix !== urlPrefix) {
      return null;
    }

    return post as BlogPost;
  } catch (error) {
    console.error('getPostData error:', error);
    return null;
  }
}

// Active heading wrapper component
function TableOfContentsWrapper({ headings, urlPrefix }: { headings: Heading[]; urlPrefix: string }) {
  const activeId = useActiveHeading(headings);
  return <TableOfContents headings={headings} activeId={activeId} urlPrefix={urlPrefix} />;
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostData(params.url_prefix, params.slug);

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content || '');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <BlogHeader journal={post.journals} />

      <div className="sticky top-0 z-20">
        <BlogControls />
      </div>

      <main className="container-wide py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
          <article className="min-w-0">
            <PostMeta post={post} urlPrefix={params.url_prefix} />
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MarkdownRenderer content={post.content || ''} />
            </div>
            <RelatedPosts
              currentPostId={post.id}
              journalId={post.journal_id}
              urlPrefix={params.url_prefix}
            />
          </article>

          {/* TOC Sidebar */}
          <aside className="hidden lg:block">
            <TableOfContentsWrapper headings={headings} urlPrefix={params.url_prefix} />
          </aside>
        </div>

        {/* Mobile TOC */}
        <div className="lg:hidden mt-8">
          <TableOfContentsWrapper headings={headings} urlPrefix={params.url_prefix} />
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Create loading state**

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="animate-pulse">
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800" />
        <div className="container-wide py-8">
          <div className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800 mb-4" />
          <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add web/src/app/[url_prefix]/[slug]/page.tsx web/src/app/[url_prefix]/[slug]/loading.tsx
git commit -m "feat: add blog post detail page with markdown rendering"
```

---

## Task 9: Create Not Found Page

**Files:**
- Create: `web/src/app/[url_prefix]/[slug]/not-found.tsx`

**Step 1: Create not found page**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900 dark:text-white">404</h1>
        <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400">
          Post not found
        </p>
        <p className="mt-2 text-neutral-500 dark:text-neutral-500">
          This post doesn't exist or isn't published.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/app/[url_prefix]/[slug]/not-found.tsx
git commit -m "feat: add not found page for blog posts"
```

---

## Task 10: Update Types Export

**Files:**
- Modify: `web/src/types/blog.ts`

**Step 1: Export blog post types**

Add to existing blog.ts:

```typescript
// Re-export blog post types for convenience
export type { BlogPost, Heading, TableOfContentsProps, MarkdownRendererProps, PostMetaProps, RelatedPostsProps } from './blog-post';
```

**Step 2: Commit**

```bash
git add web/src/types/blog.ts
git commit -m "types: re-export blog post types"
```

---

## Testing Checklist

After implementation, verify:

1. **Markdown Rendering**
   - Headers (H1, H2, H3) render with proper styling
   - Code blocks have syntax highlighting and copy button
   - Lists, blockquotes, and links render correctly
   - Images display properly

2. **Table of Contents**
   - Extracts H2 and H3 headings correctly
   - Smooth scroll navigation works
   - Active section highlights on scroll
   - Mobile toggle works

3. **Post Meta**
   - Title, date, reading time, views display
   - Author info shows avatar and bio
   - Tags/keywords display

4. **Related Posts**
   - Fetches from same journal
   - Excludes current post
   - Uses PostCard component

5. **SEO**
   - Dynamic metadata generates correctly
   - Open Graph tags present
   - 404 page works for invalid slugs

6. **Responsive**
   - Desktop: Two-column layout with sticky TOC
   - Tablet: Collapsible TOC
   - Mobile: Single column with collapsible TOC

---

## Summary

This plan creates a complete blog post detail page with:
- Server-side data fetching from Supabase
- Client-side markdown rendering with react-markdown
- Syntax-highlighted code blocks with copy functionality
- Auto-generated table of contents with active section tracking
- Post metadata display with author info
- Related posts section
- SEO metadata and 404 handling
- Responsive design for all screen sizes
