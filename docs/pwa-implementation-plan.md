# VoiceScribe PWA Implementation Plan

**Date:** 2026-03-12
**Status:** Ready to Implement
**Scope:** Implement PWA features with reusable component library

---

## Context

The VoiceScribe web app currently has:
- **Violet-based color scheme** (electric violet using OKLCH)
- **Blog discovery and reading** functionality
- **Good component foundation** with semantic HTML and Tailwind CSS

We need to add PWA capabilities while maintaining the current design system. The `design-system.html` file contains component patterns that should be converted to reusable React components.

---

## Design Decisions

### Color Scheme
**Keep current violet-based theme** - do NOT switch to turquoise from design-system.html
- Primary: `oklch(0.52 0.28 285)` (electric violet)
- Accent: `oklch(0.62 0.22 38)` (sharp coral)
- Continue using existing design tokens in `globals.css`

### Component Architecture
Extract component patterns from `design-system.html` as proper React components:
- Semantic HTML (button, not div)
- Proper TypeScript props
- ARIA attributes for accessibility
- Tailwind CSS classes instead of inline styles
- Consistent with existing app patterns

### Implementation Order
1. PWA Configuration (foundation)
2. Component Library (reusable components)
3. Authentication Pages
4. Recording Screen
5. Drafts Library

---

## Phase 1: PWA Foundation

### 1.1 Install Dependencies

```bash
cd web
npm install next-pwa zustand idb
```

### 1.2 Configure PWA

