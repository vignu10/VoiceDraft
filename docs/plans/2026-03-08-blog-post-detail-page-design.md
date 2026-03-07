# Blog Post Detail Page Design

**Date:** 2026-03-08
**Status:** Approved

## Overview

A dynamic blog post detail page that displays individual blog posts with properly rendered markdown, syntax-highlighted code blocks, table of contents, and related posts. Uses react-markdown + react-syntax-highlighter for documentation-style presentation.

---

## Goals

1. Render markdown content properly (headers, lists, code blocks, etc.)
2. Display syntax-highlighted code blocks with copy functionality
3. Auto-generate table of contents from headings
4. Show post metadata (date, reading time, author info)
5. Display related posts from the same blog

---

## Approach

**Selected:** react-markdown + react-syntax-highlighter

**Reasoning:** Mature SSR-compatible libraries with excellent documentation-style rendering capabilities.

---

## Page Structure

**Route:** `web/src/app/[url_prefix]/[slug]/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Blog Header (existing component)        │
├─────────────────────────────────────────┤
│ Post Meta (title, date, reading time)    │
├─────────────────────────────────────────┤
│ Table of Contents (auto-generated)      │
├─────────────────────────────────────────┤
│ Main Content                             │
│   ├── H1 title                          │
│   ├── Meta description                   │
│   ├── Markdown content (rendered)       │
│   ├── Code blocks (syntax highlighted)  │
│   └── Images/media                       │
├─────────────────────────────────────────┤
│ Author Info / Bio                         │
├──────────────────────────────────────────┤
│ Related Posts Section                     │
└─────────────────────────────────────────┘
```

---

## Components

### MarkdownRenderer (`MarkdownRenderer.tsx`)
- Renders markdown using `react-markdown`
- Plugins: `remark-gfm`, `rehype-raw`, `rehype-slug`
- Custom components for headings (anchor links), code blocks (syntax highlight + copy), blockquotes
- Handles GitHub Flavored Markdown

### TableOfContents (`TableOfContents.tsx`)
- Extracts H2 and H3 headings from content
- Generates anchor links
- Smooth scroll navigation
- Highlights active section on scroll
- Sticky sidebar on desktop (>1024px)

### PostMeta (`PostMeta.tsx`)
- Displays: title, publish date, reading time, view count
- Tags/keywords
- Author info
- Share buttons

### RelatedPosts (`RelatedPosts.tsx`)
- Fetches from same journal
- Excludes current post
- Shows 3-5 related posts
- Uses existing PostCard component

---

## Styling & Theming

**Typography:**
- Body text: 18px, 1.6 line-height
- Headings: H1 (36px), H2 (28px), H3 (22px)
- Content max-width: 65-75ch

**Colors:**
- Text: Neutral-900 (dark), white (light)
- Headings: Accent color
- Code blocks: Neutral-900 bg, syntax highlighting
- Links: Accent color with hover underline
- Blockquotes: Accent color left border

**Responsive:**
```
Desktop (>1024px):  Two-column (TOC sidebar + content)
Tablet (640-1024px): Collapsible TOC
Mobile (<640px): Single column
```

---

## Data Flow & API

**Server-side fetch:**
- Fetch post by slug from `posts` table
- Join with `journals` and `user_profiles`
- Filter by `status = 'published'`

**Markdown processing:**
- Raw markdown from `content` field
- Client-side rendering by `react-markdown`
- Supports: headers, lists, code blocks, blockquotes, links, images

**New API endpoint:**
- `GET /api/posts/[slug]` - Fetch single post by slug

---

## Error Handling

**404 - Post not found:**
- Custom not-found page
- "This post doesn't exist or isn't published"

**Loading states:**
- Page-level skeleton
- Image loading placeholders

**SEO:**
- Dynamic metadata
- Open Graph tags
- JSON-LD structured data

---

## Tech Stack

Next.js 13+, TypeScript, Supabase, Tailwind CSS, react-markdown, react-syntax-highlighter

---

## File Structure

**New files:**
```
web/src/
├── app/
│   └── [url_prefix]/
│       └── [slug]/
│           ├── page.tsx
│           └── loading.tsx
├── components/
│   └── blog-post/
│       ├── MarkdownRenderer.tsx
│       ├── TableOfContents.tsx
│       ├── PostMeta.tsx
│       └── RelatedPosts.tsx
├── lib/
│   └── markdown-utils.ts
└── types/
    └── blog-post.ts
```

**NPM packages:**
```
react-markdown
react-syntax-highlighter
remark-gfm
rehype-raw
rehype-slug
unist-util-visit
```
