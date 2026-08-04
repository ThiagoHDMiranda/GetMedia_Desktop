import path from "node:path";
import fs from "node:fs";

/**
 * Returns the absolute path to the yt-dlp binary.
 *
 * Resolution order:
 * 1. `YT_DLP_PATH` env var (explicit override)
 * 2. Electron packaged resources path (`process.resourcesPath/binaries/`)
 *    — used in production builds where the binaries are bundled via
 *    electron-builder `extraResources`.
 * 3. Project root in development (`process.cwd()`)
 * 4. Fallback: `process.cwd()/yt-dlp`
 */
export function getYtDlpPath(): string {
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

  // Electron production: binaries are copied into resources/binaries
  // Verify the file actually exists there before using it (in dev, resourcesPath
  // points to electron's internal resources, not our binaries).
  if (process.resourcesPath) {
    const prodPath = path.join(process.resourcesPath, "binaries", "yt-dlp.exe");
    if (fs.existsSync(prodPath)) {
      return prodPath;
    }
  }

  // Development: binaries live in the project root
  const devPath = path.join(process.cwd(), "yt-dlp.exe");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // Production fallback (e.g. Vercel/Linux without .exe)
  return path.join(process.cwd(), "yt-dlp");
}

/**
 * Returns the absolute path to the ffmpeg binary.
 *
 * Same resolution strategy as `getYtDlpPath`.
 */
export function getFfmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  if (process.resourcesPath) {
    const prodPath = path.join(
      process.resourcesPath,
      "binaries",
      "ffmpeg.exe",
    );
    if (fs.existsSync(prodPath)) {
      return prodPath;
    }
  }

  const devPath = path.join(process.cwd(), "ffmpeg.exe");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  return path.join(process.cwd(), "ffmpeg");
}
