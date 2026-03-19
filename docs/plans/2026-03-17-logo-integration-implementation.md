# Logo Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the VoiceScribe logo (icon + wordmark) to mobile splash screen and web navigation/home page with delightful animations

**Architecture:** Create reusable LogoIcon and LogoWordmark components for both platforms, apply animations using platform-specific APIs (React Native Animated for mobile, CSS/Tailwind for web)

**Tech Stack:** React Native (expo-router, Animated API), Next.js, Tailwind CSS, TypeScript

---

## Task 1: Copy Logo SVG Assets to Web Public Directory

**Files:**
- Copy: `assets/logo&icons/voicescribe-logo-midnight.svg` → `web/public/logo.svg`
- Copy: `assets/logo&icons/voicescribe-icon-midnight.svg` → `web/public/icon.svg`

**Step 1: Copy the logo files**

```bash
cp /home/matrix/VoiceScribe/assets/logo\&icons/voicescribe-logo-midnight.svg /home/matrix/VoiceScribe/web/public/logo.svg
cp /home/matrix/VoiceScribe/assets/logo\&icons/voicescribe-icon-midnight.svg /home/matrix/VoiceScribe/web/public/icon.svg
```

**Step 2: Verify files copied**

```bash
ls -la /home/matrix/VoiceScribe/web/public/*.svg
```

Expected: Should see `logo.svg` and `icon.svg`

**Step 3: Commit**

```bash
git add web/public/logo.svg web/public/icon.svg
git commit -m "feat: add VoiceScribe logo SVG assets to web public directory"
```

---

## Task 2: Copy Logo SVG Assets to Mobile Assets Directory

**Files:**
- Copy: `assets/logo&icons/voicescribe-icon-midnight.svg` → `mobile-app/assets/images/logo-icon.svg`

**Step 1: Copy the icon file to mobile assets**

```bash
cp /home/matrix/VoiceScribe/assets/logo\&icons/voicescribe-icon-midnight.svg /home/matrix/VoiceScribe/mobile-app/assets/images/logo-icon.svg
```

**Step 2: Verify file copied**

```bash
ls -la /home/matrix/VoiceScribe/mobile-app/assets/images/logo-icon.svg
```

Expected: Should see `logo-icon.svg`

**Step 3: Commit**

```bash
git add mobile-app/assets/images/logo-icon.svg
git commit -m "feat: add VoiceScribe logo icon to mobile assets"
```

---

## Task 3: Create Web LogoIcon Component

**Files:**
- Create: `web/src/components/logo/LogoIcon.tsx`

**Step 1: Create LogoIcon component directory**

```bash
mkdir -p /home/matrix/VoiceScribe/web/src/components/logo
```

**Step 2: Create the LogoIcon component**

```typescript
'use client';

import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 128,
  className = '',
  animate = false
}) => {
  // Animation styles
  const animationClass = animate ? 'animate-pulse-glow' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 480 480"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#AFA9EC"/>
          <stop offset="50%" stopColor="#9FE1CB"/>
          <stop offset="100%" stopColor="#5DCAA5"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="480" height="480" rx="108" fill="#121210"/>

      {/* Sound wave bars */}
      <g transform="translate(68, 112)" filter={animate ? "url(#glow)" : undefined}>
        <rect x="0"   y="50" width="14" height="64" rx="7" fill="url(#waveGrad)" opacity="0.55"/>
        <rect x="32"  y="24" width="14" height="116" rx="7" fill="url(#waveGrad)" opacity="0.70"/>
        <rect x="64"  y="0"  width="14" height="164" rx="7" fill="url(#waveGrad)" opacity="0.85"/>
        <rect x="96"  y="16" width="14" height="132" rx="7" fill="url(#waveGrad)" opacity="0.80"/>
        <rect x="128" y="40" width="14" height="84"  rx="7" fill="url(#waveGrad)" opacity="0.60"/>
      </g>

      {/* Arrow */}
      <path d="M236 240 L256 240" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <path d="M252 232 L262 240 L252 248" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>

      {/* Text lines */}
      <g transform="translate(278, 130)">
        <rect x="0" y="0"   width="124" height="10" rx="5" fill="#EEEDFE" opacity="0.85"/>
        <rect x="0" y="32"  width="94"  height="10" rx="5" fill="#CECBF6" opacity="0.65"/>
        <rect x="0" y="64"  width="112" height="10" rx="5" fill="#CECBF6" opacity="0.55"/>
        <rect x="0" y="96"  width="72"  height="10" rx="5" fill="#AFA9EC" opacity="0.45"/>
        <rect x="0" y="128" width="124" height="10" rx="5" fill="#CECBF6" opacity="0.60"/>
        <rect x="0" y="160" width="86"  height="10" rx="5" fill="#AFA9EC" opacity="0.40"/>
      </g>
    </svg>
  );
};
```

