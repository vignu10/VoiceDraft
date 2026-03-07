# Blog Listing Page Design Document

**Date**: 2026-03-07
**Author**: Design Specification
**Status**: Approved

---

## Overview

Design a blog listing page for the VoiceDraft web application that displays published blog posts from a user's journal. The page will use Next.js App Router with Server Components for optimal performance and SEO.

---

## Problem Statement

Users can create and publish blog posts from the VoiceDraft mobile app, but there is no web UI to display these published blogs. The API infrastructure exists, but frontend pages need to be built.

---

## Goals

1. Display all published posts from a user's journal at `example.com/[url_prefix]`
2. Provide rich, magazine-style post cards with full metadata
3. Enable discovery through search, filtering, and sorting
4. Implement efficient pagination for large numbers of posts
5. Optimize for SEO and performance

---

## Architecture

### Technology Stack

- **Framework**: Next.js 13+ App Router
- **Rendering**: React Server Components (RSC) with selective Client Components
- **Data Fetching**: Direct Supabase queries (server-side) + API routes (client-side)
- **Styling**: Tailwind CSS (existing)
- **Language**: TypeScript

### Component Hierarchy

```
[ url_prefix ]/page.tsx          (Server Component)
├── BlogHeader                   (Client - Journal info, author profile)
├── BlogControls                 (Client - Search, sort, filter UI)
├── PostCardGrid                 (Client - Grid with state management)
│   └── PostCard                 (Client - Individual post card)
└── LoadMoreButton               (Client - Pagination)
```

---

## Page Layout

### Header Section

```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar]  John's Tech Blog                    [@] [⊙]       │
│                                                             │
│  Thoughts on programming, startups, and tech               │
│  from a solo founder building in public                    │
└─────────────────────────────────────────────────────────────┘
```

**Elements**:
- Journal display name
- Journal description
- Author avatar (from user_profiles)
- Social links (placeholder for future)
- Action buttons (share journal, subscribe placeholder)

### Controls Section

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 [Search posts...]              ↓ Sort: [Newest ▼]       │
└─────────────────────────────────────────────────────────────┘
```

**Elements**:
- Debounced search input (300ms delay)
- Sort dropdown (Newest, Oldest, Most Viewed, A-Z)

### Post Grid Section

```
┌─────────────────────────────────────────────────────────────┐
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  🎙️ Audio Player   │  │  📷 Featured Img   │            │
│  │                    │  │                    │            │
│  │  🏷️ PRODUCTIVITY   │  │  🏷️ STARTUP       │            │
│  │                    │  │                    │            │
│  │  10 Productivity   │  │  How I Validated   │            │
│  │  Tips That...      │  │  My SaaS Idea      │            │
│  │                    │  │                    │            │
│  │  👤 John  👁️ 1.2K  │  │  👤 John  👁️ 856   │            │
│  │  📅 Mar 5  ⭐ 5 min│  │  📅 Mar 3  ⭐ 4 min│            │
│  │                    │  │                    │            │
│  │  [📤] [⭐]         │  │  [📤] [⭐]         │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  📷 Featured Img   │  │  🎙️ Audio Player   │            │
│  │  ...               │  │  ...               │            │
│  └────────────────────┘  └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Layout**:
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Gap: 1.5rem between cards

### Post Card Design

**Rich Magazine Card Structure**:

```tsx
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │   🎙️ Audio Player or Featured Image  │  │
│  │   (16:9 aspect ratio)                │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  🏷️ KEYWORD  ⭐ 5 min read                │
│                                            │
│  SEO-Optimized Title That                 │
│  Captures Reader Attention                │
│                                            │
│  Compelling excerpt from the post         │
│  content that hooks readers...            │
│                                            │
│  ───────────────────────────────────────  │
│                                            │
│  👤 John Doe  👁️ 1,234 views  📅 Mar 5   │
│                                            │
│  [📤 Share] [⭐ Bookmark] [→ Read]        │
└────────────────────────────────────────────┘
```

**Card Elements**:
- **Featured Media**: Audio waveform player OR placeholder image gradient
- **Tags**: Target keyword displayed as pill tag
- **Reading Time**: Calculated from word_count (÷200 words/min)
- **Title**: Full post title (linked to post page)
- **Excerpt**: First ~150 characters of content
- **Metadata Row**: Author avatar + name, view count, publish date
- **Action Buttons**: Share, bookmark, read more

---

## Data Model

### PostCard Type

```typescript
interface PostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;        // First 150 chars of content
  content: string;
  meta_description?: string;
  target_keyword?: string;
  published_at: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_file_url?: string;
  audio_duration_seconds?: number;
  style_used: 0 | 1 | 2;

  // Join data
  author: {
    full_name: string;
    avatar_url?: string;
  };
}
```

---

## API Specification

