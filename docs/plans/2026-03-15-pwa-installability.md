# PWA Installability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make VoiceScribe PWA installable on mobile and desktop by generating PNG icons from existing SVG assets.

**Architecture:** Use Node.js with sharp library to convert SVG icons to PNG format in multiple sizes required for PWA installability. Update manifest.json to reference the new PNG icons.

**Tech Stack:** Node.js, sharp (image processing), next-pwa, Next.js

---

## Task 1: Create scripts directory and icon generator script

**Files:**
- Create: `scripts/generate-icons.js`

**Step 1: Create the scripts directory**

```bash
mkdir -p scripts
```

**Step 2: Create the icon generator script**

Create `scripts/generate-icons.js`:

```javascript
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const ICON_SIZES = [72, 96, 128, 144, 192, 384, 512];
const SOURCE_DIR = path.join(__dirname, '../web/public');
const OUTPUT_DIR = path.join(__dirname, '../web/public/icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

// Source SVG files
const sourceFiles = [
  { name: 'icon-192.svg', baseSize: 192 },
  { name: 'icon-512.svg', baseSize: 512 }
];

async function generateIcons() {
  console.log('Starting icon generation...\n');

  for (const source of sourceFiles) {
    const sourcePath = path.join(SOURCE_DIR, source.name);

    if (!fs.existsSync(sourcePath)) {
      console.error(`Source file not found: ${sourcePath}`);
      continue;
    }

    console.log(`Processing ${source.name}...`);

    // Read SVG content
    const svgBuffer = fs.readFileSync(sourcePath);

    // Generate each size
    for (const size of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      try {
        await sharp(svgBuffer)
          .resize(size, size, {
            fit: 'inside',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath);

        console.log(`  ✓ Generated icon-${size}x${size}.png`);
      } catch (error) {
        console.error(`  ✗ Failed to generate ${size}x${size}:`, error.message);
      }
    }
  }

  // Also generate maskable icons (with padding for adaptive icons)
  console.log('\nGenerating maskable icons...');
  for (const size of [192, 512]) {
    const sourcePath = path.join(SOURCE_DIR, `icon-${size}.svg`);
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.png`);

    if (fs.existsSync(sourcePath)) {
      const svgBuffer = fs.readFileSync(sourcePath);

      try {
        // Add 40% padding for maskable/safe zone
        const paddedSize = Math.floor(size * 1.4);

        await sharp(svgBuffer)
          .resize(paddedSize, paddedSize, {
            fit: 'inside',
            background: { r: 139, g: 92, b: 246, alpha: 1 } // Match SVG gradient start
          })
          .extract({ left: 0, top: 0, width: size, height: size })
          .png()
          .toFile(outputPath);

        console.log(`  ✓ Generated icon-${size}x${size}-maskable.png`);
      } catch (error) {
        console.error(`  ✗ Failed to generate maskable ${size}x${size}:`, error.message);
      }
    }
  }

  console.log('\nIcon generation complete!');
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

generateIcons().catch(console.error);
```

**Step 3: Commit**

```bash
git add scripts/generate-icons.js
git commit -m "feat: add icon generation script for PWA installability

Add Node.js script to convert SVG icons to PNG format in multiple sizes required for PWA installability across mobile and desktop platforms.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add sharp dependency

**Files:**
- Modify: `web/package.json`

**Step 1: Install sharp as dev dependency**

```bash
cd web && npm install --save-dev sharp && cd ..
```

Expected output:
```
+ sharp@0.x.x
added X packages in Xs
```

**Step 2: Verify installation**

```bash
grep -A2 '"devDependencies"' web/package.json | grep sharp
```

Expected: `"sharp": "^0.x.x"` appears in devDependencies

**Step 3: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "deps: add sharp for icon generation

Add sharp library for high-performance image processing to convert SVG icons to PNG format for PWA installability.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add npm script for icon generation

**Files:**
- Modify: `web/package.json`

**Step 1: Add generate-icons script to package.json**

Add the script to the scripts section in `web/package.json`. The scripts section should now include:

```json
"scripts": {
  "dev": "HOST=0.0.0.0 next dev",
  "build": "next build",
  "start": "HOST=0.0.0.0 next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:ui": "playwright test --ui",
  "test:debug": "playwright test --debug",
  "test:report": "playwright show-report",
  "test:install": "playwright install",
  "generate-icons": "node scripts/generate-icons.js"
}
```

**Step 2: Verify script is added**

```bash
cd web && npm run generate-icons
```

