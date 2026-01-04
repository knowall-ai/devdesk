import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

// Favicon SVG content
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="32" rx="6" fill="url(#greenGradient)"/>
  <text x="16" y="23" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>`;

// Apple touch icon SVG content (180x180)
const appleTouchSvg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="180" height="180" rx="36" fill="url(#greenGradient)"/>
  <text x="90" y="120" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>`;

// Icon 192x192 for PWA
const icon192Svg = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="192" height="192" rx="38" fill="url(#greenGradient)"/>
  <text x="96" y="128" font-family="Arial, sans-serif" font-size="110" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>`;

// Icon 512x512 for PWA
const icon512Svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="102" fill="url(#greenGradient)"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="290" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>`;

async function generateIcon(svg, outputPath, width, height) {
  try {
    await sharp(Buffer.from(svg)).resize(width, height).png().toFile(outputPath);
    console.log(`Created ${path.basename(outputPath)}`);
  } catch (err) {
    throw new Error(`Failed to generate ${path.basename(outputPath)}: ${err.message}`);
  }
}

async function generateIcons() {
  console.log('Generating icons...');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log(`Created public directory: ${publicDir}`);
  }

  // Generate favicon PNGs
  await generateIcon(faviconSvg, path.join(publicDir, 'favicon-32x32.png'), 32, 32);
  await generateIcon(faviconSvg, path.join(publicDir, 'favicon-16x16.png'), 16, 16);

  // Generate apple-touch-icon.png (180x180)
  await generateIcon(appleTouchSvg, path.join(publicDir, 'apple-touch-icon.png'), 180, 180);

  // Generate PWA icons
  await generateIcon(icon192Svg, path.join(publicDir, 'icon-192x192.png'), 192, 192);
  await generateIcon(icon512Svg, path.join(publicDir, 'icon-512x512.png'), 512, 512);

  // Generate OG image PNG from SVG
  const ogSvgPath = path.join(publicDir, 'og-image.svg');
  if (fs.existsSync(ogSvgPath)) {
    try {
      const ogSvg = fs.readFileSync(ogSvgPath);
      await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'));
      console.log('Created og-image.png');
    } catch (err) {
      throw new Error(`Failed to generate og-image.png: ${err.message}`);
    }
  } else {
    console.warn(`Warning: ${ogSvgPath} not found, skipping OG image generation`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err.message);
  process.exit(1);
});
