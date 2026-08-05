/**
 * Simple file logger for the Electron main process.
 *
 * In production (packaged app), main process console output goes nowhere
 * because there's no terminal attached. This logger writes to a file
 * so errors and debug info can be inspected after the fact.
 *
 * Log file location: <os.tmpdir()>/getmedia-logs.txt
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const LOG_FILE = path.join(os.tmpdir(), "getmedia-logs.txt");

/**
 * Maximum log file size in bytes (5 MB).
 * When the file exceeds this, it's truncated to keep it manageable.
 */
const MAX_LOG_SIZE = 5 * 1024 * 1024;

/**
 * Truncates the log file if it exceeds MAX_LOG_SIZE.
 * Keeps the most recent entries by reading the tail.
 */
function truncateIfNeeded(): void {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_LOG_SIZE) {
      // Read the last half of the file and rewrite
      const content = fs.readFileSync(LOG_FILE, "utf-8");
      const halfIndex = Math.floor(content.length / 2);
      const newlineIdx = content.indexOf("\n", halfIndex);
      const trimmed = content.slice(newlineIdx + 1);
      fs.writeFileSync(LOG_FILE, trimmed);
    }
  } catch {
    // File doesn't exist yet or can't be truncated — ignore
  }
}

/**
 * Writes a log entry to the log file with a timestamp.
 *
 * @param level - "LOG", "ERROR", "WARN", "INFO"
 * @param args  - Arguments passed to the original console method
 */
function writeToLog(level: string, args: unknown[]): void {
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack ?? ""}`;
      }
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");

  const line = `[${timestamp}] [${level}] ${message}\n`;

  try {
    truncateIfNeeded();
    fs.appendFileSync(LOG_FILE, line, "utf-8");
  } catch {
    // If we can't write to the log file, there's not much we can do
  }
}

/**
 * Overrides console.log, console.error, console.warn, and console.info
 * so that all main process output is also written to the log file.
 *
 * Should be called as early as possible in the main process entry point.
 * Console output still goes to stdout/stderr (visible in dev terminal).
 */
export function setupFileLogger(): void {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    writeToLog("LOG", args);
  };

  console.error = (...args: unknown[]) => {
    originalError(...args);
    writeToLog("ERROR", args);
  };

  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    writeToLog("WARN", args);
  };

  console.info = (...args: unknown[]) => {
    originalInfo(...args);
    writeToLog("INFO", args);
  };

  // Also capture uncaught exceptions
  process.on("uncaughtException", (err) => {
    writeToLog("FATAL", [err]);
  });

  process.on("unhandledRejection", (reason) => {
    writeToLog("FATAL", ["Unhandled promise rejection:", reason]);
  });

  console.log("[logger] File logger initialized. Log file:", LOG_FILE);
}

/**
 * Returns the path to the log file.
 * Can be exposed to the renderer so the user can find/open it.
 */
export function getLogFilePath(): string {
  return LOG_FILE;
}
