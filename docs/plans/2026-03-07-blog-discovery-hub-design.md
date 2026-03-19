# Blog Discovery Hub Design

**Date:** 2026-03-07
**Status:** Approved
**Approach:** Single-Page Scroll Layout

---

## Overview

A multi-blog discovery hub at the root route (`/`) that showcases multiple users/blogs for visitors to discover. This is the main landing page that first-time visitors see.

---

## Goals

1. Showcase the community of blogs on the platform
2. Help visitors discover new blogs and posts
3. Convert visitors into blog creators with prominent CTAs

---

## Page Structure

**Route:** `web/src/app/page.tsx` (root page)

**Layout stack (top to bottom):**

1. **Hero Section** - Full viewport height or comfortable padding
2. **Search & Filter Bar** - Prominent below hero
3. **Featured Blogs Grid** - Sorted by newest created
4. **Recent Posts Feed** - Aggregated posts from all blogs

---

## Components

### HeroSection (`HeroSection.tsx`)
- Headline: "Discover Voices & Stories"
- Subtext: Platform tagline
- CTA buttons: "Start Your Blog" + "Explore"
- Optional: Subtle background gradient

### DiscoverySearch (`DiscoverySearch.tsx`)
- Text input for searching blogs by name/description
- Filter tags: "Newest", "Most Active", "Most Posts"
- Client component with URL params for state

### BlogDiscoveryCard (`BlogDiscoveryCard.tsx`)
- Author avatar (circular)
- Author name (bold, linkable)
- Post count (e.g., "12 posts")
- Latest post title (truncated, linkable)
- "Last updated" timestamp
- Hover effect: Subtle lift or border highlight

### RecentPostsFeed (`RecentPostsFeed.tsx`)
- Reuses existing `PostCard` component
- Section header: "Latest from the Community"
- Load more button
- Shows posts from all blogs aggregated

---

## Data Flow & API

**Server-side data fetching (RSC):**

The root page fetches:
1. **Featured blogs** - New blogs, sorted by creation date (limit: 12-24)
2. **Recent posts** - Latest posts across all blogs (limit: 12)

**New API endpoint:**
- `web/src/app/api/discover/route.ts` - Returns featured blogs and recent posts
- Query params: `?blogsLimit=12&postsLimit=12&sort=newest`

**Client components receive:**
- Initial data as props (no loading state on initial render)
- Fetch more data via the same API endpoint for pagination

---

## Error Handling & Edge Cases

**Empty states:**
- **No blogs exist**: "Be the first to start a blog" with CTA
- **No posts exist**: "No posts yet" message

**Loading states:**
- Initial page load: Uses `loading.tsx` with skeleton
- Load more: Button shows spinner during fetch

**Error states:**
- API failure: Reusable `ErrorState` component (already exists)
- Retry button on error state

**SEO metadata:**
- Page title: "VoiceScribe - Discover Blogs & Stories"
- Meta description: Platform description
- Open Graph tags for sharing

---

## Styling & Theming

**Design tokens:**
- Reuses existing Tailwind config
- Supports light/dark mode throughout
- Consistent spacing: `gap-6` or `gap-8` between cards

**Responsive breakpoints:**
```
Mobile (< 640px):   1 column, stacked
Tablet (640-1024):  2 columns for blogs
Desktop (> 1024):   3 columns for blogs
```

**Visual hierarchy:**
- Hero: Largest typography, gradient background option
- Section headings: `text-2xl` or `text-3xl`, semibold
- Cards: White/dark surface, subtle border, shadow-sm

**Animations:**
- Cards: `transition-all duration-200` on hover
- Load more: Minimal spinner
- No complex page transitions

---

## File Structure

**New files to create:**
```
web/src/
├── app/
│   ├── page.tsx                 (Root page - server component)
│   ├── loading.tsx              (Loading skeleton)
│   └── api/
│       └── discover/
│           └── route.ts         (Discovery API endpoint)
├── components/
│   └── discover/
│       ├── HeroSection.tsx      (Hero with CTA)
│       ├── DiscoverySearch.tsx  (Search & filters)
│       ├── BlogDiscoveryCard.tsx (Blog card)
│       └── RecentPostsFeed.tsx  (Recent posts wrapper)
├── types/
│   └── discover.ts              (Type definitions)
└── lib/
    └── discover-utils.ts        (Helper functions)
```

**Reuses existing components:**
- `PostCard.tsx` - For individual post cards in feed
- `ErrorState.tsx` - For error display

---

## Testing Checklist

- [ ] Page loads without errors
- [ ] Hero renders with CTAs
- [ ] Featured blogs grid displays (3/2/1 columns responsive)
- [ ] Blog cards show correct info (avatar, name, post count, latest post)
- [ ] Search filters blogs by name
- [ ] Recent posts feed shows aggregated posts
- [ ] Load more works for both sections
- [ ] Empty states display when no data
- [ ] Dark mode works
- [ ] SEO metadata present

---

## Tech Stack

- Next.js 13+ App Router with React Server Components
- TypeScript
- Supabase for data
- Tailwind CSS for styling
