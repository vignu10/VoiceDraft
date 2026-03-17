# Mobile Bottom Sheet Design - "Your Blog is Ready" Section

**Date:** 2025-03-17
**Status:** Approved
**Author:** Claude (via brainstorming session)

## Problem Statement

The "Your blog is ready" section in the record page (`web/src/app/record/page.tsx`) has poor mobile responsiveness:
- Content touches screen edges (no horizontal padding)
- Text is oversized for mobile screens
- Layout is cramped and elements overlap
- Buttons are difficult to tap (too small, no proper spacing)
- Overall visual density is inappropriate for mobile viewports

## Solution Overview

Implement a **mobile bottom sheet** pattern that provides:
- Fixed bottom sheet on mobile (< 1024px)
- Centered card layout on desktop (≥ 1024px)
- CSS-only responsive design (no conditional rendering)
- Zero new React state (no performance impact)

## Architecture

### Design Principle: Single Component, CSS-Driven

The solution uses **one shared JSX structure** that adapts via Tailwind responsive classes:

- No conditional rendering of different components
- No component remounts when viewport changes
- No additional React state
- Layout changes happen purely through CSS
- Animations use GPU-accelerated CSS transforms

### Responsive Behavior

| Aspect | Mobile (< lg) | Desktop (≥ lg) |
|--------|---------------|----------------|
| Position | Fixed bottom sheet | Static centered card |
| Width | Full viewport width | Max 3xl (48rem) centered |
| Height | Max 85vh, scrollable | Natural content height |
| Border Radius | Top corners only (rounded-t-3xl) | All corners (rounded-xl) |
| Shadow | Full sheet shadow (shadow-2xl) | Card shadow (shadow-lg) |
| Background | Backdrop blur overlay | None |
| z-index | z-50 (above backdrop) | Auto |

## Component Structure

### Mobile Layout

```
┌─────────────────────────────┐
│         (drag handle)        │  ← Optional visual indicator
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   Success Icon        │  │  ← w-10 h-10 (not w-12 h-12)
│  │   "Your blog is       │  │  ← text-lg (not text-xl)
│  │    ready"             │  │
│  │   word count info     │  │  ← text-xs
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Preview/Edit Toggle   │  │  ← Smaller touch targets
│  ├───────────────────────┤  │
│  │                       │  │
│  │  Content Preview      │  │  ← Scrollable, text-sm
│  │  (title + body)       │  │  ← max-h-[50vh] overflow-y-auto
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ [Open in Editor→]     │  │  ← Full width, min-h-48
│  │ [Record Another]      │  │  ← Full width, min-h-48
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Container Class Structure

```jsx
<div className="
  // Mobile: fixed bottom sheet
  fixed inset-x-0 bottom-0 top-auto max-h-[85vh] rounded-t-3xl
  // Desktop: static centered card
  lg:static lg:max-h-none lg:rounded-xl lg:max-w-3xl lg:mx-auto
  // Common styles
  bg-neutral-50 dark:bg-neutral-900 shadow-2xl lg:shadow-lg
  z-50 flex flex-col
">
```

### Backdrop Overlay (Mobile Only)

```jsx
<div className="lg:hidden fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40" />
```

## Spacing and Typography (Mobile-First)

| Element | Mobile (< lg) | Desktop (≥ lg) |
|---------|---------------|----------------|
| Horizontal padding | px-4 (16px) | px-6 (24px) |
| Heading size | text-lg | text-xl |
| Body text size | text-sm | text-base |
| Success icon | w-10 h-10 | w-12 h-12 |
| Button min height | min-h-[48px] | min-h-[52px] |
| Content max height | max-h-[50vh] | max-h-[360px] |

## Performance Guarantees

| Concern | Solution |
|---------|----------|
| Unnecessary re-renders | Zero new state - uses existing `isEditMode`, `generatedBlog` |
| Component remounts | Single DOM tree, CSS-only layout changes |
| Animation performance | CSS transforms (GPU-accelerated), no JS animations |
| Layout thrashing | Fixed positioning on mobile avoids reflow |

## Existing State Usage

The solution uses **only existing state** - no new hooks or state variables:

- `generatedBlog` - Already exists, contains title, content, wordCount
- `isEditMode` - Already exists, toggles preview/edit mode
- `editedContent` - Already exists, holds edited text
- `handleViewBlog` - Already exists, opens editor
- `handleReset` - Already exists, resets recording

## Implementation Notes

1. **Location:** `web/src/app/record/page.tsx` lines 711-833
2. **View State:** `viewState === 'complete'`
3. **Grid Span:** Currently uses `lg:col-span-2 order-1` - maintain this
4. **Animation:** Use existing `animate-in` classes, add `slide-in-from-bottom-4`

## Success Criteria

- [ ] Content has proper horizontal padding on mobile (px-4)
- [ ] Text sizes are appropriate for mobile screens
- [ ] Buttons are easy to tap (min 48px height, full width)
- [ ] Content is scrollable when it exceeds viewport
- [ ] No horizontal scroll on mobile
- [ ] Desktop layout remains unchanged
- [ ] No new React state introduced
- [ ] Animations are smooth (60fps)

## Future Enhancements (Out of Scope)

- Drag-to-dismiss functionality
- Swipe gesture to close sheet
- Keyboard navigation improvements
- Height resize handle
