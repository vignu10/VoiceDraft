# Guest User Flow with Content Gating - Design Document

**Date:** 2026-02-19  
**Status:** Draft  
**Author:** Architect Mode

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Architecture](#proposed-architecture)
4. [Component Modifications](#component-modifications)
5. [State Management](#state-management)
6. [UI/UX Flow](#uiux-flow)
7. [Implementation Steps](#implementation-steps)
8. [API Changes](#api-changes)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This document outlines the design for implementing a guest user trial feature that allows:

1. **Guest Recording:** Unsigned-in users can record voice and transcribe ONCE as a free trial
2. **Content Gating:** After receiving a blog post, scrolling down reveals a "sign in to view" overlay

The goal is to provide a frictionless first experience while encouraging user registration for continued use.

---

## Current State Analysis

### Authentication Flow

#### Auth Store ([`auth-store.ts`](mobile-app/stores/auth-store.ts))

- Uses **Zustand** with **persist** middleware
- Stores state in **AsyncStorage** under key `voicescribe-auth`
- Key state fields:
  - `isAuthenticated: boolean`
  - `accessToken: string | null`
  - `user: UserProfile | null`
  - `journal: Journal | null`
- Provides actions: `signInUser`, `signUpUser`, `signOutUser`, `signInWithOAuth`

#### Auth API ([`auth.ts`](mobile-app/services/api/auth.ts))

- Direct Supabase auth integration
- Functions: `signUp`, `signIn`, `signOut`, `getStoredToken`, `initializeAuth`, `refreshAccessToken`
- Tokens stored in AsyncStorage: `access_token`, `refresh_token`

#### Auth Components ([`components/auth/`](mobile-app/components/auth/))

- `OAuthButton` - For social login (Google, LinkedIn, GitHub, Apple)
- `PasswordStrengthMeter` - Password validation UI

### Recording/Transcription Flow

#### Recording Screen ([`recording.tsx`](mobile-app/app/recording.tsx))

- Full-screen modal presentation
- Uses `recordingService` for audio capture
- Flow: Record → Upload to S3 → Navigate to keyword screen
- **Currently requires no authentication check**

#### Recording Service ([`recording-service.ts`](mobile-app/services/audio/recording-service.ts))

- Handles audio recording with `expo-av`
- Uploads to S3 via `uploadAudioToS3`
- Returns `S3UploadResult` with audio URL and metadata

#### Transcription ([`transcription.ts`](mobile-app/services/api/transcription.ts))

- Two methods:
  - `transcribeFromS3` - Preferred, takes S3 URL
  - `transcribeAudio` - Legacy base64 method
- Uses `apiClient` which optionally includes auth token

#### Transcription Hook ([`use-transcribe.ts`](mobile-app/hooks/use-transcribe.ts))

- React Query mutation wrapper
- Simple wrapper around transcription API calls

### Draft Viewing Flow

#### Draft Editor ([`draft/[id].tsx`](<mobile-app/app/(tabs)/draft/[id].tsx>))

- Loads drafts from **AsyncStorage** (not server)
- Two tabs: Edit and Preview
- Shows title, meta description, and content
- **No authentication required** - all local storage
- Uses `ScrollView` for content display

### API Client ([`client.ts`](mobile-app/services/api/client.ts))

- Custom API client with token management
- Auto-refresh on 401 responses
- Token is **optional** - requests work without auth
- Headers include `Authorization: Bearer ${token}` only when token exists

---

## Proposed Architecture

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌────────────────┐     ┌──────────────┐  │
│  │ Guest Store  │     │  Recording     │     │    Draft     │  │
│  │              │────▶│    Screen      │────▶│    View      │  │
│  │ - hasUsedFree│     │                │     │              │  │
│  │ - guestDraft │     │ - Check guest  │     │ - Gate after │  │
│  └──────────────┘     │   status       │     │   scroll     │  │
│         │             └────────────────┘     └──────────────┘  │
│         │                    │                     │            │
│         ▼                    ▼                     ▼            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    AsyncStorage                           │  │
│  │  - voicescribe-guest-trial: { hasUsedFreeTrial: bool }    │  │
│  │  - guest-draft: { id, previewContent, isLocked }         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New Components

1. **Guest Trial Store** - Track guest usage state
2. **Guest Gate Component** - Overlay for content gating
3. **useGuestTrial Hook** - Encapsulate guest trial logic
4. **ScrollGate Wrapper** - HOC for scroll-based gating

---

## Component Modifications

### 1. New Guest Trial Store

**File:** [`mobile-app/stores/guest-store.ts`](mobile-app/stores/guest-store.ts) (NEW)

```typescript
interface GuestState {
  // State
  hasUsedFreeTrial: boolean;
  guestDraftId: string | null;
  guestDraftPreview: string | null; // First few paragraphs
  isGuestMode: boolean;

  // Actions
  markTrialUsed: () => void;
  setGuestDraft: (id: string, preview: string) => void;
  clearGuestDraft: () => void;
  checkGuestStatus: () => Promise<void>;
}
```

**Storage Key:** `voicescribe-guest-trial`

### 2. Modified Recording Screen

**File:** [`mobile-app/app/recording.tsx`](mobile-app/app/recording.tsx)

**Changes:**

- Add guest trial check before recording starts
- Show sign-in prompt if trial already used
- Mark trial as used after successful transcription

```typescript
// Pseudocode for handleStartRecording
const handleStartRecording = async () => {
  const { isAuthenticated } = useAuthStore.getState();
  const { hasUsedFreeTrial, markTrialUsed } = useGuestStore.getState();

  if (!isAuthenticated && hasUsedFreeTrial) {
    // Show sign-in prompt
    showSignInRequiredModal();
    return;
  }

  // Proceed with recording
  await recordingService.startRecording(...);
};
```

### 3. Modified Draft View with Content Gate

**File:** [`mobile-app/app/(tabs)/draft/[id].tsx`](<mobile-app/app/(tabs)/draft/[id].tsx>)

**Changes:**

- Add scroll position tracking
- Show overlay when scroll passes threshold
- Blur/mask content below threshold

```typescript
// New state for scroll tracking
const [scrollProgress, setScrollProgress] = useState(0);
const [showGate, setShowGate] = useState(false);

// Scroll handler
const handleScroll = (event) => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  const progress =
    contentOffset.y / (contentSize.height - layoutMeasurement.height);
  setScrollProgress(progress);

  // Show gate after 30% scroll for guest users
  if (!isAuthenticated && progress > 0.3 && hasUsedFreeTrial) {
    setShowGate(true);
  }
};
```

### 4. New Content Gate Overlay Component

**File:** [`mobile-app/components/ui/content-gate.tsx`](mobile-app/components/ui/content-gate.tsx) (NEW)

```typescript
interface ContentGateProps {
  visible: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  remainingContent?: string; // Preview of what's behind gate
}

export function ContentGate({ visible, onSignIn, onSignUp }: ContentGateProps) {
  return (
    <Animated.View style={[styles.overlay, { opacity: visible ? 1 : 0 }]}>
      <BlurView intensity={80} style={styles.blur}>
        <View style={styles.content}>
          <Ionicons name="lock-closed" size={48} color={colors.primary} />
          <ThemedText>Sign in to view full content</ThemedText>
          <AnimatedButton onPress={onSignIn}>Sign In</AnimatedButton>
          <AnimatedButton onPress={onSignUp} variant="secondary">
            Create Account
          </AnimatedButton>
        </View>
      </BlurView>
    </Animated.View>
  );
}
```

### 5. New useGuestTrial Hook

**File:** [`mobile-app/hooks/use-guest-trial.ts`](mobile-app/hooks/use-guest-trial.ts) (NEW)

```typescript
export function useGuestTrial() {
  const { isAuthenticated } = useAuthStore();
  const { hasUsedFreeTrial, markTrialUsed, guestDraftId } = useGuestStore();

  const canRecord = isAuthenticated || !hasUsedFreeTrial;
  const shouldGateContent = !isAuthenticated && hasUsedFreeTrial;

  const useTrial = useCallback(() => {
    if (!isAuthenticated && !hasUsedFreeTrial) {
      markTrialUsed();
      return true;
    }
    return false;
  }, [isAuthenticated, hasUsedFreeTrial, markTrialUsed]);

  return {
    canRecord,
    shouldGateContent,
    hasUsedFreeTrial,
    useTrial,
    guestDraftId,
  };
}
```

---

## State Management

### Guest Trial State Machine

```
┌─────────────────┐
│   NEW_USER      │  hasUsedFreeTrial: false
│   (can record)  │  guestDraftId: null
└────────┬────────┘
         │
         │ Records & transcribes
         │
         ▼
┌─────────────────┐
│  TRIAL_USED     │  hasUsedFreeTrial: true
│  (gated access) │  guestDraftId: set
└────────┬────────┘
         │
         │ Signs in/up
         │
         ▼
┌─────────────────┐
│  AUTHENTICATED  │  isAuthenticated: true
│  (full access)  │  Trial state cleared
└─────────────────┘
```

### AsyncStorage Keys

| Key                      | Type                                                        | Purpose                    |
| ------------------------ | ----------------------------------------------------------- | -------------------------- |
| `voicescribe-guest-trial` | `{ hasUsedFreeTrial: boolean, usedAt?: string }`            | Track trial usage          |
| `guest-draft`            | `{ id: string, previewContent: string, createdAt: string }` | Store guest draft metadata |
| `voicescribe-auth`        | Existing                                                    | Auth state (unchanged)     |

### State Persistence

```typescript
// Guest store persistence config
{
  name: 'voicescribe-guest-trial',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    hasUsedFreeTrial: state.hasUsedFreeTrial,
    guestDraftId: state.guestDraftId,
    guestDraftPreview: state.guestDraftPreview,
  }),
}
```

---

## UI/UX Flow

### Guest Recording Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     GUEST RECORDING FLOW                          │
└──────────────────────────────────────────────────────────────────┘

User opens app
       │
       ▼
┌──────────────┐     No      ┌──────────────────┐
│ Signed in?   │────────────▶│ Check trial used │
└──────────────┘              └────────┬─────────┘
       │                               │
      Yes                     ┌────────┴────────┐
       │                      │                 │
       ▼                     No               Yes
┌──────────────┐              │                 │
│ Normal flow  │              ▼                 ▼
└──────────────┘     ┌──────────────┐  ┌──────────────┐
                     │ Allow record │  │ Show sign-in │
                     │ ONE time     │  │ prompt       │
                     └──────┬───────┘  └──────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Record & upload  │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Transcribe       │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Mark trial used  │
                   │ Store draft ID   │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Show blog post   │
                   │ with content gate│
                   └──────────────────┘
```

### Content Gating Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     CONTENT GATING FLOW                           │
└──────────────────────────────────────────────────────────────────┘

User views draft
       │
       ▼
┌──────────────┐     No      ┌──────────────────┐
│ Signed in?   │────────────▶│ Check trial used │
└──────────────┘              └────────┬─────────┘
       │                               │
      Yes                     ┌────────┴────────┐
       │                      │                 │
       ▼                     No               Yes
┌──────────────┐              │                 │
│ Full content │              ▼                 ▼
└──────────────┘     ┌──────────────┐  ┌──────────────────┐
                     │ Full content │  │ Show preview     │
                     │ (first trial)│  │ Track scroll     │
                     └──────────────┘  └────────┬─────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │ Scroll > 30%     │
                                       │ Trigger gate     │
                                       └────────┬─────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │ Show blur overlay│
                                       │ Sign in prompt   │
                                       └──────────────────┘
```

### UI Mockup - Content Gate Overlay

```
┌────────────────────────────────────────┐
│  ← Draft Title                    [⚙]  │
│  245 words · Editing                   │
├────────────────────────────────────────┤
│                                        │
│  # Blog Post Title                     │
│                                        │
│  This is the meta description that     │
│  explains what the post is about...    │
│                                        │
│  ────────────────────────────────      │
│                                        │
│  The first paragraph of content is     │
│  visible and readable. This gives      │
│  the user a preview of what they       │
│  can expect from the full post.        │
│                                        │
│  The second paragraph continues to     │
│  build on the first...                 │
│                                        │
│ ╔════════════════════════════════════╗ │
│ ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║ │
│ ║  ░░░░░░░░░░░░ BLUR ░░░░░░░░░░░░░░  ║ │
│ ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║ │
│ ║                                    ║ │
│ ║         🔒 LOCKED CONTENT          ║ │
│ ║                                    ║ │
│ ║   Sign in to view the full post    ║ │
│ ║                                    ║ │
│ ║   ┌─────────────────────────┐      ║ │
│ ║   │      Sign In            │      ║ │
│ ║   └─────────────────────────┘      ║ │
│ ║   ┌─────────────────────────┐      ║ │
│ ║   │    Create Account       │      ║ │
│ ║   └─────────────────────────┘      ║ │
│ ╚════════════════════════════════════╝ │
└────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Guest Store & Hook

1. **Create Guest Store**
   - [ ] Create [`mobile-app/stores/guest-store.ts`](mobile-app/stores/guest-store.ts)
   - [ ] Define `GuestState` interface
   - [ ] Implement persist middleware with AsyncStorage
   - [ ] Export `useGuestStore` hook

2. **Create useGuestTrial Hook**
   - [ ] Create [`mobile-app/hooks/use-guest-trial.ts`](mobile-app/hooks/use-guest-trial.ts)
   - [ ] Combine auth and guest store logic
   - [ ] Export convenience methods

3. **Update Store Index**
   - [ ] Update [`mobile-app/stores/index.ts`](mobile-app/stores/index.ts) to export guest store

### Phase 2: Recording Flow Modification

4. **Modify Recording Screen**
   - [ ] Import `useGuestTrial` hook
   - [ ] Add guest check in `handleStartRecording`
   - [ ] Create sign-in required modal/dialog
   - [ ] Mark trial used after successful upload

5. **Create Sign-In Prompt Modal**
   - [ ] Create reusable modal component
   - [ ] Style consistently with app theme
   - [ ] Add navigation to auth screens

### Phase 3: Content Gating

6. **Create Content Gate Component**
   - [ ] Create [`mobile-app/components/ui/content-gate.tsx`](mobile-app/components/ui/content-gate.tsx)
   - [ ] Implement blur overlay with @react-native-community/blur
   - [ ] Add sign-in/sign-up buttons
   - [ ] Animate overlay appearance

7. **Modify Draft View**
   - [ ] Import content gate component
   - [ ] Add scroll position tracking
   - [ ] Integrate with guest trial state
   - [ ] Show gate at scroll threshold

### Phase 4: Polish & Edge Cases

8. **Handle Edge Cases**
   - [ ] Trial used but user signs in later → clear trial state
   - [ ] Guest draft migration to user account on sign-in
   - [ ] Clear guest state on sign-out (prevent abuse)

9. **Add Analytics**
   - [ ] Track guest recording attempts
   - [ ] Track conversion from guest to signed-in
   - [ ] Track gate trigger events

---

## API Changes

### Backend Considerations

The current architecture stores drafts locally in AsyncStorage. For a complete guest experience, consider:

#### Option A: Client-Side Only (Recommended for MVP)

- All guest state in AsyncStorage
- No backend changes required
- Guest drafts lost on app uninstall

#### Option B: Server-Side Guest Tracking

- Create anonymous guest sessions
- Store guest drafts server-side
- Migrate on sign-in

### API Endpoints (If Option B)

```
POST /api/guest/session
- Create anonymous session
- Returns: { guestId, hasUsedFreeTrial }

POST /api/guest/draft
- Save guest draft
- Body: { guestId, draftData }

POST /api/guest/migrate
- Migrate guest data to user account
- Body: { guestId, userId }
```

---

## Security Considerations

### Preventing Abuse

1. **Device Fingerprinting**
   - Consider using device identifiers to prevent trial abuse
   - Store `hasUsedFreeTrial` with device-specific key

2. **Rate Limiting**
   - Server-side rate limiting on transcription endpoint
   - Limit guest transcriptions per IP/device

3. **Secure Storage**
   - Consider using encrypted storage for trial flag
   - Be aware AsyncStorage is not secure on rooted devices

### Implementation Notes

```typescript
// Consider adding device identifier to storage key
import { getDeviceId } from "expo-device";

const getStorageKey = async () => {
  const deviceId = await getDeviceId();
  return `voicescribe-guest-trial-${deviceId}`;
};
```

---

## Testing Strategy

### Unit Tests

1. **Guest Store**
   - Test trial marking
   - Test state persistence
   - Test state clearing

2. **useGuestTrial Hook**
   - Test `canRecord` logic
   - Test `shouldGateContent` logic
   - Test trial usage flow

### Integration Tests

3. **Recording Flow**
   - Guest can record once
   - Guest blocked on second attempt
   - Signed-in user always allowed

4. **Content Gating**
   - Gate appears at correct scroll position
   - Gate does not appear for authenticated users
   - Gate dismisses after sign-in

### E2E Tests

5. **Full Guest Journey**
   ```
   1. Open app as new user
   2. Record voice
   3. View generated blog
   4. Scroll to trigger gate
   5. Sign in
   6. Verify full access
   ```

---

## Files Summary

### New Files to Create

| File                                                                                     | Purpose                      |
| ---------------------------------------------------------------------------------------- | ---------------------------- |
| [`mobile-app/stores/guest-store.ts`](mobile-app/stores/guest-store.ts)                   | Guest trial state management |
| [`mobile-app/hooks/use-guest-trial.ts`](mobile-app/hooks/use-guest-trial.ts)             | Guest trial logic hook       |
| [`mobile-app/components/ui/content-gate.tsx`](mobile-app/components/ui/content-gate.tsx) | Content gating overlay       |

### Files to Modify

| File                                                                             | Changes               |
| -------------------------------------------------------------------------------- | --------------------- |
| [`mobile-app/stores/index.ts`](mobile-app/stores/index.ts)                       | Export guest store    |
| [`mobile-app/app/recording.tsx`](mobile-app/app/recording.tsx)                   | Add guest trial check |
| [`mobile-app/app/(tabs)/draft/[id].tsx`](<mobile-app/app/(tabs)/draft/[id].tsx>) | Add content gate      |

---

## Dependencies

### Required Packages

| Package                        | Purpose                          | Status                |
| ------------------------------ | -------------------------------- | --------------------- |
| `@react-native-community/blur` | Blur effect for gate overlay     | Needs installation    |
| `expo-device`                  | Device identification (optional) | May need installation |

### Installation Command

```bash
npx expo install @react-native-community/blur expo-device
```

---

## Questions for Clarification

Before implementation, please confirm:

1. **Scroll Threshold:** What percentage of content should be visible before gating? (Currently designed for 30%)

2. **Gate Trigger:** Should the gate appear:
   - After scrolling past threshold?
   - After viewing for X seconds?
   - Combination of both?

3. **Guest Draft Persistence:** Should guest drafts be:
   - Lost on app uninstall (client-only)?
   - Persisted server-side with migration?

4. **Trial Reset:** Should users be able to reset their trial?
   - Never?
   - After X days?
   - On app reinstall?

---

## Conclusion

This design provides a comprehensive approach to implementing guest user trials with content gating. The architecture is modular, allowing for incremental implementation and future enhancements.

**Recommended Implementation Order:**

1. Guest Store & Hook (Foundation)
2. Recording Flow Modification (Guest recording)
3. Content Gating (Conversion trigger)
4. Polish & Edge Cases (Production ready)
