# VoiceScribe Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand VoiceScribe application to VoiceScribe across web, mobile, and all documentation.

**Architecture:** Global find-and-replace strategy across configuration files, source code, and documentation. Maintains existing visual theme—only updates app name, bundle identifiers, and regenerates logos.

**Tech Stack:** Next.js (web), Expo/React Native (mobile), Node.js config files

---

## Task 1: Update Root Package Configuration

**Files:**
- Modify: `/home/matrix/VoiceScribe/package.json`
- Modify: `/home/matrix/VoiceScribe/app.json`

**Step 1: Update root package.json name**

```bash
# Edit package.json, replace:
# "name": "voicescribe-monorepo"
# with:
# "name": "voicescribe-monorepo"
```

**Step 2: Update app.json**

```bash
# Edit app.json, replace all references:
# "name": "voicescribe" → "name": "voicescribe"
# "slug": "voicescribe" → "slug": "voicescribe"
# "bundleIdentifier": "com.anonymous.voicescribe" → "bundleIdentifier": "com.voicescribe.app"
# "package": "com.anonymous.voicescribe" → "package": "com.voicescribe.app"
# "scheme": "voicescribe" → "scheme": "voicescribe"
```

**Step 3: Verify changes**

```bash
cat package.json | grep voicescribe
cat app.json | grep voicescribe
```

Expected: Output shows `voicescribe` and `com.voicescribe.app`

**Step 4: Commit**

```bash
git add package.json app.json
git commit -m "feat(rebrand): update root package config to VoiceScribe"
```

---

## Task 2: Update Web Package Configuration

**Files:**
- Modify: `/home/matrix/VoiceScribe/web/package.json`
- Modify: `/home/matrix/VoiceScribe/web/public/manifest.json`

**Step 1: Update web package.json**

```bash
# Edit web/package.json, replace:
# "name": "voicescribe-web"
# with:
# "name": "voicescribe-web"
```

**Step 2: Update web PWA manifest**

```bash
# Edit web/public/manifest.json, replace:
# "name": "VoiceScribe" → "name": "VoiceScribe"
# "short_name": "VoiceScribe" → "short_name": "VoiceScribe"
```

**Step 3: Verify changes**

```bash
cat web/package.json | grep voicescribe
cat web/public/manifest.json | grep VoiceScribe
```

Expected: Output shows updated names

**Step 4: Commit**

```bash
git add web/package.json web/public/manifest.json
git commit -m "feat(rebrand): update web package config to VoiceScribe"
```

---

## Task 3: Update Mobile Package Configuration

**Files:**
- Modify: `/home/matrix/VoiceScribe/mobile-app/package.json`
- Modify: `/home/matrix/VoiceScribe/mobile-app/app.config.js`

**Step 1: Update mobile package.json**

```bash
# Edit mobile-app/package.json, replace:
# "name": "voicescribe"
# with:
# "name": "voicescribe"
```

**Step 2: Update mobile app.config.js**

```javascript
// Edit mobile-app/app.config.js, update:
// name: 'VoiceScribe' → name: 'VoiceScribe'
// slug: 'voicescribe' → slug: 'voicescribe'
// bundleIdentifier: 'com.anonymous.voicescribe' → bundleIdentifier: 'com.voicescribe.app'
// package: 'com.anonymous.voicescribe' → package: 'com.voicescribe.app'
// scheme: 'voicescribe' → scheme: 'voicescribe'
```

**Step 3: Verify changes**

```bash
cat mobile-app/package.json | grep voicescribe
cat mobile-app/app.config.js | grep -i voicescribe
```

Expected: Output shows updated configuration

**Step 4: Commit**

```bash
git add mobile-app/package.json mobile-app/app.config.js
git commit -m "feat(rebrand): update mobile package config to VoiceScribe"
```

---

## Task 4: Global Replace in Web Source Code

**Files:**
- Modify: All files in `/home/matrix/VoiceScribe/web/src/`

**Step 1: Find all web source files containing references**

```bash
cd /home/matrix/VoiceScribe/web/src
grep -r -l -i "voicescribe" . --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
```

Expected: List of ~20-30 files

**Step 2: Replace VoiceScribe with VoiceScribe (case-sensitive)**

```bash
cd /home/matrix/VoiceScribe/web/src
find . \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -type f -exec sed -i 's/VoiceScribe/VoiceScribe/g' {} +
```

**Step 3: Replace voicescribe with voicescribe (case-insensitive)**

