# Scroll-Triggered Content Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add scroll-triggered sign-in prompt for guest drafts that appears when users scroll past 50% of content, with the bottom 50% blurred.

**Architecture:** Modify GuestDraftGate component to add scroll detection using Animated.ScrollView, track scroll position, and show a modal overlay when scroll exceeds 50%. Use local state for prompt visibility (no AsyncStorage needed - prompt always triggers on scroll).

**Tech Stack:** React Native, Expo, react-native-reanimated, Zustand, expo-router, Ionicons

---

## Task 1: Create useScrollGate Hook

**Files:**
- Create: `mobile-app/hooks/use-scroll-gate.ts`

**Step 1: Write the hook implementation**

```typescript
import { useRef, useCallback } from 'react';
import { useAnimatedScrollHandler } from 'react-native-reanimated';

interface UseScrollGateOptions {
  threshold?: number; // 0-1, default 0.5 (50%)
  onTrigger: () => void;
}

interface UseScrollGateResult {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetTrigger: () => void;
}

export function useScrollGate(
  options: UseScrollGateOptions
): UseScrollGateResult {
  const { threshold = 0.5, onTrigger } = options;

  const hasTriggered = useRef(false);
  const contentHeightRef = useRef(0);
  const scrollViewHeightRef = useRef(0);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        const { contentHeight, layoutMeasurement } = event;

        contentHeightRef.current = contentHeight;
        scrollViewHeightRef.current = layoutMeasurement.height;

        const maxScroll = contentHeight - layoutMeasurement.height;
        if (maxScroll <= 0) return; // Content fits on screen

        const scrollPercentage = event.contentOffset.y / maxScroll;

        // Trigger when scroll exceeds threshold and prompt isn't already showing
        if (scrollPercentage > threshold && !hasTriggered.current) {
          hasTriggered.current = true;
          // Run on JS thread
          runOnJS('onTrigger', onTrigger);
        }
      },
    },
    [threshold, onTrigger]
  );

  const resetTrigger = useCallback(() => {
    hasTriggered.current = false;
  }, []);

  return { scrollHandler, resetTrigger };
}

// Helper to run function on JS thread
function runOnJS(name: string, fn: () => void) {
  'worklet';
  // @ts-expect-error - Reanimated global
  _runOnJS(fn);
}
```

**Step 2: Run TypeScript check**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No errors (new file)

**Step 3: Commit**

```bash
git add mobile-app/hooks/use-scroll-gate.ts
git commit -m "feat(hooks): add useScrollGate hook for scroll-triggered gates

- Tracks scroll position relative to content height
- Triggers callback when scroll exceeds threshold (default 50%)
- Provides resetTrigger for re-enabling the trigger
- Uses Reanimated worklets for performance"
```

---

## Task 2: Create ScrollTriggeredPrompt Component

**Files:**
- Create: `mobile-app/components/ui/scroll-triggered-prompt.tsx`

**Step 1: Write the component**

```typescript
import { PressableScale } from '@/components/ui/animated/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design-system';

interface ScrollTriggeredPromptProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ScrollTriggeredPrompt({
  visible,
  onDismiss,
}: ScrollTriggeredPromptProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(50, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSignUp = () => {
    router.push('/auth/sign-up');
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: `${colors.text}80` }]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {/* Lock Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="lock-closed" size={40} color={colors.primary} />
          </View>

          {/* Title */}
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Unlock Full Access
          </ThemedText>

          {/* Subtitle */}
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign up to read the rest of this draft and create your own
          </ThemedText>

          {/* Buttons */}
          <View style={styles.buttons}>
            <PressableScale
              onPress={handleSignUp}
              hapticStyle="medium"
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person-add" size={20} color={colors.textInverse} />
              <ThemedText style={[styles.buttonText, { color: colors.textInverse }]}>
                Sign Up
              </ThemedText>
            </PressableScale>

            <PressableScale
              onPress={handleSignIn}
              hapticStyle="light"
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
            >
              <ThemedText style={[styles.buttonTextSecondary, { color: colors.text }]}>
                Sign In
              </ThemedText>
            </PressableScale>
          </View>

          {/* Maybe Later */}
          <PressableScale onPress={onDismiss} hapticStyle="light">
            <ThemedText style={[styles.dismissText, { color: colors.textTertiary }]}>
              Maybe Later
            </ThemedText>
          </PressableScale>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  container: {
    maxWidth: 340,
    width: '100%',
  },
  content: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    ...Shadows.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    textAlign: 'center',
    marginBottom: Spacing[2],
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    includeFontPadding: false,
  },
  buttons: {
    gap: Spacing[3],
    width: '100%',
    marginBottom: Spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.xl,
    minHeight: 48,
  },
  primaryButton: {
    ...Shadows.md,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.extrabold,
    includeFontPadding: false,
  },
  buttonTextSecondary: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  dismissText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    includeFontPadding: false,
  },
});
```

