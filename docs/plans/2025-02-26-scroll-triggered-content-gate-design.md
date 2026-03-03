# Scroll-Triggered Content Gate Design

**Date:** 2025-02-26
**Feature:** Scroll-triggered sign-in prompt for guest drafts

## Overview

Guest drafts will display the bottom 50% of content blurred. When users attempt to scroll past this boundary, a sign-in/sign-up prompt overlay appears. This trigger happens every time they scroll past 50% (not just once), creating a persistent conversion opportunity.

## Requirements

- **Blur threshold:** Bottom 50% of content is blurred
- **Trigger point:** When scroll offset > 50% of scrollable height
- **Persistence:** Prompt triggers on every scroll past 50% (no "seen" state)
- **State retention:** Gating persists across navigation (blur + trigger always active for guests)

## Architecture

### Components to Modify

1. **`GuestDraftGate`** (`mobile-app/components/ui/content-gate.tsx`)
   - Add scroll detection using `Animated.ScrollView`
   - Track scroll position relative to content height
   - Trigger overlay at 50% scroll threshold

2. **New Hook: `use-scroll-gate`** (`mobile-app/hooks/use-scroll-gate.ts`)
   - Manages scroll trigger state
   - Provides callbacks for showing/hiding prompt
   - Tracks whether prompt is currently visible

3. **Draft Detail Screen** (`mobile-app/app/(tabs)/draft/[id].tsx`)
   - Integrate scroll detection with `GuestDraftGate`
   - Handle navigation to auth screens

### Data Flow

```
ScrollView onScroll
    ↓
Calculate scroll % = scrollOffset / (contentHeight - scrollViewHeight)
    ↓
If scroll % > 0.5 AND prompt not visible:
    ↓
Show prompt overlay (blocks interaction)
    ↓
User action (Sign Up / Sign In / Maybe Later)
    ↓
Navigate or dismiss → scroll back under 50%
    ↓
User scrolls past 50% again → Trigger repeats
```

## UI Design

### Prompt Overlay

**Layout:**
- Full-screen modal with centered content
- Semi-transparent backdrop (blur effect on content underneath)

**Content:**
- Icon: Lock/Locked icon at top
- Title: "Unlock Full Access"
- Subtitle: "Sign up to read the rest of this draft and create your own"
- Primary CTA: "Sign Up" button
- Secondary CTA: "Sign In" button
- Tertiary: "Maybe Later" (small, bottom)

**Animations:**
- Entry: Fade in (opacity 0→1) + Slide up (translateY 50→0) over 300ms
- Exit: Fade out over 200ms
- Spring timing for smooth feel

### Visual Mock

```
┌─────────────────────────────────────┐
│                                     │
│         [🔒 Locked Icon]            │
│                                     │
│      Unlock Full Access             │
│   Sign up to read the rest of      │
│   this draft and create your own   │
│                                     │
│   ┌─────────────────────────────┐  │
│   │      Sign Up (Primary)      │  │
│   └─────────────────────────────┘  │
│   ┌─────────────────────────────┐  │
│   │      Sign In (Secondary)    │  │
│   └─────────────────────────────┘  │
│                                     │
│         Maybe Later                 │
│                                     │
└─────────────────────────────────────┘
```

## State Management

**Local State (per component mount):**
- `promptVisible`: boolean ref - tracks if overlay is currently showing
- `lastTriggerPosition`: number ref - tracks scroll position where prompt was last triggered

**No AsyncStorage needed** - prompt should always trigger on scroll, not remembered across sessions

**Auth state integration:**
- Use existing `useAuthStore` for authentication status
- Navigate to `/auth/sign-up` or `/auth/sign-in` on CTA press
- After successful auth, draft becomes fully accessible

## Implementation Approach

**Recommended: Modify `GuestDraftGate` component**

Pros:
- Reuses existing blur infrastructure
- Single source of truth for guest draft gating
- Minimal changes to parent components

Changes needed:
1. Add `Animated.ScrollView` wrapper with scroll handler
2. Calculate scroll percentage on scroll events
3. Conditionally render prompt overlay
4. Handle navigation actions

## Edge Cases

1. **Short content** - If content is shorter than scrollable area, blur still applies to bottom 50%
2. **User dismisses prompt** - Scroll back below 50%, then prompt can trigger again
3. **Device rotation** - Recalculate layout dimensions on rotation
4. **User already authenticated** - Don't show gate at all (early return)

## Success Criteria

- Guest users see bottom 50% blurred
- Scrolling past 50% shows sign-in prompt
- Dismissing prompt and scrolling again re-triggers it
- After sign-in/sign-up, content is fully accessible
- State persists across navigation (away and back)
