# Guest Full-Flow Feature — Technical Design Document

**Date:** 2026-02-19  
**Status:** Draft  
**Feature:** Allow guest users to complete the full recording → transcribe → generate → view draft flow once, with a sign-up gate at the end.

---

## Table of Contents

1. [Current Flow Analysis](#1-current-flow-analysis)
2. [Guest Alternative Flow Design](#2-guest-alternative-flow-design)
3. [Base64 Transcription Path](#3-base64-transcription-path)
4. [Generation Without Auth](#4-generation-without-auth)
5. [Local Draft Storage](#5-local-draft-storage)
6. [Sign-Up Gate on Draft Screen](#6-sign-up-gate-on-draft-screen)
7. [Rate Limiting Design](#7-rate-limiting-design)
8. [Implementation Plan](#8-implementation-plan)

---

## 1. Current Flow Analysis

### The Authenticated Flow (End-to-End)

```
recording.tsx
  └─ processRecording()
       └─ recordingService.stopRecordingAndUploadToS3(onProgress)
            ├─ recording.stopAndUnloadAsync()
            ├─ uploadAudioToS3(uri, filename, mimeType, onProgress)
            │    └─ apiClient.post('/api/audio/upload/presigned', ...)  ← REQUIRES AUTH (401 for guests)
            │    └─ uploadAsync(presignedUrl, fileUri, ...)              ← Direct S3 PUT
            └─ returns { audioFileUrl, audioS3Key, duration, fileSize, mimeType }
  └─ router.push('/keyword', { audioFileUrl, audioS3Key, duration, fileSize, mimeType })

keyword.tsx
  └─ handleContinue() / handleSkip()
       └─ router.push('/draft/processing', {
            audioFileUrl, audioS3Key, duration, keyword, tone, length, fileSize, mimeType
          })

draft/processing.tsx
  └─ processRecording() [useEffect on mount]
       ├─ isUsingS3 = !!params.audioFileUrl && !!params.audioS3Key  → true for auth flow
       ├─ transcribeS3Mutation.mutateAsync({ audioUrl, audioKey })
       │    └─ transcribeFromS3() → apiClient.post('/api/transcribe/s3', ...)  ← REQUIRES AUTH
       ├─ validateTranscript(transcription.text)
       ├─ generateMutation.mutateAsync({ transcript, targetKeyword, tone, length })
       │    └─ generateBlogPost() → apiClient.post('/api/generate', ...)  ← NO AUTH (commented out)
       ├─ createPost(createData)  ← REQUIRES AUTH (saves to DB)
       ├─ AsyncStorage.setItem('drafts', ...)  ← local cache for Continue Draft
       └─ router.replace('/(tabs)/draft/[id]', { id })

(tabs)/draft/[id].tsx
  └─ loadDraft() → AsyncStorage.getItem('drafts') → find by id
  └─ triggerContentGate() → shows ContentGate when scroll > 30% AND hasUsedFreeTrial
```

### Key Data Shapes

**`S3UploadResult`** (from `recording-service.ts`):

```typescript
{
  audioFileUrl: string;   // public S3 URL
  audioS3Key: string;     // S3 object key
  duration: number;       // seconds
  fileSize?: number;      // bytes
  mimeType?: string;      // e.g. 'audio/mp4'
}
```

**`TranscriptionResult`** (from `types/draft.ts`):

```typescript
{
  text: string;
  duration: number;
  language: string;
}
```

**`GeneratedBlog`** (from `types/draft.ts`):

```typescript
{
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
}
```

**`Draft`** (from `types/draft.ts`):

```typescript
{
  id: string;
  status: DraftStatus;
  audioUri?: string;
  transcript?: string;
  targetKeyword?: string;
  tone: Tone;
  length: Length;
  title?: string;
  metaDescription?: string;
  content?: string;
  wordCount?: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Current Guest Blocker

In `recording.tsx` at `processRecording()` (line ~329):

```typescript
if (!isAuthenticated) {
  // Cancels recording, marks trial used, shows Alert to sign up
  // NEVER navigates to keyword/processing — guest flow is dead-ended here
  markTrialUsed();
  Alert.alert("Sign Up to Save Your Recording", ...);
  return;
}
```

The guest is blocked **before** the keyword screen. The trial is marked used but no draft is ever created.

---

## 2. Guest Alternative Flow Design

### Proposed Guest Flow

```
recording.tsx
  └─ processRecording() [guest branch]
       ├─ recordingService.stopRecordingLocally()  ← NEW: stop without S3 upload
       │    └─ returns { localUri, duration, fileSize, mimeType }
       ├─ markTrialUsed()  ← mark AFTER successful local stop (not before)
       └─ router.push('/keyword', {
            audioUri: localUri,    ← local file URI (no S3)
            duration, fileSize, mimeType,
            isGuestFlow: 'true'    ← NEW flag to signal guest path
          })

keyword.tsx  [no changes needed — already passes audioUri through]
  └─ handleContinue() / handleSkip()
       └─ router.push('/draft/processing', {
            audioUri,              ← local URI (isUsingS3 = false)
            duration, keyword, tone, length,
            isGuestFlow: 'true'    ← pass through
          })

draft/processing.tsx
  └─ processRecording() [guest branch: isUsingS3 = false]
       ├─ transcribeMutation.mutateAsync(params.audioUri)
       │    └─ transcribeAudio(audioUri)  ← reads file as base64, posts to /api/transcribe/base64
       ├─ validateTranscript(transcription.text)
       ├─ generateMutation.mutateAsync({ transcript, ... })
       │    └─ generateBlogPost() → /api/generate  ← already no auth
       ├─ [SKIP createPost() — no DB save for guests]
       ├─ guestDraftStore.setGuestDraft(draft)  ← NEW: store in Zustand
       └─ router.replace('/(tabs)/draft/[id]', { id: 'guest-draft' })

(tabs)/draft/[id].tsx
  └─ if id === 'guest-draft': load from guestDraftStore instead of AsyncStorage
  └─ show SaveGate at bottom (always visible for guest, not scroll-triggered)
       └─ "Sign up to save this draft" with Sign In / Create Account buttons
```

### Changes Required Per Screen

#### `recording.tsx`

- **Remove** the early-return guest block that cancels recording and shows Alert
- **Add** a new guest branch in `processRecording()` that:
  1. Calls `recordingService.stopRecordingLocally()` (new method)
  2. Marks trial used **after** successful stop
  3. Navigates to `/keyword` with `audioUri` + `isGuestFlow: 'true'`
- **Keep** the existing `canRecord` check in `handleStartRecording()` (blocks second attempts)

#### `keyword.tsx`

- **No changes needed** — already passes `audioUri` through params
- Optionally pass `isGuestFlow` through to processing

#### `draft/processing.tsx`

- **Add** `isGuestFlow` param detection
- **Add** guest branch: skip `createPost()`, use `guestDraftStore.setGuestDraft()` instead
- **Add** navigation to `/(tabs)/draft/[id]` with `id: 'guest-draft'`
- **Keep** existing S3 flow for authenticated users unchanged

#### `(tabs)/draft/[id].tsx`

- **Add** guest draft loading: if `id === 'guest-draft'`, load from `guestDraftStore`
- **Replace** scroll-triggered `ContentGate` with a bottom-anchored `SaveGate` for guests
- **Disable** save/edit functionality for guest drafts (read-only view)

---

## 3. Base64 Transcription Path

### Endpoint Analysis

**`web/src/app/api/transcribe/base64/route.ts`** — Auth is **commented out**:

```typescript
// TODO: Re-enable auth in production
// const authHeader = req.headers.get('authorization');
// if (!authHeader?.startsWith('Bearer ')) {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// }
```

**Status: Works without auth today.** No changes needed to the endpoint for the guest flow.

### Request Shape

```typescript
POST /api/transcribe/base64
Content-Type: application/json

{
  audio: string;   // base64-encoded audio data
  format: string;  // 'm4a' | 'mp3' | etc.
}
```

### Response Shape

```typescript
{
  text: string;
  duration: number;
  language: string;
}
```

### Existing Client Code

`transcribeAudio()` in `transcription.ts` already handles this path:

```typescript
// Reads file as base64
const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
  encoding: "base64",
});
// Posts to /api/transcribe/base64
const response = await apiClient.post("/api/transcribe/base64", {
  audio: base64Audio,
  format: "m4a",
});
```

The `useTranscribe()` hook wraps this. The `processing.tsx` already falls back to this when `isUsingS3 = false`. **No new code needed for transcription** — the existing legacy path works.

### File Size Consideration

Base64 encoding inflates file size by ~33%. A 2-minute M4A recording at 128kbps ≈ 1.9MB → ~2.5MB base64. This is acceptable for a one-time guest trial but should be noted in rate limiting.

---

## 4. Generation Without Auth

### Endpoint Analysis

**`web/src/app/api/generate/route.ts`** — Auth is **commented out**:

```typescript
// TODO: Re-enable auth in production
// const authHeader = req.headers.get('authorization');
// if (!authHeader?.startsWith('Bearer ')) {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// }
```

**Status: Works without auth today.** No changes needed to the endpoint.

### Request Shape

```typescript
POST /api/generate
Content-Type: application/json

{
  transcript: string;
  target_keyword?: string;
  tone: 'professional' | 'casual' | 'conversational';
  target_length: string;  // e.g. '500-800 words'
}
```

### Response Shape

```typescript
{
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
}
```

### Future Auth Hardening

When auth is re-enabled on these endpoints, the guest flow will break. The design should account for this by:

1. Adding a `X-Guest-Token` header mechanism (a short-lived HMAC token issued by the server)
2. Or keeping a dedicated `/api/guest/transcribe` and `/api/guest/generate` endpoint that has its own rate limiting

For now, since auth is commented out, the guest flow works as-is.

---

## 5. Local Draft Storage

### Approach: Dedicated Zustand Store with AsyncStorage Persistence

Rather than mixing guest drafts into the existing `drafts` AsyncStorage key (which is used for authenticated users' local cache), create a **dedicated `guest-draft-store.ts`**.

### New Store: `mobile-app/stores/guest-draft-store.ts`

```typescript
interface GuestDraft {
  id: "guest-draft"; // fixed sentinel ID
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
  transcript: string;
  targetKeyword?: string;
  tone: Tone;
  length: Length;
  audioDuration?: number;
  createdAt: string;
}

interface GuestDraftState {
  draft: GuestDraft | null;
  setGuestDraft: (draft: GuestDraft) => void;
  clearGuestDraft: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
```

**Persistence:** Use `zustand/middleware` `persist` with `AsyncStorage` under key `guest-draft-storage`.

**Why not AsyncStorage directly?**

- Zustand gives reactive updates — the draft screen can subscribe and re-render
- Consistent with existing patterns (`guest-store.ts`, `auth-store.ts`)
- Hydration state tracking prevents flash of empty content

**Why not the existing `drafts` AsyncStorage key?**

- Avoids polluting the authenticated user's draft list
- Guest draft has a fixed ID (`'guest-draft'`) — no UUID needed
- Easier to clear on sign-up/sign-in

### Draft Lifecycle

| Event                        | Action                                            |
| ---------------------------- | ------------------------------------------------- |
| Guest completes processing   | `setGuestDraft(draft)`                            |
| Guest signs up / signs in    | `clearGuestDraft()` + migrate draft to server     |
| Guest dismisses sign-up gate | Draft persists (they can come back)               |
| App reinstall                | Draft cleared (AsyncStorage wiped)                |
| Second recording attempt     | Blocked by `canRecord` check (trial already used) |

### Draft Migration on Sign-Up

When a guest signs up after viewing their draft, offer to save it:

1. After successful auth, check `guestDraftStore.draft !== null`
2. Show a prompt: "Save your draft to your account?"
3. If yes: call `createPost()` with the guest draft data, then `clearGuestDraft()`
4. Navigate to the saved post

This is a **Phase 2** enhancement — not required for the initial implementation.

---

## 6. Sign-Up Gate on Draft Screen

### Current Behavior (Authenticated Users)

The existing `ContentGate` in `draft/[id].tsx` triggers when:

- `isHydrated && !isAuthenticated && hasUsedFreeTrial && !showContentGate`
- Scroll position > 30% of content

This is a **blocking overlay** that covers the content with a blur effect.

### Problem with Current Approach for Guest Full-Flow

The current gate is designed for the **old** guest flow where guests could only _view_ existing drafts (not create them). For the new full-flow:

- The guest **just created** the draft — they should see it fully
- The gate should be a **non-blocking prompt at the bottom**, not a content blocker
- The message should be "Sign up to **save** this draft" not "Sign in to **view** content"

### New Component: `SaveGate`

Create `mobile-app/components/ui/save-gate.tsx` — a bottom-anchored, non-blocking sign-up prompt.

```
┌─────────────────────────────────────┐
│  [Draft content visible above]      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🎉  Your draft is ready!   │    │
│  │                             │    │
│  │  Sign up to save it before  │    │
│  │  it disappears.             │    │
│  │                             │    │
│  │  ✓ Save drafts forever      │    │
│  │  ✓ Access from any device   │    │
│  │  ✓ Unlimited recordings     │    │
│  │                             │    │
│  │  [Create Free Account]      │    │
│  │  [Sign In]                  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Key differences from `ContentGate`:**

- No overlay/blur — content is fully readable
- Positioned at the bottom of the scroll view (not absolutely positioned)
- Icon is celebratory (🎉 or ✨) not a lock
- Message focuses on saving, not unlocking
- Appears immediately when draft loads (not scroll-triggered)

### Draft Screen Changes for Guest Mode

In `draft/[id].tsx`:

```typescript
// Detect guest draft
const isGuestDraft = id === "guest-draft";
const guestDraft = useGuestDraftStore((state) => state.draft);

// Load logic
const loadDraft = useCallback(async () => {
  if (isGuestDraft) {
    // Load from guest draft store
    if (guestDraft) {
      setDraft(guestDraft as Draft);
      setTitle(guestDraft.title);
      setContent(guestDraft.content);
      // ...
    }
    return;
  }
  // Existing AsyncStorage load for authenticated users
  // ...
}, [id, isGuestDraft, guestDraft]);
```

**Disable editing for guest drafts:**

- Make `TextInput` components read-only (`editable={false}`) when `isGuestDraft`
- Hide the save indicator
- Show a subtle "Read-only — sign up to edit" note

**Show `SaveGate` at bottom of scroll:**

```tsx
{
  isGuestDraft && <SaveGate onSignIn={handleSignIn} onSignUp={handleSignUp} />;
}
```

### Existing `ContentGate` — Keep or Modify?

**Keep** the existing `ContentGate` for the old use case (viewing other people's public posts as a guest). **Add** the new `SaveGate` for the new use case (guest viewing their own just-created draft).

The `triggerContentGate` logic in `draft/[id].tsx` should be **disabled** for guest drafts (since the guest created the draft, they should see it fully).

---

## 7. Rate Limiting Design

### Current State

`guest-store.ts` tracks:

- `hasUsedFreeTrial: boolean` — persisted in AsyncStorage
- `trialUsedAt: string | null` — timestamp

`use-guest-trial.ts` exposes:

- `canRecord` — `isAuthenticated || !hasUsedFreeTrial`
- `shouldPromptSignIn` — `!isAuthenticated && hasUsedFreeTrial`

### Recommended Approach: 1 Trial Per Device Install

**Rationale:** The goal is to give users a taste of the product, not to provide a free service. One trial per device install is the right balance:

- Simple to implement (already partially done)
- Hard to abuse without reinstalling the app
- Clear value proposition: "You've seen what it can do — sign up for unlimited"

### Client-Side Rate Limiting (Primary)

**What to track in `guest-store.ts`:**

```typescript
interface GuestState {
  hasUsedFreeTrial: boolean;
  trialUsedAt: string | null;
  trialCompletedSuccessfully: boolean; // NEW: did they get a draft?
  _hasHydrated: boolean;
}
```

**When to mark trial used:**

- **Current (wrong):** Marked used when recording stops, even if processing fails
- **Proposed (correct):** Mark used only after `setGuestDraft()` succeeds in `processing.tsx`
- This way, if transcription/generation fails, the guest can try again

**Flow:**

```
recording.tsx: stopRecordingLocally() → navigate to keyword (trial NOT yet marked)
processing.tsx:
  - on success: markTrialUsed() + setGuestDraft() → navigate to draft
  - on error: do NOT mark trial used → guest can retry
```

### Server-Side Rate Limiting (Defense in Depth)

Even though auth is commented out, add IP-based rate limiting on the two unauthenticated endpoints:

**`/api/transcribe/base64`** — Add rate limiting middleware:

```typescript
// 3 requests per IP per hour (generous for legitimate use, blocks abuse)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const limit = rateLimit.get(ip);

  if (limit && limit.resetAt > now && limit.count >= 3) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  // ... rest of handler
}
```

**`/api/generate`** — Same pattern, 3 requests per IP per hour.

**Note:** In-memory rate limiting resets on server restart. For production, use Redis or Upstash. For MVP, in-memory is acceptable.

### Rate Limit Values

| Endpoint                 | Limit      | Window      | Rationale                 |
| ------------------------ | ---------- | ----------- | ------------------------- |
| `/api/transcribe/base64` | 3 requests | 1 hour      | Allows retries on failure |
| `/api/generate`          | 3 requests | 1 hour      | Allows retries on failure |
| Client-side trial        | 1 trial    | Per install | One full flow per device  |

### What About VPN/IP Rotation?

Server-side IP limiting is not foolproof. The primary defense is the client-side trial flag in AsyncStorage. The server-side limit is a secondary defense against:

- Automated abuse
- Users who clear app data to reset the trial

For MVP, this is sufficient. Future hardening could include:

- Device fingerprinting (Expo `Device.osBuildId`)
- Anonymous session tokens with server-side tracking

---

## 8. Implementation Plan

### Architecture Diagram

```
Guest Full-Flow
═══════════════

recording.tsx
  ├─ [auth] → stopRecordingAndUploadToS3() → /keyword (S3 params)
  └─ [guest] → stopRecordingLocally() → /keyword (local URI + isGuestFlow flag)
                                                    ↓
                                              keyword.tsx
                                         (no changes needed)
                                                    ↓
                                         draft/processing.tsx
                                    ├─ [auth] → transcribeS3 → generate → createPost → /draft/[id]
                                    └─ [guest] → transcribeBase64 → generate → setGuestDraft → /draft/guest-draft
                                                                                                        ↓
                                                                                          (tabs)/draft/[id].tsx
                                                                                     ├─ [auth] → load from AsyncStorage
                                                                                     └─ [guest] → load from guestDraftStore
                                                                                                  + show SaveGate at bottom
```

### File Changes

#### New Files

| File                                     | Purpose                                        |
| ---------------------------------------- | ---------------------------------------------- |
| `mobile-app/stores/guest-draft-store.ts` | Zustand store for guest's generated draft      |
| `mobile-app/components/ui/save-gate.tsx` | Bottom-anchored sign-up prompt for guest draft |

#### Modified Files

| File                                             | Changes                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| `mobile-app/app/recording.tsx`                   | Replace guest early-return with guest flow navigation  |
| `mobile-app/services/audio/recording-service.ts` | Add `stopRecordingLocally()` method                    |
| `mobile-app/app/draft/processing.tsx`            | Add guest branch: skip createPost, use guestDraftStore |
| `mobile-app/app/(tabs)/draft/[id].tsx`           | Add guest draft loading + SaveGate                     |
| `mobile-app/stores/guest-store.ts`               | Add `trialCompletedSuccessfully` field                 |
| `mobile-app/hooks/use-guest-trial.ts`            | Expose new field                                       |
| `mobile-app/stores/index.ts`                     | Export new guest-draft-store                           |
| `web/src/app/api/transcribe/base64/route.ts`     | Add IP-based rate limiting                             |
| `web/src/app/api/generate/route.ts`              | Add IP-based rate limiting                             |

### Detailed Code Changes

---

#### Step 1: `recording-service.ts` — Add `stopRecordingLocally()`

```typescript
export interface LocalRecordingResult {
  localUri: string;
  duration: number;
  fileSize?: number;
  mimeType?: string;
}

async stopRecordingLocally(): Promise<LocalRecordingResult> {
  // Same as stopRecording() but:
  // 1. Does NOT upload to S3
  // 2. Keeps the local file (does not delete it)
  // 3. Returns the local URI for base64 transcription
  const result = await this.stopRecording(); // existing method
  const mimeType = getMimeType(result.uri);
  const fileInfo = await getInfoAsync(result.uri);
  return {
    localUri: result.uri,
    duration: result.duration,
    fileSize: fileInfo.exists ? fileInfo.size : undefined,
    mimeType,
  };
}
```

---

#### Step 2: `guest-draft-store.ts` — New Store

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Tone, Length } from "@/types/draft";

export interface GuestDraft {
  id: "guest-draft";
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
  transcript: string;
  targetKeyword?: string;
  tone: Tone;
  length: Length;
  audioDuration?: number;
  createdAt: string;
}

interface GuestDraftState {
  draft: GuestDraft | null;
  _hasHydrated: boolean;
  setGuestDraft: (draft: Omit<GuestDraft, "id">) => void;
  clearGuestDraft: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useGuestDraftStore = create<GuestDraftState>()(
  persist(
    (set) => ({
      draft: null,
      _hasHydrated: false,
      setGuestDraft: (draftData) =>
        set({ draft: { ...draftData, id: "guest-draft" } }),
      clearGuestDraft: () => set({ draft: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "guest-draft-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ draft: state.draft }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
```

---

#### Step 3: `recording.tsx` — Replace Guest Block

**Remove** (lines ~329–363):

```typescript
if (!isAuthenticated) {
  // ... cancel recording, show Alert, return
}
```

**Replace with:**

```typescript
if (!isAuthenticated) {
  try {
    setIsUploading(true);
    setUploadMessage("Saving recording...");

    const localResult = await recordingService.stopRecordingLocally();

    setIsUploading(false);
    setRecording(false);
    setPaused(false);
    setLastMilestone(0);

    // Show celebration (same as auth flow)
    setCelebration({
      visible: true,
      message: "Nice work! Let's turn this into a blog post.",
    });

    celebrationTimerRef.current = setTimeout(() => {
      setCelebration({ visible: false, message: "" });
      router.push({
        pathname: "/keyword",
        params: {
          audioUri: localResult.localUri,
          duration: localResult.duration.toString(),
          fileSize: localResult.fileSize?.toString() || "",
          mimeType: localResult.mimeType || "",
          isGuestFlow: "true",
        },
      });
    }, 1500);
  } catch (error) {
    setIsUploading(false);
    const warmError = getWarmErrorMessage("recordingError");
    Alert.alert(warmError.title, warmError.message, [
      {
        text: "OK",
        onPress: async () => {
          await resetStore();
        },
      },
    ]);
  }
  return;
}
```

---

#### Step 4: `draft/processing.tsx` — Add Guest Branch

**Add param:**

```typescript
const params = useLocalSearchParams<{
  audioUri?: string;
  audioFileUrl?: string;
  audioS3Key?: string;
  duration: string;
  keyword?: string;
  tone: string;
  length: string;
  fileSize?: string;
  mimeType?: string;
  isGuestFlow?: string; // NEW
}>();
```

**Add store import:**

```typescript
import { useGuestDraftStore } from "@/stores/guest-draft-store";
import { useGuestStore } from "@/stores/guest-store";
```

**In `processRecording()`**, after `generateMutation.mutateAsync()` succeeds:

```typescript
const isGuestFlow = params.isGuestFlow === "true";

if (isGuestFlow) {
  // Guest path: store locally, skip createPost
  const { setGuestDraft } = useGuestDraftStore.getState();
  const { markTrialUsed } = useGuestStore.getState();

  setGuestDraft({
    title: blog.title,
    metaDescription: blog.metaDescription,
    content: blog.content,
    wordCount: blog.wordCount,
    transcript: transcription.text,
    targetKeyword: params.keyword,
    tone: params.tone as Tone,
    length: params.length as Length,
    audioDuration: parseInt(params.duration!, 10),
    createdAt: new Date().toISOString(),
  });

  // Mark trial used ONLY after successful draft creation
  markTrialUsed();

  setStep("complete");
  setTimeout(() => {
    router.replace({
      pathname: "/(tabs)/draft/[id]",
      params: { id: "guest-draft" },
    });
  }, 1000);
  return;
}

// Existing auth path: createPost, AsyncStorage, etc.
const post = await createPost(createData);
// ...
```

---

#### Step 5: `save-gate.tsx` — New Component

```typescript
interface SaveGateProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export function SaveGate({ onSignIn, onSignUp }: SaveGateProps) {
  // Non-blocking bottom card (not an overlay)
  // Uses same design tokens as ContentGate
  // Icon: sparkles/celebration (not lock)
  // Title: "Save your draft"
  // Description: "Sign up free to save this draft and create unlimited posts"
  // Benefits: Save forever, Edit anytime, Access anywhere
  // Buttons: "Create Free Account" (primary), "Sign In" (secondary)
}
```

---

#### Step 6: `draft/[id].tsx` — Guest Draft Support

**Add imports:**

```typescript
import { useGuestDraftStore } from "@/stores/guest-draft-store";
import { SaveGate } from "@/components/ui/save-gate";
```

**Add guest detection:**

```typescript
const isGuestDraft = id === "guest-draft";
const guestDraft = useGuestDraftStore((state) => state.draft);
const guestDraftHydrated = useGuestDraftStore((state) => state._hasHydrated);
```

**Modify `loadDraft()`:**

```typescript
const loadDraft = useCallback(async () => {
  if (isGuestDraft) {
    if (guestDraftHydrated && guestDraft) {
      setDraft({
        ...guestDraft,
        status: "ready",
        isFavorite: false,
        updatedAt: guestDraft.createdAt,
      } as Draft);
      setTitle(guestDraft.title);
      setMetaDescription(guestDraft.metaDescription);
      setContent(guestDraft.content);
      setPreviousWordCount(guestDraft.wordCount);
    }
    return;
  }
  // Existing AsyncStorage load...
}, [id, isGuestDraft, guestDraft, guestDraftHydrated]);
```

**Disable editing for guest:**

```typescript
// In TextInput components:
editable={!isGuestDraft}
```

**Disable scroll-triggered ContentGate for guest drafts:**

```typescript
const triggerContentGate = useCallback(() => {
  if (isGuestDraft) return; // Guest sees SaveGate instead
  if (isHydrated && !isAuthenticated && hasUsedFreeTrial && !showContentGate) {
    setShowContentGate(true);
  }
}, [
  isGuestDraft,
  isHydrated,
  isAuthenticated,
  hasUsedFreeTrial,
  showContentGate,
]);
```

**Add SaveGate at bottom of scroll content:**

```tsx
{
  /* At the end of ScrollView content */
}
{
  isGuestDraft && <SaveGate onSignIn={handleSignIn} onSignUp={handleSignUp} />;
}
```

---

#### Step 7: Server-Side Rate Limiting

**`web/src/app/api/transcribe/base64/route.ts`:**

```typescript
// Simple in-memory rate limiter (replace with Redis for production)
const ipRequests = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    ipRequests.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // ... existing handler
}
```

Apply same pattern to `web/src/app/api/generate/route.ts`.

---

### Implementation Order

```
Phase 1 — Core Guest Flow (MVP)
  1. recording-service.ts: Add stopRecordingLocally()
  2. guest-draft-store.ts: Create new store
  3. stores/index.ts: Export new store
  4. recording.tsx: Replace guest block with guest flow
  5. draft/processing.tsx: Add guest branch
  6. save-gate.tsx: Create new component
  7. (tabs)/draft/[id].tsx: Add guest draft support + SaveGate

Phase 2 — Rate Limiting
  8. web/src/app/api/transcribe/base64/route.ts: Add IP rate limiting
  9. web/src/app/api/generate/route.ts: Add IP rate limiting

Phase 3 — Polish (Optional)
  10. Draft migration on sign-up (offer to save guest draft)
  11. Error handling improvements (retry on transcription failure)
  12. Analytics events for guest trial funnel
```

---

### Edge Cases & Error Handling

| Scenario                                   | Handling                                           |
| ------------------------------------------ | -------------------------------------------------- |
| Transcription fails for guest              | Do NOT mark trial used; show retry button          |
| Generation fails for guest                 | Do NOT mark trial used; show retry button          |
| Guest draft store not hydrated             | Show loading state in draft screen                 |
| Guest navigates away before seeing draft   | Draft persists in AsyncStorage via Zustand persist |
| Guest tries to record again                | `canRecord = false` → Alert to sign in             |
| Guest signs in after viewing draft         | `clearGuestDraft()` on successful auth             |
| Local audio file deleted before processing | Show error, do NOT mark trial used                 |
| Rate limit hit on server                   | Show user-friendly error, do NOT mark trial used   |

---

### Security Considerations

1. **No sensitive data in guest draft** — The draft is stored locally only; no PII is persisted server-side for guests
2. **Audio file cleanup** — After successful transcription, delete the local audio file to free storage
3. **Rate limiting** — Both client-side (1 trial) and server-side (3 req/hr/IP) prevent abuse
4. **No guest tokens** — The guest flow uses no auth tokens; the endpoints are intentionally open (with rate limiting)
5. **Trial flag integrity** — The `hasUsedFreeTrial` flag is only set after successful draft creation, preventing false positives from failed attempts

---

### Open Questions

1. **Should the keyword screen be skipped for guests?** The current design keeps it (same UX as auth users). Skipping it would reduce friction but lose the tone/length customization.

2. **Should guests be able to retry if transcription fails?** The design allows retries (trial not marked until success). This is the right UX but means a determined user could attempt multiple transcriptions before one succeeds.

3. **Draft migration on sign-up** — Should we automatically offer to save the guest draft when they sign up? This is a high-value conversion moment. Recommended for Phase 2.

4. **Audio file size limit** — Should we add a client-side check before attempting base64 transcription? Files > 10MB might cause issues. Recommend adding a check: if `fileSize > 10MB`, show a warning.
