/**
 * TypeScript declaration for the Electron preload bridge.
 *
 * Exposes a typed `window.electronAPI` object when the app is running
 * inside Electron. When running as a plain web app the property is
 * undefined and the desktop-bridge falls back to HTTP fetch.
 */

import type { HistoryEntry, HistoryEntryInput, HistoryEntryPatch } from "./history";

export interface ElectronAPI {
  /** Fetch video info via yt-dlp in the main process. */
  getInfo(url: string): Promise<
    | import("./video-info").VideoInfo
    | { error: string; status?: number }
  >;
  /** Download media via yt-dlp in the main process. Saves to disk. */
  download(opts: {
    url: string;
    type: "audio" | "video";
    extension?: string;
    quality?: string;
  }): Promise<
    | { filePath: string; filename: string; fileSize: number | null }
    | { error: string; status?: number }
  >;
  /** Resolve the default Downloads directory for the current user. */
  getDownloadsPath(): Promise<string>;
  /** Returns the user's currently configured download folder. */
  getDownloadFolder(): Promise<string>;
  /** Opens a native folder picker; returns the chosen path or null if cancelled. */
  chooseDownloadFolder(): Promise<string | null>;
  /** Opens a file path in the OS file manager (reveals the file). */
  openPath(filePath: string): Promise<void>;
  /** Returns the full download history, newest first. */
  historyList(): Promise<HistoryEntry[]>;
  /** Adds a new history entry; returns the persisted record with id/startedAt. */
  historyAdd(entry: HistoryEntryInput): Promise<HistoryEntry>;
  /** Patches a history entry by id; returns the updated entry or null. */
  historyUpdate(id: string, patch: HistoryEntryPatch): Promise<HistoryEntry | null>;
  /** Deletes a single history entry; returns true if an entry was removed. */
  historyDelete(id: string): Promise<boolean>;
  /** Erases the entire history (files on disk are untouched). */
  historyClear(): Promise<void>;
  /** Listen for an update-available event from the main process. */
  onUpdateAvailable(cb: (info: unknown) => void): void;
  /** Listen for an update-not-available event from the main process. */
  onUpdateNotAvailable(cb: (info: unknown) => void): void;
  /** Listen for download-progress events from the main process. */
  onUpdateProgress(cb: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void): void;
  /** Listen for an update-downloaded event from the main process. */
  onUpdateDownloaded(cb: (info: unknown) => void): void;
  /** Listen for update errors from the main process. */
  onUpdateError(cb: (message: string) => void): void;
  /** Remove all update-related IPC listeners. */
  removeUpdateListeners(): void;
  /** Trigger a manual update check. Resolves with the UpdateInfo or null. */
  checkForUpdates(): Promise<unknown>;
  /** Trigger an update download. Resolves with the file paths or null. */
  downloadUpdate(): Promise<unknown>;
  /** Quit the app and install the pending update. */
  quitAndInstall(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