**File: `web/next.config.js`**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // existing Next.js config
});
```

### 1.3 Create App Manifest

**File: `web/public/manifest.json`**
```json
{
  "name": "VoiceScribe",
  "short_name": "VoiceScribe",
  "description": "Turn your voice into blog posts with AI",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "oklch(0.52 0.28 285)",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 1.4 Create App Icons

Generate violet-themed icons using the Waveform Mic design (#4):
- `/web/public/icon-192.png` - 192x192
- `/web/public/icon-512.png` - 512x512

---

## Phase 2: Component Library

Extract reusable components from `design-system.html` patterns.

### 2.1 Button Component

**File: `src/components/ui/Button.tsx`**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}
```

### 2.2 Card Component

**File: `src/components/ui/Card.tsx`**
```typescript
interface CardProps {
  variant?: 'default' | 'draft' | 'featured';
  interactive?: boolean;
  children: React.ReactNode;
}
```

### 2.3 Modal Component

**File: `src/components/ui/Modal.tsx`**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}
```

### 2.4 Input/Form Components

**Files:**
- `src/components/ui/Input.tsx` - Text input with validation states
- `src/components/ui/Textarea.tsx` - Textarea with auto-resize
- `src/components/ui/Select.tsx` - Dropdown select
- `src/components/ui/RadioGroup.tsx` - Radio button group

### 2.5 Toast Notification

**File: `src/components/ui/Toast.tsx`**
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}
```

### 2.6 Navigation Bar Component

**File: `src/components/layout/PWANavbar.tsx`**
```typescript
interface PWANavbarProps {
  activeTab: 'record' | 'drafts' | 'discover' | 'profile';
  onTabChange: (tab: string) => void;
}
```

---

## Phase 3: Authentication Pages

### 3.1 Sign In Page

**File: `src/app/auth/signin/page.tsx`**
- Email + password form
- "Sign in with Google" OAuth button
- Link to sign up
- Link to forgot password
- Use existing Supabase auth helpers

### 3.2 Sign Up Page

**File: `src/app/auth/signup/page.tsx`**
- Name, email, password form
- Password strength indicator
- "Sign up with Google" OAuth button
- Link to sign in
- Terms acceptance checkbox

### 3.3 Forgot Password Page

**File: `src/app/auth/forgot-password/page.tsx`**
- Email input form
- Submit button
- Back to sign in link

---

## Phase 4: Recording Screen

### 4.1 Audio Recorder Hook

**File: `src/hooks/useAudioRecorder.ts`**
```typescript
interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  requestPermission: () => Promise<boolean>;
}
```

### 4.2 Recording Page

**File: `src/app/record/page.tsx`**
- Large circular record button with gradient
- Waveform visualization (canvas-based)
- Duration display
- Recent drafts below
- Bottom navigation bar

### 4.3 Waveform Visualizer Component

**File: `src/components/recording/WaveformVisualizer.tsx`**
- Canvas-based rendering
- Real-time audio level updates
- Smooth animation at 20fps+

---

## Phase 5: Drafts Library

### 5.1 Drafts Page

**File: `src/app/drafts/page.tsx`**
- Grid/list view toggle
- Search bar
- Sort dropdown (date, title, word count)
- Filter tabs (all, draft, published, archived)
- Pull-to-refresh
- Infinite scroll or pagination

### 5.2 Draft Card Component

**File: `src/components/drafts/DraftCard.tsx`**
- Title, excerpt, word count
- Status badge (draft, published, archived)
- Date display
- Quick actions (edit, delete, publish)

### 5.3 Draft Editor Page

**File: `src/app/draft/[id]/page.tsx`**
- Edit/Preview tabs
- Markdown editor with toolbar
- Word count display
- Auto-save indicator
- Publish button
- Copy to clipboard

---

## State Management

### Zustand Stores

**Directory: `src/stores/`**

**File: `src/stores/auth-store.ts`**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**File: `src/stores/draft-store.ts`**
```typescript
interface DraftStore {
  drafts: Draft[];
  isLoading: boolean;
  fetchDrafts: () => Promise<void>;
  createDraft: (audioBlob: Blob) => Promise<void>;
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
}
```

**File: `src/stores/recording-store.ts`**
```typescript
interface RecordingStore {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}
```

**File: `src/stores/guest-store.ts`**
```typescript
interface GuestStore {
  guestId: string;
  remainingDrafts: number;
  decrementDrafts: () => void;
}
```

---

## File Structure Summary

### New Files to Create

```
web/
├── public/
│   ├── manifest.json (NEW)
│   ├── icon-192.png (NEW)
│   ├── icon-512.png (NEW)
│   └── sw.js (auto-generated by next-pwa)
│
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx (NEW)
│   │   │   ├── signup/
│   │   │   │   └── page.tsx (NEW)
│   │   │   └── forgot-password/
│   │   │       └── page.tsx (NEW)
│   │   ├── record/
│   │   │   └── page.tsx (NEW)
│   │   ├── drafts/
│   │   │   └── page.tsx (NEW)
│   │   └── draft/
│   │       └── [id]/
│   │           └── page.tsx (NEW)
│   │
│   ├── components/
│   │   ├── ui/ (NEW)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── badge.tsx
│   │   ├── layout/
│   │   │   └── PWANavbar.tsx (NEW)
│   │   ├── recording/ (NEW)
│   │   │   ├── RecordButton.tsx
│   │   │   └── WaveformVisualizer.tsx
│   │   ├── drafts/ (NEW)
│   │   │   ├── DraftCard.tsx
│   │   │   ├── DraftGrid.tsx
│   │   │   └── DraftEditor.tsx
│   │   └── auth/ (NEW)
│   │       ├── SignInForm.tsx
│   │       ├── SignUpForm.tsx
│   │       └── ForgotPasswordForm.tsx
│   │
│   ├── stores/ (NEW)
│   │   ├── auth-store.ts
│   │   ├── draft-store.ts
│   │   ├── recording-store.ts
│   │   └── guest-store.ts
│   │
│   └── hooks/ (NEW)
│       └── useAudioRecorder.ts
│
└── next.config.js (MODIFY)
```

### Files to Modify

```
web/
├── package.json (add dependencies)
├── tailwind.config.js (update if needed)
└── src/app/globals.css (may need updates)
```

---

## Verification Steps

### Phase 1 Verification
1. [ ] Run `npm install` successfully
2. [ ] Build app with `npm run build`
3. [ ] Check for PWA install prompt in Chrome DevTools
4. [ ] Verify manifest.json loads correctly

### Phase 2 Verification
1. [ ] Storybook or test page shows all UI components
2. [ ] Button works with all variants (primary, secondary, danger, ghost)
3. [ ] Modal opens/closes with keyboard (Escape key)
4. [ ] Form inputs show validation states
5. [ ] Toast notifications appear and auto-dismiss

### Phase 3 Verification
1. [ ] Sign in page renders without errors
2. [ ] Can navigate between auth pages
3. [ ] Form validation works client-side
4. [ ] OAuth button appears (Google sign in)

### Phase 4 Verification
1. [ ] Record page renders with record button
2. [ ] Microphone permission request appears
3. [ ] Waveform visualizes while recording
4. [ ] Duration counter updates in real-time
5. [ ] Recording stops and produces audio blob

### Phase 5 Verification
1. [ ] Drafts page shows list of drafts
2. [ ] Search filters drafts by title
3. [ ] Sort changes draft order
4. [ ] Draft card shows correct status badge
5. [ ] Draft editor loads and saves changes

---

## Success Criteria

1. **PWA Installable**: Can install to home screen on Android Chrome
2. **Components Reusable**: All UI components work independently
3. **Recording Works**: Can record audio and see waveform
4. **Auth Flow**: Can sign in/sign out with proper redirects
5. **Drafts Management**: Can create, edit, delete drafts
6. **Design Consistency**: Violet theme maintained throughout
7. **Accessibility**: All components have proper ARIA attributes

---

## Next Steps

1. Create `manifest.json` and app icons
2. Set up PWA configuration in `next.config.js`
3. Create UI component library starting with Button
4. Build authentication pages
5. Implement recording screen with audio visualization
6. Build drafts library with search/filter/sort
