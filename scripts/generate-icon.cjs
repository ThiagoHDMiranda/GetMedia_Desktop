/**
 * Generates a high-quality, multi-resolution .ico file from the source 512x512 PNG.
 *
 * Embeds PNG frames at 16, 32, 48, 64, 128, and 256 pixels so that Windows
 * has a crisp icon for every display context (taskbar, title bar, Alt-Tab,
 * file explorer, desktop shortcut).
 *
 * Run: node scripts/generate-icon.cjs
 */
const fs = require("fs");
const path = require("path");
const { default: pngToIco } = require("png-to-ico");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const SIZES = [16, 32, 48, 64, 128, 256];
const SOURCE_PNG = path.join(PUBLIC_DIR, "getmedia_icon_512x512.png");

async function main() {
  if (!fs.existsSync(SOURCE_PNG)) {
    throw new Error(`Source PNG not found: ${SOURCE_PNG}`);
  }

  console.log("Generating multi-resolution ICO frames...");

  // Generate a resized PNG buffer for each target size.
  // For sizes > 64, keep PNG format; for small sizes, png-to-ico handles conversion.
  const frames = [];
  for (const size of SIZES) {
    const buf = await sharp(SOURCE_PNG)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        quality: 100,
        compressionLevel: 6,
        palette: false,
      })
      .toBuffer();

    frames.push(buf);
    console.log(`  ${size}x${size} PNG frame: ${buf.length} bytes`);
  }

  // png-to-ico accepts an array of PNG buffers and embeds each as a frame.
  const icoBuffer = await pngToIco(frames);

  const outPath = path.join(PUBLIC_DIR, "getmedia_icon_256x256.ico");
  fs.writeFileSync(outPath, icoBuffer);

  console.log(`\nGenerated multi-resolution ICO: ${outPath}`);
  console.log(`Total size: ${icoBuffer.length} bytes (${SIZES.length} frames)`);
}

main().catch((err) => {
  console.error("Failed to generate icon:", err);
  process.exit(1);
});