**Step 3: Create index file for exports**

```typescript
// web/src/components/logo/index.ts
export { LogoIcon } from './LogoIcon';
export { LogoWordmark } from './LogoWordmark';
```

**Step 4: Commit**

```bash
git add web/src/components/logo/
git commit -m "feat: add LogoIcon component with SVG gradient support"
```

---

## Task 4: Create Web LogoWordmark Component

**Files:**
- Create: `web/src/components/logo/LogoWordmark.tsx`

**Step 1: Create the LogoWordmark component**

```typescript
'use client';

import React from 'react';

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

const sizeStyles = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl'
};

const taglineSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export const LogoWordmark: React.FC<LogoWordmarkProps> = ({
  size = 'md',
  className = '',
  showTagline = false
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`font-bold tracking-tight ${sizeStyles[size]}`}>
        <span className="text-neutral-900 dark:text-neutral-100">Voice</span>
        <span className="text-primary-600 dark:text-primary-400 ml-1">Draft</span>
      </div>
      {showTagline && (
        <p className={`text-neutral-500 dark:text-neutral-400 mt-1 ${taglineSizes[size]}`}>
          Voice to blog, powered by AI
        </p>
      )}
    </div>
  );
};
```

**Step 2: Update index file**

```typescript
// web/src/components/logo/index.ts
export { LogoIcon } from './LogoIcon';
export { LogoWordmark } from './LogoWordmark';
```

**Step 3: Commit**

```bash
git add web/src/components/logo/LogoWordmark.tsx web/src/components/logo/index.ts
git commit -m "feat: add LogoWordmark component with size variants"
```

---

## Task 5: Add Animation Utilities to Web Global CSS

**Files:**
- Modify: `web/src/app/globals.css`

**Step 1: Add animation utilities at end of file**

```css
/* ============================================================
   LOGO ANIMATIONS - Delightful effects for brand identity
   ============================================================ */

/* Pulse glow effect */
@keyframes pulseGlow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(127, 119, 221, 0.3));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(159, 225, 203, 0.5));
    transform: scale(1.02);
  }
}

.animate-pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* Float animation for hero logo */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Staggered fade in */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-delay-100 { animation-delay: 0.1s; }
.animate-delay-200 { animation-delay: 0.2s; }
.animate-delay-300 { animation-delay: 0.3s; }
.animate-delay-400 { animation-delay: 0.4s; }
```

**Step 2: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat: add logo animation utilities (pulse-glow, float, fade-in-up)"
```

---

## Task 6: Add Logo to Web Navigation

**Files:**
- Modify: `web/src/components/layout/Navigation.tsx`

**Step 1: Read current Navigation component**

```bash
head -100 /home/matrix/VoiceScribe/web/src/components/layout/Navigation.tsx
```

**Step 2: Import logo components and add to navigation**

Add imports at top:
```typescript
import { LogoIcon, LogoWordmark } from '@/components/logo';
import Link from 'next/link';
```

Replace the current navigation brand section with:
```typescript
<Link href="/" className="flex items-center gap-2 group">
  <LogoIcon size={32} className="transition-transform duration-300 group-hover:scale-110" />
  <LogoWordmark size="md" className="hidden sm:block" />
