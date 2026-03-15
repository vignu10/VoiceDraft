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