```bash
cd /home/matrix/VoiceScribe/web/src
find . \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -type f -exec sed -i 's/voicescribe/voicescribe/gI' {} +
```

**Step 4: Verify no remaining references**

```bash
cd /home/matrix/VoiceScribe/web/src
grep -r -i "voicescribe" . --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
```

Expected: No output (or only matches in comments/explanations that should stay)

**Step 5: Commit**

```bash
git add web/src/
git commit -m "feat(rebrand): update web source code references to VoiceScribe"
```

---

## Task 5: Global Replace in Mobile Source Code

**Files:**
- Modify: All files in `/home/matrix/VoiceScribe/mobile-app/`

**Step 1: Find all mobile source files containing references**

```bash
cd /home/matrix/VoiceScribe/mobile-app
grep -r -l -i "voicescribe" . --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --exclude-dir=node_modules
```

Expected: List of ~10-15 files

**Step 2: Replace VoiceScribe with VoiceScribe**

```bash
cd /home/matrix/VoiceScribe/mobile-app
find . \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -type f -not -path "*/node_modules/*" -exec sed -i 's/VoiceScribe/VoiceScribe/g' {} +
```

**Step 3: Replace voicescribe with voicescribe (case-insensitive)**

```bash
cd /home/matrix/VoiceScribe/mobile-app
find . \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -type f -not -path "*/node_modules/*" -exec sed -i 's/voicescribe/voicescribe/gI' {} +
```

**Step 4: Verify no remaining references**

```bash
cd /home/matrix/VoiceScribe/mobile-app
grep -r -i "voicescribe" . --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --exclude-dir=node_modules
```

Expected: No output (no remaining references)

**Step 5: Commit**

```bash
git add mobile-app/
git commit -m "feat(rebrand): update mobile source code references to VoiceScribe"
```

---

## Task 6: Update Documentation Files

**Files:**
- Modify: `/home/matrix/VoiceScribe/README.md`
- Modify: `/home/matrix/VoiceScribe/PRD.md`
- Modify: All files in `/home/matrix/VoiceScribe/docs/`

**Step 1: Find all documentation files**

```bash
cd /home/matrix/VoiceScribe
find . \( -name "*.md" -o -name "*.MD" \) -type f -not -path "*/node_modules/*" -not -path "*/.git/*"
```

Expected: List of 15-20 markdown files

**Step 2: Replace in documentation files**

```bash
cd /home/matrix/VoiceScribe
find . \( -name "*.md" -o -name "*.MD" \) -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec sed -i 's/VoiceScribe/VoiceScribe/g' {} +
find . \( -name "*.md" -o -name "*.MD" \) -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec sed -i 's/voicescribe/voicescribe/gI' {} +
```

**Step 3: Verify documentation updates**

```bash
cd /home/matrix/VoiceScribe
grep -r -i "voicescribe" . --include="*.md" --exclude-dir=node_modules --exclude-dir=.git
```

Expected: No remaining references (except in historical commit messages)

**Step 4: Commit**

```bash
git add README.md PRD.md docs/
git commit -m "docs(rebrand): update documentation references to VoiceScribe"
```

---

## Task 7: Generate New VoiceScribe Logos

**Files:**
- Create: Various logo files in `/home/matrix/VoiceScribe/mobile-app/assets/images/`
- Create: Various logo files in `/home/matrix/VoiceScribe/web/public/`

**Step 1: Review existing logo locations**

```bash
ls -la /home/matrix/VoiceScribe/mobile-app/assets/images/
ls -la /home/matrix/VoiceScribe/web/public/ | grep -i icon
```

Expected: List shows current icon.png, favicon.png, etc.

**Step 2: Design VoiceScribe logo**

- Use existing logo style from current VoiceScribe logos
- Only change text from "VoiceScribe" to "VoiceScribe"
- Maintain same colors, font, and layout
- Create variants for different sizes/use cases

**Step 3: Generate mobile app icons**

Required sizes for Expo:
- `icon.png` - 1024x1024 (main iOS/Android icon)
- `adaptive-icon.png` - 1024x1024 (Android adaptive)
- `foreground.png` - 1024x1024 (Android adaptive foreground)
- `background.png` - 1024x1024 (Android adaptive background)
- `monochrome.png` - 1024x1024 (Android monochrome)
- `splash-icon.png` - 200x200 (splash screen)

**Step 4: Generate web/PWA icons**

Required sizes:
- `favicon.png` - 16x16, 32x32
- `apple-touch-icon.png` - 180x180
- `icon-192.png` - 192x192
- `icon-512.png` - 512x512

