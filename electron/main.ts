/**
 * Electron main process entry point.
 *
 * Responsibilities:
 *   - Create the application BrowserWindow
 *   - Load the Next.js dev server (dev) or static export (production)
 *   - Register IPC handlers that invoke yt-dlp in the main process
 *
 * In development:
 *   The Next.js dev server runs separately (`next dev`) on port 3000.
 *   This process simply opens a window pointing at that URL.
 *
 * In production:
 *   Next.js is built as a static export (`next build` → `out/`).
 *   The window loads `out/index.html` from the filesystem.
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { autoUpdater } from "electron-updater";
import { getVideoInfo, downloadMedia } from "./lib/ytdlp";
import { getDownloadFolder, setDownloadFolder } from "./lib/config";
import { setupFileLogger, getLogFilePath } from "./lib/logger";
import * as history from "./lib/history";

// Set up file logging as early as possible — captures all console output
// (log, error, warn, info) plus uncaught exceptions to a file so we can
// debug issues in production where there's no terminal.
setupFileLogger();

const isDev = process.env.NODE_ENV === "development" || !!process.env.ELECTRON_DEV;

// Disable auto-download — the renderer decides when to download.
autoUpdater.autoDownload = false;

// Portable builds don't generate app-update.yml, so set the repo config explicitly.
autoUpdater.setFeedURL({
  provider: "github",
  owner: "ThiagoHDMiranda",
  repo: "GetMedia_Desktop",
});

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    // frame: false,
    title: "GetMedia",
    icon: path.join(app.getAppPath(), "public", "getmedia_icon_256x256.ico"),
    backgroundColor: "#0d0e1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Dev: load from the Next.js dev server
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    // Open DevTools in development
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // Production: load the Vite-built static site from the packaged app directory.
    // app.getAppPath() points to the asar/app dir that contains `dist/`.
    const staticPath = path.join(app.getAppPath(), "dist", "index.html");
    mainWindow.loadFile(staticPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.setMenu(null);

  return mainWindow;
}

// ── IPC handlers ──────────────────────────────────────────────────────────

ipcMain.handle("yt-dlp:info", async (_event, url: string) => {
  try {
    return await getVideoInfo(url);
  } catch (err) {
    console.error("[main] getInfo error:", err);
    return { error: "errors.unexpectedFetch", status: 500 };
  }
});

ipcMain.handle("yt-dlp:download", async (_event, opts) => {
  try {
    return await downloadMedia(opts);
  } catch (err) {
    console.error("[main] download error:", err);
    return { error: "errors.unexpectedDownload", status: 500 };
  }
});

// Returns the OS Downloads folder (kept for backward compatibility).
// Now returns the user's configured folder so existing callers stay consistent.
ipcMain.handle("app:downloads-path", () => {
  return getDownloadFolder();
});

// Returns the path to the main process log file.
ipcMain.handle("app:log-file-path", () => {
  return getLogFilePath();
});

// Returns the user's current download folder preference (defaults to OS Downloads).
ipcMain.handle("app:get-download-folder", () => {
  return getDownloadFolder();
});

// Opens a native directory picker, persists the selection, and returns the
// new path. Returns null when the user cancels the dialog.
ipcMain.handle("app:choose-download-folder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose the folder to save files",
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folder = result.filePaths[0];
  setDownloadFolder(folder);
  return folder;
});

// ── Shell IPC ───────────────────────────────────────────────────────────────

ipcMain.handle("shell:open-path", async (_event, filePath: string) => {
  // Reveal the file in the OS file manager (Explorer / Finder).
  await shell.showItemInFolder(filePath);
});

// ── History IPC ───────────────────────────────────────────────────────────

ipcMain.handle("history:list", () => {
  return history.listEntries();
});

ipcMain.handle("history:add", (_event, entry) => {
  return history.addEntry(entry);
});

ipcMain.handle("history:update", (_event, id: string, patch) => {
  return history.updateEntry(id, patch);
});

ipcMain.handle("history:delete", (_event, id: string) => {
  return history.deleteEntry(id);
});

ipcMain.handle("history:clear", () => {
  history.clearAll();
  return true;
});

// ── Auto-updater IPC ───────────────────────────────────────────────────────

// Forward autoUpdater events to the renderer.
autoUpdater.on("update-available", (info) => {
  mainWindow?.webContents.send("update:available", info);
});

autoUpdater.on("update-not-available", (info) => {
  mainWindow?.webContents.send("update:not-available", info);
});

autoUpdater.on("download-progress", (progress) => {
  mainWindow?.webContents.send("update:download-progress", progress);
});

autoUpdater.on("update-downloaded", (info) => {
  mainWindow?.webContents.send("update:downloaded", info);
});

autoUpdater.on("error", (err) => {
  mainWindow?.webContents.send("update:error", err.message);
});

// Renderer-triggered actions.
ipcMain.handle("updater:check", async () => {
  if (isDev) {
    return null; // no updates in dev mode
  }
  return autoUpdater.checkForUpdates().then((r) => r?.updateInfo ?? null);
});

ipcMain.handle("updater:download", async () => {
  if (isDev) return null;
  return autoUpdater.downloadUpdate().then((r) => r ?? null);
});

ipcMain.handle("updater:quit-and-install", () => {
  autoUpdater.quitAndInstall();
});

// ── App lifecycle ──────────────────────────────────────────────────────────

/**
 * Scans the OS temp directory for leftover `GetMedia_*` folders from
 * crashed or interrupted downloads and removes them.
 */
function cleanupLeftoverTempFolders(): void {
  const tmpDir = os.tmpdir();
  try {
    const entries = fs.readdirSync(tmpDir);
    for (const entry of entries) {
      if (entry.startsWith("GetMedia_")) {
        const fullPath = path.join(tmpDir, entry);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`[startup] Cleaned up leftover temp folder: ${entry}`);
        } catch (err) {
          console.warn(`[startup] Failed to clean up temp folder: ${entry}`, err);
        }
      }
    }
  } catch (err) {
    console.warn("[startup] Failed to scan temp directory for leftovers:", err);
  }
}

app.whenReady().then(() => {
  // Clean up any leftover temp folders from crashed/interrupted downloads
  cleanupLeftoverTempFolders();

  createMainWindow();

  // Check for updates after a short delay so the renderer is ready.
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error("[updater] Startup check failed:", err);
      });
    }, 15_000);
  }

  app.on("activate", () => {
    // macOS: re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // macOS: apps stay active until explicitly quit
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Surface unhandled errors to the console for debugging
process.on("uncaughtException", (err) => {
  console.error("[main] Uncaught exception:", err);
  dialog.showErrorBox("Unexpected Error", err.message || "Unknown error");
});
