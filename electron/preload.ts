/**
 * Electron preload script.
 *
 * Runs in an isolated context with Node.js access and exposes a minimal,
 * typed API to the renderer via `contextBridge`. The renderer never has
 * direct access to `require` or Node APIs — only the methods defined here.
 */

import { contextBridge, ipcRenderer } from "electron";

export interface ElectronAPI {
  getInfo: (url: string) => Promise<unknown>;
  download: (opts: {
    url: string;
    type: "audio" | "video";
    extension?: string;
    quality?: string;
  }) => Promise<unknown>;
  getDownloadsPath: () => Promise<string>;
  getDownloadFolder: () => Promise<string>;
  chooseDownloadFolder: () => Promise<string | null>;
  openPath: (filePath: string) => Promise<void>;
  historyList: () => Promise<unknown[]>;
  historyAdd: (entry: unknown) => Promise<unknown>;
  historyUpdate: (id: string, patch: unknown) => Promise<unknown>;
  historyDelete: (id: string) => Promise<boolean>;
  historyClear: () => Promise<void>;
  /** Listen for an update event from the main process. */
  onUpdateAvailable: (cb: (info: unknown) => void) => void;
  onUpdateNotAvailable: (cb: (info: unknown) => void) => void;
  onUpdateProgress: (cb: (progress: unknown) => void) => void;
  onUpdateDownloaded: (cb: (info: unknown) => void) => void;
  onUpdateError: (cb: (message: string) => void) => void;
  removeUpdateListeners: () => void;
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  quitAndInstall: () => Promise<void>;
}

const electronAPI: ElectronAPI = {
  getInfo: (url: string) => ipcRenderer.invoke("yt-dlp:info", url),
  download: (opts) => ipcRenderer.invoke("yt-dlp:download", opts),
  getDownloadsPath: () => ipcRenderer.invoke("app:downloads-path"),
  getDownloadFolder: () => ipcRenderer.invoke("app:get-download-folder"),
  chooseDownloadFolder: () => ipcRenderer.invoke("app:choose-download-folder"),
  openPath: (filePath: string) => ipcRenderer.invoke("shell:open-path", filePath),
  historyList: () => ipcRenderer.invoke("history:list"),
  historyAdd: (entry) => ipcRenderer.invoke("history:add", entry),
  historyUpdate: (id, patch) => ipcRenderer.invoke("history:update", id, patch),
  historyDelete: (id) => ipcRenderer.invoke("history:delete", id),
  historyClear: () => ipcRenderer.invoke("history:clear"),
  onUpdateAvailable: (cb) => ipcRenderer.on("update:available", (_e, info) => cb(info)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on("update:not-available", (_e, info) => cb(info)),
  onUpdateProgress: (cb) => ipcRenderer.on("update:download-progress", (_e, p) => cb(p)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update:downloaded", (_e, info) => cb(info)),
  onUpdateError: (cb) => ipcRenderer.on("update:error", (_e, msg) => cb(msg)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners("update:available");
    ipcRenderer.removeAllListeners("update:not-available");
    ipcRenderer.removeAllListeners("update:download-progress");
    ipcRenderer.removeAllListeners("update:downloaded");
    ipcRenderer.removeAllListeners("update:error");
  },
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  downloadUpdate: () => ipcRenderer.invoke("updater:download"),
  quitAndInstall: () => ipcRenderer.invoke("updater:quit-and-install"),
};

// Expose the bridge to the renderer's window object
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
