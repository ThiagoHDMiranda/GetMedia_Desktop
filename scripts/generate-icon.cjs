/**
 * Generates a multi-resolution .ico file from the source 512x512 PNG.
 *
 * Run: node scripts/generate-icon.cjs
 */
const fs = require("fs");
const path = require("path");
const { default: pngToIco } = require("png-to-ico");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

async function main() {
  const png512 = fs.readFileSync(
    path.join(PUBLIC_DIR, "getmedia_icon_512x512.png")
  );

  // png-to-ico embeds the PNG as a frame inside the .ico container.
  // Using the 512x512 source ensures the highest quality base frame.
  const icoBuffer = await pngToIco(png512);

  const outPath = path.join(PUBLIC_DIR, "getmedia_icon_256x256.ico");
  fs.writeFileSync(outPath, icoBuffer);
  console.log("Generated .ico at:", outPath);
  console.log("Size:", icoBuffer.length, "bytes");
}

main().catch((err) => {
  console.error("Failed to generate icon:", err);
  process.exit(1);
});