Expected: Icons are generated successfully

**Step 3: Verify output files**

```bash
ls -la web/public/icons/
```

Expected: List of PNG files (icon-72x72.png, icon-96x96.png, etc.)

**Step 4: Commit**

```bash
git add web/package.json
git commit -m "feat: add npm script for icon generation

Add 'generate-icons' npm script to easily regenerate PNG icons from SVG source files.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update manifest.json with PNG icon references

**Files:**
- Modify: `web/public/manifest.json`

**Step 1: Update manifest.json**

Replace the contents of `web/public/manifest.json` with:

```json
{
  "name": "VoiceScribe",
  "short_name": "VoiceScribe",
  "description": "Transform your voice into organized drafts instantly",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0891b2",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [],
  "shortcuts": [
    {
      "name": "New Recording",
      "short_name": "Record",
      "description": "Start a new voice recording",
      "url": "/record",
      "icons": [
        {
          "src": "/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "My Drafts",
      "short_name": "Drafts",
      "description": "View your saved drafts",
      "url": "/drafts",
      "icons": [
        {
          "src": "/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

**Step 2: Verify JSON is valid**

```bash
cd web && node -e "JSON.parse(require('fs').readFileSync('public/manifest.json', 'utf8')); console.log('Valid JSON')"
```

Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add web/public/manifest.json
git commit -m "feat: update manifest with PNG icon references

Update web app manifest to reference PNG icons instead of SVG for proper PWA installability across all platforms. Add maskable icons for adaptive icon support.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add apple-touch-icon link tags to root layout

**Files:**
- Modify: `web/src/app/layout.tsx`

**Step 1: Add apple-touch-icon metadata**

Update the `metadata` export in `web/src/app/layout.tsx` to include apple-touch-icon:

```typescript
export const metadata: Metadata = {
  title: 'VoiceScribe - Voice & Text Collaboration',
  description: 'Transform voice into polished blog posts. A modern platform for creators who speak their mind.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VoiceScribe',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};
```

**Step 2: Verify no TypeScript errors**

```bash
cd web && npm run typecheck
```

Expected: No errors (ignore existing build warnings)

**Step 3: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "feat: add apple-touch-icon support for iOS PWA

Add iOS-specific metadata to enable proper 'Add to Home Screen' behavior on Apple devices.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Generate the icons

**Step 1: Run the icon generation script**

```bash
cd web && npm run generate-icons
```

Expected: All icons generated successfully

**Step 2: Verify all files exist**

```bash
ls -1 web/public/icons/
```

Expected output should include:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-192x192.png
- icon-192x192-maskable.png
- icon-384x384.png
- icon-512x512.png
- icon-512x512-maskable.png

**Step 3: Commit the generated icons**

```bash
git add web/public/icons/
git commit -m "feat: add PNG icons for PWA installability

Generate PNG icons in multiple sizes from SVG source for PWA installability on mobile and desktop platforms.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Verify PWA installability

**Step 1: Build the application**

```bash
cd web && npm run build
```

Expected: Build succeeds

**Step 2: Check service worker in build output**

```bash
ls -la web/.next/server/app/
```

Expected: Service worker files are present

**Step 3: Test manifest is accessible**

Start the dev server in a separate terminal:
```bash
cd web && npm run start
```

Then in another terminal:
```bash
curl -s http://localhost:3000/manifest.json | head -5
```

Expected: Returns JSON manifest

**Step 4: Run Lighthouse PWA audit (optional)**

Use Chrome DevTools:
1. Open chrome://inspect
2. Navigate to http://localhost:3000
3. Open DevTools → Lighthouse
4. Select "Progressive Web App" category
5. Run audit

Expected: PWA installability check passes

---

## Testing Checklist

After completing all tasks, verify:

- [ ] All PNG icons exist in `web/public/icons/`
- [ ] `manifest.json` references PNG files
- [ ] Service worker is registered (check Application tab in DevTools)
- [ ] Lighthouse PWA audit passes
- [ ] "Install" button appears in Chrome address bar
- [ ] App can be installed and launches correctly
- [ ] Icons display on home screen/app drawer

---

## References

- [Web App Manifest - icons](https://developer.mozilla.org/en-US/docs/Web/Manifest/icons)
- [PWA Installability Criteria](https://web.dev/installable-manifest/)
- [sharp documentation](https://sharp.pixelplumbing.com/)
- Design document: [docs/plans/2026-03-15-pwa-installability-design.md](docs/plans/2026-03-15-pwa-installability-design.md)