</Link>
```

**Step 3: Commit**

```bash
git add web/src/components/layout/Navigation.tsx
git commit -m "feat: add logo to web navigation with hover scale effect"
```

---

## Task 7: Add Logo to Web Home Page Hero

**Files:**
- Modify: `web/src/app/page.tsx`

**Step 1: Read current home page**

```bash
head -50 /home/matrix/VoiceScribe/web/src/app/page.tsx
```

**Step 2: Add logo to hero section**

Add imports:
```typescript
import { LogoIcon, LogoWordmark } from '@/components/logo';
```

Replace/update hero content to include:
```typescript
<WithBottomNav>
  <main>
    <section className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* Logo Icon with animation */}
        <div className="animate-fade-in-up mb-8">
          <LogoIcon size={192} className="animate-float" animate={true} />
        </div>

        {/* Logo Wordmark */}
        <div className="animate-fade-in-up animate-delay-200 mb-4">
          <LogoWordmark size="xl" showTagline={true} />
        </div>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up animate-delay-400 mt-8">
          {/* existing buttons */}
        </div>
      </div>
    </section>
  </main>
</WithBottomNav>
```

**Step 3: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "feat: add animated logo to home page hero section"
```

---

## Task 8: Create Mobile LogoIcon Component

**Files:**
- Create: `mobile-app/components/logo/LogoIcon.tsx`

**Step 1: Create logo component directory**

```bash
mkdir -p /home/matrix/VoiceScribe/mobile-app/components/logo
```

**Step 2: Create the LogoIcon component**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Rect, G, Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface LogoIconProps {
  size?: number;
  animate?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 128,
  animate = false
}) => {
  // TODO: Add animations in next task
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 480 480">
        <Defs>
          <LinearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#AFA9EC" stopOpacity={1} />
            <Stop offset="50%" stopColor="#9FE1CB" stopOpacity={1} />
            <Stop offset="100%" stopColor="#5DCAA5" stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect x="0" y="0" width="480" height="480" rx="108" fill="#121210"/>

        {/* Sound wave bars */}
        <G x={68} y={112}>
          <Rect x="0"   y="50" width="14" height="64" rx="7" fill="url(#waveGrad)" opacity={0.55}/>
          <Rect x="32"  y="24" width="14" height="116" rx="7" fill="url(#waveGrad)" opacity={0.70}/>
          <Rect x="64"  y="0"  width="14" height="164" rx="7" fill="url(#waveGrad)" opacity={0.85}/>
          <Rect x="96"  y="16" width="14" height="132" rx="7" fill="url(#waveGrad)" opacity={0.80}/>
          <Rect x="128" y="40" width="14" height="84"  rx="7" fill="url(#waveGrad)" opacity={0.60}/>
        </G>

        {/* Arrow */}
        <Path d="M236 240 L256 240" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" opacity={0.5}/>
        <Path d="M252 232 L262 240 L252 248" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>

        {/* Text lines */}
        <G x={278} y={130}>
          <Rect x="0" y="0"   width="124" height="10" rx="5" fill="#EEEDFE" opacity={0.85}/>
          <Rect x="0" y="32"  width="94"  height="10" rx="5" fill="#CECBF6" opacity={0.65}/>
          <Rect x="0" y="64"  width="112" height="10" rx="5" fill="#CECBF6" opacity={0.55}/>
          <Rect x="0" y="96"  width="72"  height="10" rx="5" fill="#AFA9EC" opacity={0.45}/>
          <Rect x="0" y="128" width="124" height="10" rx="5" fill="#CECBF6" opacity={0.60}/>
          <Rect x="0" y="160" width="86"  height="10" rx="5" fill="#AFA9EC" opacity={0.40}/>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Step 3: Create index file**

```typescript
// mobile-app/components/logo/index.ts
export { LogoIcon } from './LogoIcon';
export { LogoWordmark } from './LogoWordmark';
```

**Step 4: Commit**

```bash
git add mobile-app/components/logo/
git commit -m "feat: add LogoIcon component for mobile app"
```

---

## Task 9: Create Mobile LogoWordmark Component

**Files:**
- Create: `mobile-app/components/logo/LogoWordmark.tsx`

**Step 1: Create the LogoWordmark component**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

const fontSizeMap = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 48
};

const taglineSizeMap = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18
};

