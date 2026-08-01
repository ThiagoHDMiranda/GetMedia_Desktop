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
export function downloadMedia(opts: DownloadOptions): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const url = sanitizeUrl(opts.url || "");
    if (!url) {
      resolve({ error: "URL é obrigatória", status: 400 });
      return;
    }

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
    const outputTemplate = path.join(downloadsDir, "%(title)s.%(ext)s");

    const args: string[] = [
      ...buildCommonArgs(),
      "--ffmpeg-location",
      ffmpegPath,
      "-o",
      outputTemplate,
      "--newline",
    ];

    if (opts.type === "audio") {
      args.push("-x", "--audio-format", ext);
      if (opts.quality) args.push("--audio-quality", opts.quality);
    } else {
      if (opts.quality) {
        const height = opts.quality.replace("p", "");
        args.push(
          "-f",
          `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`,
        );
      } else {
        args.push("-f", "bestvideo+bestaudio/best");
      }

      if (opts.extension) {
        const isNativeFormat = ext === "mp4" || ext === "webm";
        if (isNativeFormat) {
          args.push("--merge-output-format", ext);
        } else {
          args.push("--recode-video", ext);
        }
      }
    }

    args.push(url);

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
      resolve({ error: binaryErrorMessage(), status: 500 });
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(`[download] yt-dlp exited with code ${code}`);
        console.error(`[download] yt-dlp args:`, args);
        console.error(`[download] Full stderr:`, errorBuffer || "(empty)");
        const { message, status } = parseYtDlpError(errorBuffer, "download");
        resolve({ error: message, status });
        return;
      }

      try {
        // yt-dlp writes the final filename to the last stdout line containing
        // "[download] Destination: " or the final "Merger" line. Instead, we
        // list the Downloads files that match our template's extension and
        // pick the most recently modified one as a best-effort match.
        const files = fs
          .readdirSync(downloadsDir)
          .map((name) => {
            const full = path.join(downloadsDir, name);
            const stat = fs.statSync(full);
            return { name, full, mtime: stat.mtimeMs };
          })
          .filter((f) => path.extname(f.name).slice(1).toLowerCase() === ext)
          .sort((a, b) => b.mtime - a.mtime);

        if (files.length === 0) {
          resolve({
            error: "errors.serverError",
            status: 500,
          });
          return;
        }

        const latest = files[0];

        // Best-effort: read file size for the history entry. Non-fatal if it
        // fails (e.g. file got moved/deleted between listing and stat).
        let fileSize: number | null = null;
        try {
          fileSize = fs.statSync(latest.full).size;
        } catch (statErr) {
          console.warn(
            "[download] Failed to stat downloaded file (continuing without size):",
            statErr,
          );
        }

        resolve({
          filePath: latest.full,
          filename: latest.name,
          fileSize,
        });
      } catch (err) {
        console.error("[download] Failed to process download output:", err);
        resolve({
          error: "errors.serverError",
          status: 500,
        });
      }
    });
  });
}
