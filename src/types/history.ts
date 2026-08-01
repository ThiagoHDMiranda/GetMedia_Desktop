/**
 * Renderer-side mirror of the Electron `HistoryEntry` shape.
 *
 * Kept in sync with `electron/lib/history.ts`. Any new field added there
 * must also be added here so the renderer remains fully typed.
 */

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

/** Patch passed to `historyUpdate` — id and startedAt are immutable. */
export type HistoryEntryPatch = Partial<
  Omit<HistoryEntry, "id" | "startedAt">
>;

/** Entry as passed to `historyAdd` — id and startedAt are auto-generated. */
export type HistoryEntryInput = Omit<HistoryEntry, "id" | "startedAt">;