**Step 5: Replace asset files**

```bash
# Backup old assets (optional)
mv mobile-app/assets/images/icon.png mobile-app/assets/images/icon.png.backup
mv web/public/favicon.png web/public/favicon.png.backup

# Place new VoiceScribe assets in respective directories
```

**Step 6: Update manifest.json icon references**

```bash
# Ensure web/public/manifest.json references the correct icon files
```

**Step 7: Commit**

```bash
git add mobile-app/assets/images/ web/public/
git commit -m "feat(rebrand): replace logos with VoiceScribe branding"
```

---

## Task 8: Verify Web App Build

**Files:**
- Test: `/home/matrix/VoiceScribe/web/`

**Step 1: Install dependencies (if needed)**

```bash
cd /home/matrix/VoiceScribe/web
npm install
```

Expected: No errors, packages installed successfully

**Step 2: Start development server**

```bash
cd /home/matrix/VoiceScribe/web
npm run dev
```

Expected: Server starts on localhost:3000 (or similar)

**Step 3: Check browser for branding**

Open browser to localhost:3000 and verify:
- Page title shows "VoiceScribe"
- Navigation shows "VoiceScribe"
- No "VoiceScribe" visible in UI
- Favicon loads correctly

**Step 4: Check browser console**

```bash
# Open browser DevTools console
# Verify no errors related to missing assets or config
```

Expected: No asset 404s, no config errors

**Step 5: Stop dev server**

```bash
# Ctrl+C in terminal
```

---

## Task 9: Verify Mobile App Build

**Files:**
- Test: `/home/matrix/VoiceScribe/mobile-app/`

**Step 1: Install dependencies (if needed)**

```bash
cd /home/matrix/VoiceScribe/mobile-app
npm install
```

Expected: No errors, packages installed successfully

**Step 2: Start development server**

```bash
cd /home/matrix/VoiceScribe/mobile-app
npx expo start
```

Expected: Expo dev tools start, QR code displayed

**Step 3: Scan QR code with Expo Go (mobile device)**

Or press `w` to open in web simulator

**Step 4: Verify mobile app branding**

- App title bar shows "VoiceScribe"
- No "VoiceScribe" visible in UI
- App icon displays correctly
- Splash screen shows VoiceScribe

**Step 5: Stop dev server**

```bash
# Ctrl+C in terminal
```

---

## Task 10: Final Verification and Clean Commit

**Files:**
- All modified files

**Step 1: Check git status**

```bash
cd /home/matrix/VoiceScribe
git status
```

Expected: No uncommitted changes (or only expected changes)

**Step 2: Final search for any missed references**

```bash
cd /home/matrix/VoiceScribe
grep -r -i "voicescribe" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.claude --exclude="*.lock"
```

Expected: No results (or only in lock files which can be ignored)

**Step 3: Run web build (production test)**

```bash
cd /home/matrix/VoiceScribe/web
npm run build
```

Expected: Build completes successfully with no errors

**Step 4: Create summary commit if any loose files**

```bash
# Only if there are remaining uncommitted files
git add .
git commit -m "feat(rebrand): final VoiceScribe rebrand cleanup"
```

**Step 5: Tag the rebrand**

```bash
git tag -a v0.2.0-voicescribe -m "VoiceScribe rebrand release"
```

---

## Testing Checklist

After completing all tasks:

- [ ] Root package.json shows voicescribe-monorepo
- [ ] app.json has com.voicescribe.app bundle identifier
- [ ] Web package.json shows voicescribe-web
- [ ] Mobile package.json shows voicescribe
- [ ] web/public/manifest.json shows VoiceScribe
- [ ] mobile-app/app.config.js has all VoiceScribe config
- [ ] No "VoiceScribe" or "voicescribe" in web/src (except comments)
- [ ] No "VoiceScribe" or "voicescribe" in mobile-app (except comments)
- [ ] Documentation updated (README.md, docs/)
- [ ] New VoiceScribe logos in place
- [ ] Web dev server runs without errors
- [ ] Mobile Expo server runs without errors
- [ ] Web browser shows correct branding
- [ ] Mobile app shows correct branding
- [ ] Web production build succeeds

---

## Notes

- Colors and visual theme remain unchanged
- No layout or UX modifications
- Logo style maintained, only text changed
- App store submissions will be needed for bundle ID changes
- Existing users will need to update to new app version

---

## References

- Design document: `docs/plans/2026-03-19-voicescribe-rebrand-design.md`
- Current branding files: `docs/logo-components.md`
