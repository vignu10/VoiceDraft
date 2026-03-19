# VoiceScribe Rebrand Design Document

**Date:** 2026-03-19
**Project:** VoiceScribe → VoiceScribe Rebrand

---

## Overview

Complete rebrand of the VoiceScribe application to **VoiceScribe**. The rebrand maintains the existing visual theme, color scheme, and page layouts — only updating the app name and associated assets.

## Changes Summary

| Element | From | To |
|---------|------|-----|
| App name | VoiceScribe | VoiceScribe |
| Package name | voicescribe-* | voicescribe-* |
| Bundle ID | com.anonymous.voicescribe | com.voicescribe.app |
| Logos | VoiceScribe logos | VoiceScribe logos (same style) |
| Colors/Theme | No change | Same |

## Scope

**Platforms Affected:**
- Web (Next.js)
- Mobile (Expo/React Native)

**Files Affected:** ~73 files across:
- Configuration files (package.json, app.json, manifest.json)
- UI components and pages
- Documentation
- Asset files (icons, splash screens)

---

## Implementation Strategy

**Approach:** Global Find & Replace

A coordinated, single-pass replacement across all files to ensure consistency and minimize transition complexity.

---

## Implementation Steps

### Step 1: Global Text Replacement

Replace all occurrences of:
- `voicescribe` → `voicescribe` (case-insensitive)
- `VoiceScribe` → `VoiceScribe`
- `com.anonymous.voicescribe` → `com.voicescribe.app`

### Step 2: Update Package Names

**Files:** Root, web, and mobile-app `package.json`

```json
{
  "name": "voicescribe-monorepo"  // or "voicescribe-web", etc.
}
```

### Step 3: Update App Configs

**Files:** `app.json`, `mobile-app/app.config.js`, `web/public/manifest.json`

```json
{
  "name": "voicescribe",
  "slug": "voicescribe",
  "bundleIdentifier": "com.voicescribe.app",
  "package": "com.voicescribe.app",
  "scheme": "voicescribe"
}
```

### Step 4: Regenerate Logos & Assets

**Assets to regenerate:**

| Platform | Files | Size(s) |
|----------|-------|---------|
| **Mobile iOS** | `icon.png` | 1024x1024 |
| **Mobile Android** | `adaptive-icon.png`, `foreground.png`, `background.png`, `monochrome.png` | Various |
| **Mobile Splash** | `splash-icon.png` | 200x200 |
| **Web** | `favicon.png`, PWA icons | 16x16 to 512x512 |

**Design:** Maintain current logo style, only update text to "VoiceScribe"

### Step 5: Verify & Test

Run both web and mobile locally to verify:
- App names display correctly
- All branding references updated
- No broken assets or links

---

## File Categories

### A. Configuration Files (8 files)
```
/package.json
/web/package.json
/mobile-app/package.json
/app.json
/mobile-app/app.json
/web/public/manifest.json
/mobile-app/app.config.js
```

### B. UI/Text References (~40 files)
```
/web/src/app/layout.tsx
/web/src/app/record/page.tsx
/web/src/components/layout/Navigation.tsx
/mobile-app/app/(tabs)/index.tsx
/mobile-app/app/(tabs)/settings.tsx
...and more
```

### C. Documentation (10+ files)
```
/README.md
/docs/logo-components.md
/FRONTEND-AUDIT-REPORT.md
...design docs
```

### D. Asset Files
```
/mobile-app/assets/images/
/web/public/
```

---

## Testing Checklist

### Pre-Deployment
- [ ] Web app starts correctly with new name
- [ ] Mobile app builds with new bundle ID
- [ ] All pages display "VoiceScribe" correctly
- [ ] No remaining "VoiceScribe" references in UI
- [ ] PWA manifest shows correct app name
- [ ] Mobile app title bar shows "VoiceScribe"
- [ ] Favicon/PWA icons load correctly
- [ ] Package.json names updated

### Post-Deployment (App Stores)
- [ ] Update iOS app store listing with new name
- [ ] Update Play Store listing with new name
- [ ] Update privacy policy references if needed
- [ ] Update any marketing/social media links

---

## Rollback Plan

- Git commit before changes enables quick revert
- Note: App store bundle ID changes cannot be rolled back; new submissions required

---

## Notes

- Existing color scheme and theme remain unchanged
- No layout or UX modifications
- Logo design maintains current style, only text changes
- This rebrand requires new app store submissions due to bundle ID change
