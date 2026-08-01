/**
 * Persistent download folder configuration.
 *
 * The chosen download destination is stored in `config.json` inside the
 * Electron `userData` directory. On first run (or if the file is missing)
 * the OS Downloads folder is used as the default.
 */

import path from "node:path";
import fs from "node:fs";
import { app } from "electron";

interface DownloadConfig {
  downloadFolder: string;
}

const CONFIG_FILENAME = "config.json";

function getConfigPath(): string {
  return path.join(app.getPath("userData"), CONFIG_FILENAME);
}

/**
 * Returns the user's preferred download folder, falling back to the OS
 * Downloads directory when no preference has been saved.
 */
export function getDownloadFolder(): string {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed: DownloadConfig = JSON.parse(raw);
      if (parsed.downloadFolder && typeof parsed.downloadFolder === "string") {
        return parsed.downloadFolder;
      }
    }
  } catch (err) {
    console.error("[config] Failed to read download folder config:", err);
  }

  return app.getPath("downloads");
}

/**
 * Persists the selected download folder to disk.
 */
export function setDownloadFolder(folder: string): void {
  try {
    const configPath = getConfigPath();
    const config: DownloadConfig = { downloadFolder: folder };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("[config] Failed to save download folder config:", err);
  }
}
