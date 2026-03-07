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
- [ ] Sort options work correctly
- [ ] Load More button works
- [ ] Empty state displays
- [ ] Error state displays
- [ ] Loading skeleton shows
- [ ] 404 page for invalid URLs
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Keyboard navigation
- [ ] SEO metadata renders