export const LogoWordmark: React.FC<LogoWordmarkProps> = ({
  size = 'md',
  showTagline = false
}) => {
  const { dark } = useTheme();
  const isDark = dark === true || dark === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.wordmarkRow}>
        <Text style={[styles.voiceText, { fontSize: fontSizeMap[size], color: isDark ? '#F0EDE6' : '#121210' }]}>
          Voice
        </Text>
        <Text style={[styles.draftText, { fontSize: fontSizeMap[size], color: '#7F77DD' }]}>
          Draft
        </Text>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: taglineSizeMap[size], color: isDark ? '#73726c' : '#666666' }]}>
          Voice to blog, powered by AI
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceText: {
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  draftText: {
    fontWeight: '600',
    letterSpacing: -0.5,
    marginLeft: 4,
  },
  tagline: {
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
```

**Step 2: Update index file**

```typescript
// mobile-app/components/logo/index.ts
export { LogoIcon } from './LogoIcon';
export { LogoWordmark } from './LogoWordmark';
```

**Step 3: Commit**

```bash
git add mobile-app/components/logo/LogoWordmark.tsx mobile-app/components/logo/index.ts
git commit -m "feat: add LogoWordmark component for mobile app"
```

---

## Task 10: Create Animated Mobile Logo Icon Component

**Files:**
- Create: `mobile-app/components/logo/AnimatedLogoIcon.tsx`

**Step 1: Create the animated version**

```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LogoIcon as StaticLogoIcon } from './LogoIcon';

interface AnimatedLogoIconProps {
  size?: number;
}

export const AnimatedLogoIcon: React.FC<AnimatedLogoIconProps> = ({
  size = 128
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    const entranceAnim = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    entranceAnim.start();

    // Pulse animation (idle)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start pulse after entrance
    setTimeout(() => {
      pulseLoop.start();
    }, 800);

    return () => {
      entranceAnim.stop();
      pulseLoop.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ],
        },
      ]}
    >
      <StaticLogoIcon size={size} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Step 2: Update index file**

```typescript
// mobile-app/components/logo/index.ts
export { LogoIcon } from './LogoIcon';
export { LogoWordmark } from './LogoWordmark';
export { AnimatedLogoIcon } from './AnimatedLogoIcon';
```

**Step 3: Commit**

```bash
git add mobile-app/components/logo/AnimatedLogoIcon.tsx mobile-app/components/logo/index.ts
git commit -m "feat: add animated logo icon with entrance and pulse effects"
```

---

## Task 11: Update Mobile Index Splash Screen

**Files:**
- Modify: `mobile-app/app/index.tsx`

**Step 1: Replace loading state with splash screen**

Replace the return statement with:

```typescript
import { View, StyleSheet } from 'react-native';
import { LogoWordmark } from '@/components/logo/LogoWordmark';
import { AnimatedLogoIcon } from '@/components/logo/AnimatedLogoIcon';
import { ThemedText } from '@/components/themed-text';

// ... (existing imports and logic)

  // Show splash screen while redirecting
  return (
    <View style={styles.container}>
      <AnimatedLogoIcon size={128} />
      <View style={styles.wordmarkContainer}>
        <LogoWordmark size="lg" showTagline={true} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121210',
  },
  wordmarkContainer: {
    marginTop: 24,
  },
});
```

**Step 2: Commit**

```bash
git add mobile-app/app/index.tsx
git commit -m "feat: replace loading text with animated splash screen"
```

---

## Task 12: Test Web Logo Integration

**Files:**
- No files created/modified - testing only

**Step 1: Start web dev server**

```bash
cd /home/matrix/VoiceScribe/web
npm run dev
```

**Step 2: Open browser and verify**

