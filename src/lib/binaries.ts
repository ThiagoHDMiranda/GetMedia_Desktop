import path from "node:path";

/**
 * Returns the absolute path to the yt-dlp binary.
 *
 * Resolution order:
 * 1. `YT_DLP_PATH` env var (explicit override)
 * 2. Electron packaged resources path (`process.resourcesPath`)
 *    — used in production builds where the binaries are bundled via
 *    electron-builder `extraResources`.
 * 3. Project root in development (`process.cwd()`).
 */
export function getYtDlpPath(): string {
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

  // Electron production: binaries are copied into resources/binaries
  if (process.env.ELECTRON_RUNWAY && process.resourcesPath) {
    return path.join(process.resourcesPath, "binaries", "yt-dlp.exe");
  }

  if (process.env.NODE_ENV === "development") {
    return path.join(process.cwd(), "yt-dlp.exe");
  }

  // Production fallback (legacy Vercel/Linux path)
  return path.join(process.cwd(), "yt-dlp");
}

/**
 * Returns the absolute path to the ffmpeg binary.
 *
 * Same resolution strategy as `getYtDlpPath`.
 */
export function getFfmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  // Electron production: binaries are copied into resources/binaries
  if (process.env.ELECTRON_RUNWAY && process.resourcesPath) {
    return path.join(process.resourcesPath, "binaries", "ffmpeg.exe");
  }

  if (process.env.NODE_ENV === "development") {
    return path.join(process.cwd(), "ffmpeg.exe");
  }

  return path.join(process.cwd(), "ffmpeg");
}
