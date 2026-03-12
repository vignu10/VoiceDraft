# VoiceDraft PWA - Icon Library & Design Tokens

**Date:** 2025-03-11
**Status:** Design Reference

This document contains all SVG icons and design tokens for implementing the VoiceDraft PWA.

---

## PWA App Icons

### Favicon / App Icon SVG

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.15)"/>

  <!-- Microphone body -->
  <rect x="42" y="25" width="16" height="28" rx="8" fill="white"/>

  <!-- Microphone stand -->
  <path d="M35 53 Q35 68 50 68 Q65 68 65 53" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
  <line x1="50" y1="68" x2="50" y2="80" stroke="white" stroke-width="4" stroke-linecap="round"/>
  <line x1="40" y1="80" x2="60" y2="80" stroke="white" stroke-width="4" stroke-linecap="round"/>

  <!-- Sound waves -->
  <path d="M72 45 Q78 50 72 55" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M78 40 Q86 50 78 60" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
</svg>
```

### Icon Sizes Required

| Size | Usage | File Name |
|------|-------|-----------|
| 48×48 | Favicon | `favicon.ico` |
| 192×192 | Android | `icon-192.png` |
| 512×512 | Android Adaptive | `icon-512.png` |
| 180×180 | Apple | `apple-touch-icon.png` |
| 512×512 | Maskable | `icon-maskable.png` |

---

## Core Icons (SVG)

### Navigation Icons

**Record / Mic**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="8" y="4" width="8" height="12" rx="4"/>
  <path d="M6 16a6 6 0 0 0 12 0" stroke-linecap="round"/>
  <line x1="12" y1="20" x2="12" y2="24" stroke-linecap="round"/>
</svg>
```

**Record Button (Circle)**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
</svg>
```

**Drafts / Library**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <path d="M9 3v18"/>
  <path d="M15 3v18"/>
</svg>
```

**Discover / Search**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/>
  <polygon points="10 8 16 12 10 16" fill="currentColor"/>
</svg>
```

**Profile / User**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>
```

**Settings**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>
```

---

### Action Icons

**Edit**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>
```

**Delete**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</svg>
```

**Close**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>
```

**Check**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="20 6 9 17 4 12"/>
</svg>
```

**Add / Plus**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M5 12h14"/>
  <path d="M12 5v14"/>
</svg>
```

**Publish**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
  <polyline points="16 6 12 2 8 6"/>
  <line x1="12" y1="2" x2="12" y2="15"/>
</svg>
```

**Share**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="18" cy="5" r="3"/>
  <circle cx="6" cy="12" r="3"/>
  <circle cx="18" cy="19" r="3"/>
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
</svg>
```

**Favorite / Bookmark**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
</svg>
```

**Copy**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>
```

**Download**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="7 10 12 15 17 10"/>
  <line x1="12" y1="15" x2="12" y2="3"/>
</svg>
```

**Preview / Eye**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
```

**More Options / Dots**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="1"/>
  <circle cx="19" cy="12" r="1"/>
  <circle cx="5" cy="12" r="1"/>
</svg>
```

---

### Status Icons

**Notifications Bell**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</svg>
```

**Search**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"/>
  <path d="M21 21l-4.35-4.35"/>
</svg>
```

**Filter**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
</svg>
```

**Sort**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M11 5h10"/>
  <path d="M11 9h7"/>
  <path d="M11 13h4"/>
  <path d="M3 17l3 3 3-3"/>
  <path d="M6 18V4"/>
</svg>
```

---

### Achievement Icons

**Trophy / Star**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>
```

**Medal / Award**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="8" r="6"/>
  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
</svg>
```

**First Draft**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="12" y1="18" x2="12" y2="12"/>
  <line x1="9" y1="15" x2="15" y2="15"/>
</svg>
```

**Word Count Milestone**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
</svg>
```

---

## Design Tokens

### Colors

```css
:root {
  /* Primary - Warm Orange */
  --primary-50: #fef3e2;
  --primary-100: #fde7c3;
  --primary-200: #fbd095;
  --primary-300: #f8b367;
  --primary-400: #f5983c;
  --primary-500: #f38328;  /* Main brand color */
  --primary-600: #e67a1b;
  --primary-700: #c96b13;
  --primary-800: #a75b1c;
  --primary-900: #8a4c26;

  /* Neutral */
  --neutral-50: #fafafa;
  --neutral-100: #f4f4f5;
  --neutral-200: #e4e4e7;
  --neutral-300: #d4d4d8;
  --neutral-400: #a1a1aa;
  --neutral-500: #71717a;
  --neutral-600: #52525b;
  --neutral-700: #3f3f46;
  --neutral-800: #27272a;
  --neutral-900: #18181b;

  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Dark Mode */
  --dark-bg: #0a0a0a;
  --dark-surface: #1a1a1a;
  --dark-border: #2a2a2a;
}
```

### Gradients

```css
--gradient-warm: linear-gradient(135deg, #f38328 0%, #f5983c 50%, #f8b367 100%);
--gradient-sunset: linear-gradient(135deg, #f38328 0%, #e67a1b 100%);
--gradient-night: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
```

### Spacing

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
--shadow-glow: 0 0 20px rgba(243, 131, 40, 0.3);
```

---

## Typography Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Component Patterns

### Button Styles

```css
.btn-primary {
  background: var(--gradient-warm);
  color: white;
  box-shadow: var(--shadow-glow);
}

.btn-secondary {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.btn-ghost {
  background: transparent;
  color: var(--primary-600);
}
```

### Badge Status Colors

```css
.badge-draft {
  background: var(--primary-50);
  color: var(--primary-700);
}

.badge-published {
  background: var(--success);
  color: white;
}

.badge-processing {
  background: var(--warning);
  color: white;
}

.badge-error {
  background: var(--error);
  color: white;
}
```

---

## Tailwind Config Integration

Add to `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde7c3',
          200: '#fbd095',
          300: '#f8b367',
          400: '#f5983c',
          500: '#f38328',
          600: '#e67a1b',
          700: '#c96b13',
          800: '#a75b1c',
          900: '#8a4c26',
        }
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #f38328 0%, #f5983c 50%, #f8b367 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f38328 0%, #e67a1b 100%)',
      }
    }
  }
}
```

---

## PWA Manifest Template

```json
{
  "name": "VoiceDraft",
  "short_name": "VoiceDraft",
  "description": "Turn your voice into blog posts with AI",
  "start_url": "/record",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#f38328",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

**Preview the full design system:** Open `/public/design-system.html` in your browser to see all components rendered.
