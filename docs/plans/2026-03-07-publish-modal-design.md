# Publish Modal Design Document

**Date**: 2026-03-07
**Author**: Design Specification
**Status**: Approved

---

## Overview

Design a publish modal for the VoiceScribe mobile app that allows users to publish their blog posts directly from the draft editor with preview, confirmation, and feedback.

---

## Problem Statement

The current publish functionality is hidden and requires users to:
1. Navigate back to the library screen
2. Long press on a draft card
3. Select "Publish" from a menu

This is not discoverable and adds friction to the publishing workflow.

---

## Goals

1. Add a prominent publish button in the draft editor header
2. Show a publish modal with blog URL preview
3. Provide warnings for incomplete posts
4. Give clear feedback after successful publish with options to view, share, and copy URL

---

## User Flow

```
┌─────────────────────────────────────────────────────┐
│  Draft Editor Screen                                 │
│  User taps [Publish] button in header                │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Publish Modal                                       │
│  - Shows blog URL where post will appear            │
│  - Shows warnings for incomplete posts              │
│  - User confirms with [Publish] button              │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  API Call: POST /api/posts/:id/publish             │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Success Toast                                       │
│  - Shows published post URL                         │
│  - Tap to copy URL                                  │
│  - [View] button opens in browser                   │
│  - [Share] button opens native share sheet          │
└─────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Draft Editor Header (Modified)

**Changes**: Add publish button between Edit/Preview toggle and Export button

```
┌─────────────────────────────────────────────────────────────┐
│  [←] Title                   [Edit/Preview] [Publish] [Export]│
└─────────────────────────────────────────────────────────────┘
```

**Button States**:
- **Normal**: Enabled (blue background)
- **Disabled**: Grayed out if draft is not synced (no serverId)
- **Loading**: Shows spinner during publish operation

**Icon**: `send-outline` or `rocket-outline` (Ionicons)

### 2. Publish Modal

**Full-screen modal** with backdrop blur

```
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │  │                                                   │  │
│  │                  Publish to Blog                       │  │
│  │                  ─────────────────                     │  │
│  │                                                       │  │
│  │  Your post will be published at:                      │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  https://your-site.com/                          │  │  │
│  │  │     johns-tech-blog/your-post-slug               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ⚠️ Warning: No title set                            │  │
│  │     (Only show if post is incomplete)                │  │
│  │                                                       │  │
│  │              [Cancel]           [Publish →]          │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Warning Messages** (show if applicable):
- No title set: `"⚠️ Warning: No title set"`
- Very short content (< 100 words): `"⚠️ Warning: Post is very short"`

**Publish Button States**:
- **Enabled**: Post has title OR is not critically incomplete
- **Disabled**: Post is critically incomplete (no content at all)

### 3. Success Toast

**Toast** that appears at top of screen after successful publish

```
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ✅ Published!                                        │  │
│  │                                                       │  │
│  │  your-site.com/johns-tech-blog/your-post-slug        │  │
│  │                                                       │  │
│  │  [View] [Share]              (Tap to copy URL)        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Interactions**:
- **Tap anywhere on toast**: Copy URL to clipboard + show "Copied!" briefly
- **View button**: Opens post in device browser
- **Share button**: Opens native share sheet with URL

**Auto-dismiss**: 5 seconds (extendable if user interacts)

---

## Technical Design

### Components

**New Components**:
- `PublishModal.tsx` - Full-screen modal component
- `PublishSuccessToast.tsx` - Success toast with URL sharing

**Modified Components**:
- `/app/(tabs)/draft/[id].tsx` - Add publish button to header

### Data Flow

```
1. User taps Publish button
2. Show PublishModal with:
   - Generated blog URL (using journal.url_prefix + post.slug)
   - Validation warnings
3. User confirms → Call publishPost API
4. On success:
   - Update draft status to 'published'
   - Show PublishSuccessToast with URL
5. Toast interactions:
   - Tap → Copy to clipboard
   - View → Opens in browser
   - Share → Native share sheet
```

### Blog URL Generation

```typescript
// Function to generate blog URL
function generateBlogUrl(journalUrlPrefix: string, postSlug: string): string {
  const baseUrl = Platform.select({
    ios: Config.PRODUCTION_URL, // From app config
    android: Config.PRODUCTION_URL,
  });
  return `${baseUrl}/${journalUrlPrefix}/${postSlug}`;
}
```

### API Integration

Existing API: `POST /api/posts/:id/publish`

```typescript
// From services/api/posts.ts
export async function publishPost(id: string): Promise<Post> {
  const response = await apiClient.post<Post>(`/api/posts/${id}/publish`, {});
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to publish post');
  }
  return response.data;
}
```

---

## Validation Rules

| Condition | Warning Message | Publish Button |
|-----------|----------------|----------------|
| No title | "⚠️ Warning: No title set" | Enabled |
| Content < 100 words | "⚠️ Warning: Post is very short" | Enabled |
| No content (empty) | "⚠️ Error: Post is empty" | **Disabled** |
| No serverId | N/A (button disabled in header) | **Disabled** |

---

## File Structure

```
mobile-app/
├── components/
│   └── publish/
│       ├── PublishModal.tsx           (NEW - Full-screen modal)
│       └── PublishSuccessToast.tsx     (NEW - Success toast)
├── app/
│   └── (tabs)/draft/
│       └── [id].tsx                    (MODIFY - Add publish button)
├── services/
│   └── api/
│       └── posts.ts                    (EXISTING - publishPost function)
└── utils/
    └── url-utils.ts                    (NEW - Blog URL generation)
```

---

## Accessibility

- **Modal**: Semantic modal with ARIA role, focus trap
- **Buttons**: Clear accessibility labels
- **Keyboard**: Escape closes modal, Enter confirms
- **Screen Reader**: Announces "Published successfully" with URL
- **Haptic Feedback**: Success haptic on publish complete

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Network error | Show error message, keep modal open for retry |
| Post already published | Show "Already published" with view option |
| Journal not configured | Show error: "Please set up your journal first" |
| Invalid slug characters | Auto-sanitize or show error |
| Server returns 404 | Show error: "Post not found. Try syncing first" |

---

## Future Enhancements

- Schedule for later publish
- Unpublish from the same modal
- Edit slug before publishing
- Preview theme/style being used
- Social media preview image

---

*End of Design Document*