**Step 2: Run TypeScript check**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add mobile-app/components/ui/scroll-triggered-prompt.tsx
git commit -m "feat(ui): add ScrollTriggeredPrompt component

- Full-screen modal overlay for scroll-triggered gating
- Shows lock icon, title, subtitle with sign CTAs
- Animated entry/exit with fade and slide
- Handles navigation to sign-in/sign-up screens"
```

---

## Task 3: Create New GuestDraftGate Component with Scroll Detection

**Files:**
- Create: `mobile-app/components/ui/guest-draft-scroll-gate.tsx`

**Step 1: Write the enhanced GuestDraftGate component**

```typescript
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScrollTriggeredPrompt } from '@/components/ui/scroll-triggered-prompt';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useScrollGate } from '@/hooks/use-scroll-gate';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated,
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { Spacing, Typography, BorderRadius, withOpacity } from '@/constants/design-system';

const AnimatedScrollView = Animated.ScrollView;

interface GuestDraftScrollGateProps {
  children: React.ReactNode;
}

export function GuestDraftScrollGate({ children }: GuestDraftScrollGateProps) {
  const colors = useThemeColors();
  const [promptVisible, setPromptVisible] = useState(false);
  const scrollEnabledRef = useRef(true);

  // Use the scroll gate hook
  const { scrollHandler, resetTrigger } = useScrollGate({
    threshold: 0.5, // 50%
    onTrigger: () => setPromptVisible(true),
  });

  // Scroll handler wrapper that disables scroll when prompt is visible
  const handleScroll = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        if (!scrollEnabledRef.current) return;
        scrollHandler(event);
      },
    },
    [scrollHandler]
  );

  const handleDismiss = () => {
    setPromptVisible(false);
    // User can continue scrolling, but we'll reset trigger so it shows again
    resetTrigger();
    // Navigate back to top of content
    // @ts-expect-error - Ref has scrollTo method
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Re-enable scroll
    scrollEnabledRef.current = true;
  };

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  return (
    <ThemedView style={styles.container}>
      <AnimatedScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {children}
      </AnimatedScrollView>

      {/* Blur overlay for bottom 50% */}
      <View style={styles.blurOverlay} pointerEvents="none">
        <LinearGradient
          colors={['transparent', colors.surface]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />
      </View>

      {/* Scroll-triggered prompt */}
      <ScrollTriggeredPrompt
        visible={promptVisible}
        onDismiss={handleDismiss}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  blurOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%', // Slightly more than 50% for smoother transition
    pointerEvents: 'none',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
```

**Step 2: Run TypeScript check**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add mobile-app/components/ui/guest-draft-scroll-gate.tsx
git commit -m "feat(ui): add GuestDraftScrollGate with scroll-triggered prompt

- Wraps content in Animated.ScrollView with scroll detection
- Applies gradient blur to bottom 50% of content
- Triggers sign-in prompt when scroll exceeds 50%
- Dismissing prompt scrolls to top and resets trigger"
```

---

## Task 4: Update Draft Detail Screen to Use New Scroll Gate

**Files:**
- Modify: `mobile-app/app/(tabs)/draft/[id].tsx`

**Step 1: Add import for GuestDraftScrollGate**

At the top of the file, add:
```typescript
import { GuestDraftScrollGate } from '@/components/ui/guest-draft-scroll-gate';
```

**Step 2: Replace GuestDraftGate usage with GuestDraftScrollGate**

Find the existing `GuestDraftGate` component usage and replace it. The current code likely has:
```typescript
{isGuestFlow && (
  <GuestDraftGate onSignUp={() => router.push('/auth/sign-up')} />
)}
```

Replace with:
```typescript
{isGuestFlow && (
  <GuestDraftScrollGate>
    {/* The preview content that's currently rendered */}
  </GuestDraftScrollGate>
)}
```

**Step 3: Wrap preview content in GuestDraftScrollGate**

The preview content (the markdown rendered text) should be wrapped. Look for the preview mode rendering and wrap it. The structure should be:

```typescript
{isGuestFlow ? (
  <GuestDraftScrollGate>
    {previewContent}
  </GuestDraftScrollGate>
) : (
  previewContent
)}
```

**Step 4: Test the changes**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No type errors

**Step 5: Commit**

```bash
git add mobile-app/app/\(tabs\)/draft/\[id\].tsx
git commit -m "feat(draft): use scroll-triggered gate for guest drafts

- Replace static GuestDraftGate with GuestDraftScrollGate
- Content now wrapped in scroll-aware gate component
- Prompt appears on scroll past 50%"
```

---

## Task 5: Fix runOnJS Typing in useScrollGate Hook

**Files:**
- Modify: `mobile-app/hooks/use-scroll-gate.ts`

**Step 1: Fix the worklet function**

Replace the `runOnJS` helper function with proper Reanimated API:

```typescript
import { useRef, useCallback } from 'react';
import { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';

interface UseScrollGateOptions {
  threshold?: number;
  onTrigger: () => void;
}

interface UseScrollGateResult {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  resetTrigger: () => void;
}

export function useScrollGate(
  options: UseScrollGateOptions
): UseScrollGateResult {
  const { threshold = 0.5, onTrigger } = options;

  const hasTriggered = useRef(false);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        'worklet';
        const { contentHeight, layoutMeasurement } = event;

        const maxScroll = contentHeight - layoutMeasurement.height;
        if (maxScroll <= 0) return;

        const scrollPercentage = event.contentOffset.y / maxScroll;

        if (scrollPercentage > threshold && !hasTriggered.current) {
          hasTriggered.current = true;
          runOnJS(onTrigger);
        }
      },
    },
    [threshold, onTrigger]
  );

  const resetTrigger = useCallback(() => {
    hasTriggered.current = false;
  }, []);

  return { scrollHandler, resetTrigger };
}
```

**Step 2: Run TypeScript check**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add mobile-app/hooks/use-scroll-gate.ts
git commit -m "fix(hooks): use Reanimated's runOnJS directly

- Remove custom runOnJS helper
- Use runOnJS from react-native-reanimated package"
```

---

## Task 6: Export New Components from Index

**Files:**
- Modify: `mobile-app/components/ui/index.ts`

**Step 1: Add exports for new components**

Add to the index file (create if it doesn't exist):
```typescript
export { GuestDraftScrollGate } from './guest-draft-scroll-gate';
export { ScrollTriggeredPrompt } from './scroll-triggered-prompt';
```

**Step 2: Run TypeScript check**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add mobile-app/components/ui/index.ts
git commit -m "feat(components): export new scroll gate components"
```

---

## Task 7: Test Scroll-Triggered Gate Functionality

**Files:**
- Test: Manual testing in app

**Step 1: Start the development server**

Run: `cd mobile-app && npx expo start`

**Step 2: Create a guest draft**

1. Open the app
2. Start a recording as a guest
3. Complete the flow to generate a draft
4. Navigate to the draft detail page

**Step 3: Verify initial state**

Expected:
- Bottom 50% of content is blurred with gradient
- Can scroll freely through visible content
- No prompt shown initially

**Step 4: Test scroll trigger**

1. Scroll slowly toward the bottom
2. When scroll reaches ~50%, the prompt should appear

Expected:
- Prompt fades in with slide-up animation
- Shows lock icon, "Unlock Full Access", sign up/sign in buttons
- Scroll is blocked at trigger point

**Step 5: Test "Maybe Later"**

1. Tap "Maybe Later"
2. Verify prompt disappears

Expected:
- Prompt fades out
- Content scrolls back to top
- Can scroll freely again

**Step 6: Test re-trigger**

1. Scroll past 50% again
2. Verify prompt appears again

Expected:
- Prompt shows again (should be one-time only per scroll session)

**Step 7: Test sign-in/sign-up buttons**

1. With prompt visible, tap "Sign Up" or "Sign In"
2. Verify navigation to auth screen

Expected:
- Navigates to `/auth/sign-up` or `/auth/sign-in`
- Prompt disappears as we navigate away

**Step 8: Test auth state persistence**

1. Sign in/sign up successfully
2. Navigate back to draft

Expected:
- Content is fully visible (no blur)
- No scroll trigger activates
- Full access to draft

---

## Task 8: Clean Up Old GuestDraftGate (Optional)

**Files:**
- Modify: `mobile-app/components/ui/content-gate.tsx` or rename old component

**Step 1: Verify old GuestDraftGate is no longer used**

Run: `cd mobile-app && grep -r "GuestDraftGate" --exclude-dir=node_modules`

Expected: Only found in the definition file and any index exports

**Step 2: Remove or deprecate old component**

Option A - Remove the old `GuestDraftGate` component:
```bash
rm mobile-app/components/ui/guest-draft-gate.tsx
```

Option B - Keep it but mark as deprecated:
Add comment at top: `// @deprecated - Use GuestDraftScrollGate instead`

**Step 3: Update exports**

Update `mobile-app/components/ui/index.ts` to remove or mark as deprecated.

**Step 4: Run TypeScript check**

Run: `cd mobile-app && npx tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated GuestDraftGate component

- Replaced by GuestDraftScrollGate with scroll detection
- Old static gate no longer needed"
```

---

## Summary

This implementation plan creates a scroll-triggered content gate for guest drafts with:

1. **`useScrollGate` hook** - Manages scroll detection and trigger logic
2. **`ScrollTriggeredPrompt` component** - Modal overlay with sign-in/sign-up CTAs
3. **`GuestDraftScrollGate` component** - Wraps content with scroll detection and blur overlay
4. **Integration** - Updated draft detail screen to use the new scroll gate

The implementation:
- Triggers prompt every time user scrolls past 50%
- Persists state across navigation (blur + trigger always active for guests)
- Provides clear CTAs for conversion
- Uses Reanimated for smooth, performant animations
- Follows existing patterns in the codebase