Navigate to `http://localhost:3000` and verify:
- [ ] Logo appears in navigation bar
- [ ] Logo icon has hover scale effect
- [ ] Logo wordmark displays "Voice" in neutral, "Draft" in purple
- [ ] Home page shows large animated logo
- [ ] Hero logo has floating animation
- [ ] Colors match SVG (purple #AFA9EC → #7F77DD, teal #9FE1CB → #5DCAA5)

**Step 3: Test dark mode**

Toggle dark mode and verify:
- [ ] Logo colors adapt correctly
- [ ] Animations work in both themes

**Step 4: Check mobile responsive**

Resize browser to mobile width (< 640px):
- [ ] Navigation logo scales appropriately
- [ ] Hero section remains centered
- [ ] No horizontal overflow

**Step 5: Check console for errors**

Open browser DevTools Console:
- [ ] No errors related to logo components
- [ ] No missing SVG resources

---

## Task 13: Test Mobile Logo Integration

**Files:**
- No files created/modified - testing only

**Step 1: Start mobile app**

```bash
cd /home/matrix/VoiceScribe/mobile-app
npx expo start
```

**Step 2: Run on iOS simulator or Android emulator**

Press `i` for iOS or `a` for Android

**Step 3: Verify splash screen**

On app launch, verify:
- [ ] Splash screen appears with animated logo
- [ ] Fade in + scale up entrance animation plays
- [ ] Pulse animation continues while loading
- [ ] Logo wordmark displays below icon
- [ ] Tagline appears below wordmark
- [ ] Background is midnight color (#121210)

**Step 4: Check redirect behavior**

Verify:
- [ ] Splash screen shows during auth check
- [ ] Redirects to correct screen after loading
- [ ] No jarring transitions

**Step 5: Check for errors**

Look at terminal/console:
- [ ] No errors related to logo components
- [ ] No missing asset warnings

---

## Task 14: Create Logo Component Documentation

**Files:**
- Create: `docs/logo-components.md`

**Step 1: Create documentation file**

```markdown
# Logo Components Documentation

## Overview

VoiceScribe logo components for web and mobile apps.

## Components

### Web (`web/src/components/logo/`)

#### LogoIcon
Animated SVG logo icon with gradient colors.

```tsx
import { LogoIcon } from '@/components/logo';

<LogoIcon size={128} className="custom-class" animate={true} />
```

**Props:**
- `size?: number` - Width/height in pixels (default: 128)
- `className?: string` - Additional CSS classes
- `animate?: boolean` - Enable pulse glow animation (default: false)

#### LogoWordmark
Text component showing "Voice" + "Draft" with optional tagline.

```tsx
import { LogoWordmark } from '@/components/logo';

<LogoWordmark size="lg" showTagline={true} />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Text size (default: 'md')
- `showTagline?: boolean` - Show tagline below (default: false)

### Mobile (`mobile-app/components/logo/`)

#### LogoIcon
Static SVG logo icon using react-native-svg.

```tsx
import { LogoIcon } from '@/components/logo';

<LogoIcon size={128} />
```

**Props:**
- `size?: number` - Width/height in points (default: 128)

#### LogoWordmark
Text component using React Native Text.

```tsx
import { LogoWordmark } from '@/components/logo';

<LogoWordmark size="lg" showTagline={true} />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Font size (default: 'md')
- `showTagline?: boolean` - Show tagline below (default: false)

#### AnimatedLogoIcon
Animated version with entrance and pulse effects.

```tsx
import { AnimatedLogoIcon } from '@/components/logo';

<AnimatedLogoIcon size={128} />
```

**Props:**
- `size?: number` - Width/height in points (default: 128)

## Animation Classes (Web)

Add these classes for additional effects:

- `animate-pulse-glow` - Pulse with glow effect
- `animate-float` - Gentle floating motion
- `animate-fade-in-up` - Fade in with upward movement
- `animate-delay-{100|200|300|400}` - Staggered delays

## Color Palette

- Purple accent: `#AFA9EC` → `#7F77DD`
- Teal accent: `#9FE1CB` → `#5DCAA5`
- Background (midnight): `#121210`
- Text light: `#F0EDE6`
- Text dark: `#121210`
```

**Step 2: Commit**

```bash
git add docs/logo-components.md
git commit -m "docs: add logo component usage documentation"
```

---

## Summary

This implementation plan:
1. Copies SVG assets to web public and mobile assets directories
2. Creates reusable LogoIcon and LogoWordmark components for both platforms
3. Adds delightful animations (pulse, float, fade-in) using platform-appropriate APIs
4. Integrates logo into web navigation and home page
5. Replaces mobile splash screen with animated logo
6. Includes testing steps for both platforms
7. Documents component usage

Total estimated time: 2-3 hours
Total commits: 14
