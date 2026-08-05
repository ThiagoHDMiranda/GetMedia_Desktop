/**
 * Consolidated yt-dlp logic for the Electron main process.
 *
 * This module moves the implementation that previously lived in the Next.js
 * API routes (`src/app/api/info/route.ts` and `src/app/api/download/route.ts`)
 * into reusable functions that can be invoked via IPC from the renderer.
 *
 * It reuses the existing shared libraries:
 *   - `src/lib/binaries.ts`        (binary path resolution)
 *   - `src/lib/ytdlp-errors.ts`   (error mapping)
 *   - `src/lib/ytdlp-utils.ts`     (common args, URL sanitization)
 *
 * NOTE: imports use relative paths because the electron/ directory is
 * compiled as a standalone TypeScript project (no `@/` path alias).
 */

import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { app } from "electron";
import { getYtDlpPath, getFfmpegPath } from "../../src/lib/binaries";
import { parseYtDlpError, binaryErrorMessage } from "../../src/lib/ytdlp-errors";
import { buildCommonArgs, sanitizeUrl } from "../../src/lib/ytdlp-utils";
import { getDownloadFolder } from "./config";

const EXT_FORMAT_MAP: Record<string, string> = {
  MP3: "mp3",
  M4A: "m4a",
  AAC: "aac",
  WAV: "wav",
  FLAC: "flac",
  MP4: "mp4",
  MKV: "mkv",
  WEBM: "webm",
  AVI: "avi",
  MOV: "mov",
  FLV: "flv",
};

export interface InfoResponse {
  title?: string | null;
  thumbnail?: string | null;
  channel?: string | null;
  like_count?: number | null;
  comment_count?: number | null;
  duration?: string | null;
  view_count?: number | null;
  upload_date?: string | null;
  webpage_url?: string;
  videoQualities?: Array<{
    format_id: string;
    resolution: string;
    ext: string;
    filesize?: number;
  }>;
  audioQualities?: Array<{
    format_id: string;
    abr?: number;
    ext: string;
    filesize?: number;
  }>;
}

export interface DownloadOptions {
  url: string;
  type: "audio" | "video";
  extension?: string;
  quality?: string;
}

export type DownloadResult =
  | { filePath: string; filename: string; fileSize: number | null }
  | { error: string; status?: number };

export type InfoResult =
  | InfoResponse
  | { error: string; status?: number };

/**
 * Fetch video information via yt-dlp `--dump-json`.
 */
export function getVideoInfo(rawUrl: string): Promise<InfoResult> {
  return new Promise((resolve) => {
    const url = sanitizeUrl(rawUrl || "");
    if (!url) {
      resolve({ error: "URL inválida", status: 400 });
      return;
    }

    const ytDlpPath = getYtDlpPath();
    const args = [...buildCommonArgs(), "--dump-json", url];

    let jsonBuffer = "";
    let errorBuffer = "";

    const proc = spawn(ytDlpPath, args);

    proc.stdout.on("data", (chunk: Buffer) => {
      jsonBuffer += chunk.toString("utf-8");
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      errorBuffer += chunk.toString("utf-8");
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(`[info] yt-dlp exited with code ${code}`);
        console.error(`[info] yt-dlp args:`, args);
        console.error(`[info] Full stderr:`, errorBuffer || "(empty)");
        const { message, status } = parseYtDlpError(errorBuffer, "info");
        resolve({ error: message, status });
        return;
      }

      try {
        const raw = JSON.parse(jsonBuffer.trim());

        // Extract unique video qualities
        const videoQualities: Array<{
          format_id: string;
          resolution: string;
          ext: string;
          filesize?: number;
        }> = [];
        const audioQualities: Array<{
          format_id: string;
          abr?: number;
          ext: string;
          filesize?: number;
        }> = [];
        const seen = new Set<string>();

        if (raw.formats) {
          for (let i = raw.formats.length - 1; i >= 0; i--) {
            const fmt = raw.formats[i];
            if (fmt.ext === "mhtml") continue;
            if (fmt.resolution === "audio only") {
              const abrStr = fmt.abr ? `${Math.round(fmt.abr)}k` : "";
              if (abrStr && !seen.has(abrStr)) {
                seen.add(abrStr);
                audioQualities.push({
                  format_id: fmt.format_id,
                  abr: fmt.abr,
                  ext: fmt.ext,
                  filesize: fmt.filesize,
                });
              }
            } else if (fmt.resolution && !seen.has(fmt.resolution)) {
              seen.add(fmt.resolution);
              videoQualities.push({
                format_id: fmt.format_id,
                resolution: fmt.resolution,
                ext: fmt.ext,
                filesize: fmt.filesize,
              });
            }
          }
        }

        resolve({
          title: raw.title ?? null,
          thumbnail: raw.thumbnail ?? null,
          channel: raw.channel ?? raw.uploader ?? null,
          like_count: raw.like_count ?? null,
          comment_count: raw.comment_count ?? null,
          duration: raw.duration_string ?? null,
          view_count: raw.view_count ?? null,
          upload_date: raw.upload_date ?? null,
          webpage_url: raw.webpage_url ?? url,
          videoQualities,
          audioQualities,
        });
      } catch (err) {
        console.error(
          "[info] Failed to parse yt-dlp JSON output:",
          err,
          "\nRaw output:",
          jsonBuffer.slice(0, 500),
        );
        resolve({
          error: "errors.serverError",
          status: 500,
        });
      }
    });

    proc.on("error", (err) => {
      console.error(
        "[info] Failed to spawn yt-dlp:",
        err.message,
        "\nPath:",
        ytDlpPath,
      );
      resolve({ error: binaryErrorMessage(), status: 500 });
    });
  });
}