### GET /api/[url_prefix]/posts

**Purpose**: Fetch published posts for a journal with filtering, sorting, and pagination.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 12 | Posts per page |
| `offset` | number | 0 | Pagination offset |
| `sort` | string | 'newest' | 'newest' \| 'oldest' \| 'views' \| 'title' |
| `search` | string | - | Search query (title + content) |

**Response**:

```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "First 150 characters...",
      "content": "Full markdown",
      "meta_description": "SEO meta",
      "target_keyword": "keyword",
      "published_at": "2026-03-07T10:00:00Z",
      "word_count": 1200,
      "reading_time_minutes": 6,
      "view_count": 42,
      "audio_file_url": "https://...",
      "audio_duration_seconds": 180,
      "style_used": 0
    }
  ],
  "total": 25,
  "hasMore": true,
  "limit": 12,
  "offset": 0
}
```

---

## User Interactions

### Search

1. User types in search box
2. Input debounced (300ms)
3. Client component fetches filtered posts
4. Grid updates with results
5. Shows "No posts found" if empty

### Sort

1. User selects sort option from dropdown
2. Client component fetches re-sorted posts
3. Grid re-renders with new order

### Pagination

1. Initial load shows 12 posts
2. "Load More" button visible if hasMore === true
3. Clicking fetches next 12 posts
4. New posts appended to grid
5. Button hides when no more posts

---

## Styling Guidelines

### Color Palette

- **Primary**: Existing brand colors
- **Card Background**: White (light), gray-800 (dark mode)
- **Card Border**: gray-200 (light), gray-700 (dark mode)
- **Text**: gray-900 (primary), gray-600 (secondary)
- **Tags**: Brand gradient background

### Typography

- **Title**: 20px, semibold, line-clamp-2
- **Excerpt**: 14px, regular, line-clamp-3
- **Metadata**: 12px, medium, gray-500

### Spacing

- **Card Padding**: 1.5rem
- **Element Gap**: 0.75rem
- **Grid Gap**: 1.5rem

---

## Performance Considerations

1. **Server Component**: Main page fetches data server-side (no client JS for initial render)
2. **Image Optimization**: Use Next.js Image for avatars
3. **Audio Player**: Lazy load, only initialize when in viewport
4. **Debouncing**: Search input debounced to reduce API calls
5. **Pagination**: Limit 12 posts per page, add offset indexing

---

## SEO Optimization

### Metadata

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const journal = await fetchJournal(params.url_prefix);

  return {
    title: `${journal.display_name} - Blog`,
    description: journal.description || `Read ${journal.display_name}'s latest posts`,
    openGraph: {
      title: journal.display_name,
      description: journal.description,
      images: journal.user_profiles.avatar_url
        ? [{ url: journal.user_profiles.avatar_url }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: journal.display_name,
      description: journal.description,
    },
  };
}
```

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Journal Display Name",
  "description": "Journal description",
  "url": "https://example.com/url_prefix",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "blogPost": [
    {
      "@type": "BlogPosting",
      "headline": "Post Title",
      "url": "https://example.com/url_prefix/post-slug",
      "datePublished": "2026-03-07"
    }
  ]
}
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Journal not found | 404 page with "Journal not found" message |
| No published posts | Empty state with "No posts yet" illustration |
| Search no results | "No posts match your search" with clear button |
| API error | Error toast with retry option |
| Invalid sort parameter | Default to 'newest', show warning toast |

---

## Accessibility

- **Semantic HTML**: `<article>`, `<time>`, `<header>`, `<nav>`
- **ARIA Labels**: All buttons and inputs labeled
- **Keyboard Navigation**: Tab through cards, Enter to open
- **Screen Reader**: Announce search results count
- **Focus Management**: Visible focus indicators
- **Alt Text**: All images have descriptive alt text

---

## Future Enhancements

- Cover images for posts (currently using audio/placeholder)
- Tag/category filtering
- Social sharing (Twitter, LinkedIn, etc.)
- Subscribe/follow functionality
- RSS feed generation
- Related posts section
- Dark mode toggle (if not global)

---

## Implementation Checklist

- [ ] Create `/web/src/app/[url_prefix]/page.tsx` server component
- [ ] Create `/web/src/app/[url_prefix]/loading.tsx` loading skeleton
- [ ] Extend `/web/src/app/api/[url_prefix]/route.ts` with posts endpoint
- [ ] Build BlogHeader component
- [ ] Build BlogControls component (search, sort)
- [ ] Build PostCard component with rich styling
- [ ] Build PostCardGrid with state management
- [ ] Build LoadMoreButton for pagination
- [ ] Add SEO metadata (generateMetadata)
- [ ] Add error handling and loading states
- [ ] Test responsive design
- [ ] Test accessibility

---

*End of Design Document*
