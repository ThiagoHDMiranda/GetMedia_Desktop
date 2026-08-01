/**
 * Desktop bridge — communication with the Electron main process via IPC.
 *
 * All yt-dlp/ffmpeg operations happen in the main process. The renderer
 * calls `window.electronAPI` which is exposed by the preload script.
 */

import type { VideoInfo } from "@/types/video-info";

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
  | VideoInfo
  | { error: string; status?: number };

/**
 * Fetch video information via yt-dlp in the main process.
 */
export async function fetchVideoInfo(url: string): Promise<InfoResult> {
  if (!window.electronAPI) {
    return { error: "Electron API não disponível", status: 500 };
  }
  return window.electronAPI.getInfo(url);
}

/**
 * Download media via yt-dlp in the main process.
 * The file is saved directly to the user's Downloads folder.
 */
export async function downloadMedia(
  opts: DownloadOptions,
): Promise<DownloadResult> {
  if (!window.electronAPI) {
    return { error: "Electron API não disponível", status: 500 };
  }
  return window.electronAPI.download(opts);
}

/**
 * Returns the user's currently configured download folder.
 */
export async function getDownloadFolder(): Promise<string> {
  if (!window.electronAPI) {
    // Fallback to a sensible default when not running in Electron
    return "Downloads";
  }
  return window.electronAPI.getDownloadFolder();
}

/**
 * Opens a native folder picker dialog and persists the selection.
 * Returns the chosen path, or null if the user cancelled.
 */
export async function chooseDownloadFolder(): Promise<string | null> {
  if (!window.electronAPI) {
    return null;
  }
  return window.electronAPI.chooseDownloadFolder();
}

// ── History bridge ──────────────────────────────────────────────────────────

import type {
  HistoryEntry,
  HistoryEntryInput,
  HistoryEntryPatch,
} from "@/types/history";

export async function historyList(): Promise<HistoryEntry[]> {
  if (!window.electronAPI) return [];
  return (await window.electronAPI.historyList()) as HistoryEntry[];
}

export async function historyAdd(
  entry: HistoryEntryInput,
): Promise<HistoryEntry> {
  if (!window.electronAPI) {
    throw new Error("Electron API not available");
  }
  return (await window.electronAPI.historyAdd(entry)) as HistoryEntry;
}

export async function historyUpdate(
  id: string,
  patch: HistoryEntryPatch,
): Promise<HistoryEntry | null> {
  if (!window.electronAPI) {
    throw new Error("Electron API not available");
  }
  return (await window.electronAPI.historyUpdate(id, patch)) as
    | HistoryEntry
    | null;
}

export async function historyDelete(id: string): Promise<boolean> {
  if (!window.electronAPI) return false;
  return window.electronAPI.historyDelete(id);
}

export async function historyClear(): Promise<void> {
  if (!window.electronAPI) return;
  return window.electronAPI.historyClear();
}
