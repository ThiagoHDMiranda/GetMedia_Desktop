/**
 * Persistent download history store.
 *
 * Stores an append-only log of download attempts in `history.json`
 * inside the Electron `userData` directory. On first run (or if the
 * file is missing) an empty list is used.
 *
 * The list is kept newest-first and capped at HISTORY_LIMIT entries;
 * older entries are pruned (FIFO) on every write.
 *
 * All writes are atomic: we serialize to a `.tmp` file and then
 * `renameSync` it onto the real path so a crash mid-write cannot
 * corrupt the JSON file.
 */

import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { app } from "electron";

export type HistoryStatus = "in_progress" | "downloaded" | "failed";
export type HistoryType = "audio" | "video";

export interface HistoryEntry {
  id: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  type: HistoryType;
  format: string;
  quality: string;
  channel: string | null;
  duration: string | null;
  filePath: string | null;
  filename: string | null;
  fileSize: number | null;
  destinationFolder: string;
  startedAt: number;
  completedAt: number | null;
  status: HistoryStatus;
  errorKey: string | null;
}

const CONFIG_FILENAME = "history.json";
const HISTORY_LIMIT = 200;

function getHistoryPath(): string {
  return path.join(app.getPath("userData"), CONFIG_FILENAME);
}

function readAll(): HistoryEntry[] {
  try {
    const historyPath = getHistoryPath();
    if (!fs.existsSync(historyPath)) return [];
    const raw = fs.readFileSync(historyPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: filter to entries that look well-formed.
    return parsed.filter(
      (e: unknown): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as HistoryEntry).id === "string",
    );
  } catch (err) {
    console.error("[history] Failed to read history file:", err);
    return [];
  }
}

function writeAll(entries: HistoryEntry[]): void {
  try {
    const historyPath = getHistoryPath();
    const tmpPath = `${historyPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(entries, null, 2), "utf-8");
    fs.renameSync(tmpPath, historyPath);
  } catch (err) {
    console.error("[history] Failed to write history file:", err);
  }
}

/**
 * Prepends a new entry to the log and returns the persisted record.
 * Generates `id` and `startedAt` if not provided.
 */
export function addEntry(
  entry: Omit<HistoryEntry, "id" | "startedAt"> &
    Partial<Pick<HistoryEntry, "id" | "startedAt">>,
): HistoryEntry {
  const full: HistoryEntry = {
    id: entry.id ?? crypto.randomUUID(),
    startedAt: entry.startedAt ?? Date.now(),
    ...entry,
  };
  const current = readAll();
  const next = [full, ...current].slice(0, HISTORY_LIMIT);
  writeAll(next);
  return full;
}

/**
 * Patches an entry in place. Returns the patched entry, or null if no
 * entry with that id was found.
 */
export function updateEntry(
  id: string,
  patch: Partial<Omit<HistoryEntry, "id" | "startedAt">>,
): HistoryEntry | null {
  const current = readAll();
  const idx = current.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated: HistoryEntry = { ...current[idx], ...patch };
  const next = [...current];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

/**
 * Removes a single entry by id. Returns true if an entry was deleted.
 */
export function deleteEntry(id: string): boolean {
  const current = readAll();
  const next = current.filter((e) => e.id !== id);
  if (next.length === current.length) return false;
  writeAll(next);
  return true;
}

/**
 * Erases the entire history. Files on disk are untouched.
 */
export function clearAll(): void {
  writeAll([]);
}

/**
 * Returns the full history, newest first.
 */
export function listEntries(): HistoryEntry[] {
  return readAll();
}