/**
 * Download media via yt-dlp, saving the result into the OS Downloads folder.
 *
 * Returns `{ filePath, filename }` on success or `{ error, status }` on failure.
 */

// url: string;
//   type: "audio" | "video";
//   extension?: string;
//   quality?: string;
/**
 * Recursively deletes a directory and all its contents.
 * Used to clean up the temp folder after a download completes (success or failure).
 */
function cleanupTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn("[download] Failed to clean up temp directory:", dir, err);
  }
}

export function downloadMedia(opts: DownloadOptions): Promise<DownloadResult> {
  return new Promise(async (resolve) => {
    const url = sanitizeUrl(opts.url || "");
    if (!url) {
      resolve({ error: "URL é obrigatória", status: 400 });
      return;
    }
    const validatedUrl = url;

    const ytDlpPath = getYtDlpPath();
    const ffmpegPath = getFfmpegPath();

    const ext = opts.extension
      ? EXT_FORMAT_MAP[opts.extension.toUpperCase()] ??
        (opts.type === "audio" ? "mp3" : "mp4")
      : opts.type === "audio"
        ? "mp3"
        : "mp4";

    // Use the user's configured download directory (defaults to OS Downloads)
    const downloadsDir = getDownloadFolder();

    // Create a unique temp folder inside the OS temp directory.
    // All yt-dlp operations (download, merge, recode) happen inside this folder
    // so intermediate files (.f###, .temp, etc.) never pollute the download dir.
    const tempDir = path.join(os.tmpdir(), `GetMedia_${Date.now()}`);
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (mkdirErr) {
      console.error("[download] Failed to create temp directory:", mkdirErr);
      resolve({ error: "errors.serverError", status: 500 });
      return;
    }

    const outputTemplate = path.join(tempDir, "%(title)s.%(ext)s");

    // ── Build yt-dlp argument sets ──────────────────────────────────────────

    function buildBaseArgs(): string[] {
      return [
        ...buildCommonArgs(),
        "--ffmpeg-location",
        ffmpegPath,
        "-o",
        outputTemplate,
        "--newline",
      ];
    }

    function buildAudioArgs(): string[] {
      const args = buildBaseArgs();
      args.push("-x", "--audio-format", ext);
      if (opts.quality) args.push("--audio-quality", opts.quality);
      args.push(validatedUrl);
      return args;
    }

    function buildVideoArgs(useWebmNative: boolean): string[] {
      const args = buildBaseArgs();
      const height = opts.quality?.replace("p", "");

      if (useWebmNative && ext === "webm") {
        // WebM-native: prefer WebM streams so we can losslessly merge.
        // Always respect the user's chosen quality.
        args.push(
          "-f",
          height
            ? `bestvideo[ext=webm][height<=${height}]+bestaudio[ext=webm]/bestvideo[ext=webm][height<=${height}]+bestaudio/best[height<=${height}]`
            : `bestvideo[ext=webm]+bestaudio[ext=webm]/bestvideo+bestaudio/best`,
        );
        args.push("--merge-output-format", ext);
      } else if (ext === "webm") {
        // Fallback for WebM: download any format, then recode to WebM.
        // Always respect the user's chosen quality.
        args.push(
          "-f",
          height
            ? `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`
            : `bestvideo+bestaudio/best`,
        );
        args.push("--recode-video", ext);
      } else {
        // Non-WebM formats.
        // Always respect the user's chosen quality.
        args.push(
          "-f",
          height
            ? `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`
            : `bestvideo+bestaudio/best`,
        );
        const isNativeFormat = ext === "mp4";
        if (isNativeFormat) {
          args.push("--merge-output-format", ext);
        } else {
          args.push("--recode-video", ext);
        }
      }

      args.push(validatedUrl);
      return args;
    }

    // ── Run yt-dlp ──────────────────────────────────────────────────────────

    /**
     * Spawns yt-dlp with the given args, collects stderr, and returns
     * the exit code and error buffer.
     */
    function runYtDlp(args: string[]): Promise<{ code: number | null; errorBuffer: string }> {
      return new Promise((runResolve) => {
        let errorBuffer = "";

        const proc = spawn(ytDlpPath, args, {
          stdio: ["ignore", "pipe", "pipe"],
        });

        proc.stderr.on("data", (chunk: Buffer) => {
          errorBuffer += chunk.toString();
        });

        proc.on("error", (err) => {
          console.error(
            "[download] Failed to spawn yt-dlp:",
            err.message,
            "\nPath:",
            ytDlpPath,
          );
          runResolve({ code: null, errorBuffer });
        });

        proc.on("close", (code) => {
          runResolve({ code, errorBuffer });
        });
      });
    }

    // ── Execution ───────────────────────────────────────────────────────────

    const isWebmVideo = opts.type === "video" && ext === "webm";
    let result: { code: number | null; errorBuffer: string };

    if (opts.type === "audio") {
      result = await runYtDlp(buildAudioArgs());
    } else if (isWebmVideo) {
      // Try native WebM first (fast, lossless merge)
      console.log("[download] Trying native WebM format...");
      result = await runYtDlp(buildVideoArgs(true));

      if (result.code !== 0) {
        // Fall back to recode (slower, but always works)
        console.log("[download] Native WebM failed, falling back to recode...");
        console.error(`[download] First attempt stderr:`, result.errorBuffer || "(empty)");

        // Clean up any partial files from the first attempt
        cleanupTempDir(tempDir);
        try {
          fs.mkdirSync(tempDir, { recursive: true });
        } catch {
          // Ignore — the original dir still exists if cleanup failed
        }

        result = await runYtDlp(buildVideoArgs(false));
      }
    } else {
      result = await runYtDlp(buildVideoArgs(false));
    }

    // ── Process result ──────────────────────────────────────────────────────

    const { code, errorBuffer } = result;

    if (code !== 0 && code !== null) {
      console.error(`[download] yt-dlp exited with code ${code}`);
      console.error(`[download] Full stderr:`, errorBuffer || "(empty)");
      cleanupTempDir(tempDir);
      const { message, status } = parseYtDlpError(errorBuffer, "download");
      resolve({ error: message, status });
      return;
    }

    if (code === null) {
      // Spawn failed
      cleanupTempDir(tempDir);
      resolve({ error: binaryErrorMessage(), status: 500 });
      return;
    }

    try {
      // Find the final output file in the temp directory.
      // yt-dlp produces the final file with the requested extension,
      // while intermediate files have extensions like .f160, .f251, .temp, etc.
      const files = fs
        .readdirSync(tempDir)
        .map((name) => {
          const full = path.join(tempDir, name);
          const stat = fs.statSync(full);
          return { name, full, mtime: stat.mtimeMs, size: stat.size };
        })
        .filter((f) => path.extname(f.name).slice(1).toLowerCase() === ext)
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length === 0) {
        console.error(
          "[download] No output file with extension",
          ext,
          "found in temp dir:",
          tempDir,
        );
        console.error(
          "[download] Files in temp dir:",
          fs.readdirSync(tempDir),
        );
        cleanupTempDir(tempDir);
        resolve({
          error: "errors.serverError",
          status: 500,
        });
        return;
      }

      const latest = files[0];

      // Move the final file to the user's download directory.
      // Use copy+delete instead of rename because rename fails with EXDEV
      // when the temp dir and download dir are on different drives.
      const finalPath = path.join(downloadsDir, latest.name);
      try {
        fs.copyFileSync(latest.full, finalPath);
        fs.unlinkSync(latest.full);
      } catch (moveErr) {
        console.error("[download] Failed to move file to download dir:", moveErr);
        cleanupTempDir(tempDir);
        resolve({ error: "errors.serverError", status: 500 });
        return;
      }

      // Clean up the temp folder (removes all intermediate files)
      cleanupTempDir(tempDir);

      resolve({
        filePath: finalPath,
        filename: latest.name,
        fileSize: latest.size,
      });
    } catch (err) {
      console.error("[download] Failed to process download output:", err);
      cleanupTempDir(tempDir);
      resolve({
        error: "errors.serverError",
        status: 500,
      });
    }
  });
}
