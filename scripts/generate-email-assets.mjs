// One-off generator for branded email logos.
// Run with: bun run scripts/generate-email-assets.mjs
import sharp from 'sharp';
import { existsSync, readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';

mkdirSync('public/email', { recursive: true });

const svg = readFileSync('public/assets/logo.svg');
await sharp(svg, { density: 300 })
  .resize({ width: 480, height: 120, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('public/email/zapdesk-logo.png');
console.log('wrote public/email/zapdesk-logo.png (480x120, transparent)');

// The KnowAll AI logo is committed as a real asset, not generated from SVG.
// Only write a transparent placeholder if the file is missing, so re-running
// this script never silently clobbers the real logo.
const knowallPath = 'public/email/knowall-logo.png';
if (existsSync(knowallPath)) {
  console.log(`skipped ${knowallPath} (already exists — leaving in place)`);
} else {
  await sharp({
    create: {
      width: 480,
      height: 120,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toFile(knowallPath);
  console.log(`wrote ${knowallPath} (480x120 transparent placeholder — replace with real logo)`);
}
