# Logo Integration Design

**Date**: 2026-03-17
**Status**: Approved

## Overview

Add the VoiceScribe logo (from `assets/logo&icons/voicescribe-logo-midnight.svg`) to both mobile and web apps with split components (icon + text) and delightful animations/color effects.

## Component Structure

### Shared Components

```
/mobile-app/components/
  ├── LogoIcon.tsx        # Animated sound wave icon
  └── LogoWordmark.tsx    # "Voice" + "Draft" text with gradient

/web/src/components/
  ├── LogoIcon.tsx        # React version for web
  └── LogoWordmark.tsx    # React version for web
```

**Why split?** Flexible layouts allow:
- Icon-only usage (app headers, favicons)
- Full logo (landing pages, splash screens)
- Independent sizing and positioning

## 1. Mobile App Splash Screen

**Location**: `/mobile-app/app/index.tsx`

### Design
- Replace "Loading..." with centered splash screen
- Logo icon (128x128) with subtle pulse animation
- Logo wordmark below with gradient colors
- Tagline: "Voice to blog, powered by AI" (smaller, muted)

### Delight Effects
- **Entrance**: Fade in + scale up (0.8s ease-out)
- **Idle**: Gentle pulse on icon (2s cycle)
- **Colors**: Match SVG gradient (purple→teal) with subtle glow

### Color Palette (from SVG)
- Purple accent: `#AFA9EC` → `#7F77DD`
- Teal accent: `#9FE1CB` → `#5DCAA5`
- Background: `#121210` (midnight)

## 2. Web App Navigation

**Location**: `/web/src/components/layout/Navigation.tsx`

### Design
- Add to left side of navigation bar
- Logo icon (32x32) + "VoiceScribe" wordmark
- Current text navigation becomes secondary

### Delight Effects
- **Hover**: Subtle scale (1.05x) + color brightness boost
- **Colors**: Neutral for normal state, gradient on hover

## 3. Web App Home Page

**Location**: `/web/src/app/page.tsx` (Hero section)

### Design
- Large animated logo icon (192x192) as hero image
- "VoiceScribe" wordmark as main heading
- Tagline below

### Delight Effects
- **Entrance**: Staggered fade-in (icon first, then text)
- **Continuous**: Gentle floating animation on icon
- **Colors**: Full gradient with glow effect

## Animation Specifications

### Mobile Splash Screen
```typescript
// Entrance animation
fade: opacity 0 → 1, duration: 800ms, easing: ease-out
scale: 0.8 → 1, duration: 800ms, easing: ease-out

// Idle animation
pulse: scale 1 → 1.05 → 1, duration: 2000ms, repeat: infinite
```

### Web Home Page
```css
/* Staggered entrance */
.icon { animation: fadeInScale 0.6s ease-out 0s; }
.wordmark { animation: fadeInUp 0.6s ease-out 0.2s; }
.tagline { animation: fadeInUp 0.6s ease-out 0.4s; }

/* Continuous floating */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

## Implementation Notes

1. **SVG Asset**: Use the existing `/assets/logo&icons/voicescribe-logo-midnight.svg` as reference for colors and proportions

2. **Cross-platform compatibility**:
   - Mobile: React Native Animated API
   - Web: CSS animations + Tailwind utilities

3. **Performance**: Use `useNativeDriver` for React Native animations

4. **Accessibility**: Add appropriate ARIA labels and alt text

## Next Steps

Create detailed implementation plan with:
- File-by-file breakdown
- Code snippets for components
- Animation timing specifications
