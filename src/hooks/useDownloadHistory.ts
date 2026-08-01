/**
 * useDownloadHistory — React hook that mirrors the persistent history
 * stored by the Electron main process (`electron/lib/history.ts`).
 *
 * The hook fetches the full list on mount and exposes typed wrappers
 * for adding, patching, deleting, and clearing entries. After every
 * mutation it calls `refresh()` so the UI stays in sync.
 *
 * A simple `subscribe` callback is also exposed: callers (e.g. App.tsx)
 * can call it after kicking off a download to notify the hook that a
 * refresh should happen.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  historyAdd as bridgeHistoryAdd,
  historyClear as bridgeHistoryClear,
  historyDelete as bridgeHistoryDelete,
  historyList as bridgeHistoryList,
  historyUpdate as bridgeHistoryUpdate,
} from "@/lib/desktop-bridge";
import type {
  HistoryEntry,
  HistoryEntryInput,
  HistoryEntryPatch,
} from "@/types/history";

export interface UseDownloadHistory {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (entry: HistoryEntryInput) => Promise<HistoryEntry>;
  update: (
    id: string,
    patch: HistoryEntryPatch,
  ) => Promise<HistoryEntry | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

export function useDownloadHistory(): UseDownloadHistory {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const list = await bridgeHistoryList();
      if (!mountedRef.current) return;
      setEntries(list);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load history");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh().finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const add = useCallback(
    async (entry: HistoryEntryInput): Promise<HistoryEntry> => {
      const created = await bridgeHistoryAdd(entry);
      await refresh();
      return created;
    },
    [refresh],
  );

  const update = useCallback(
    async (
      id: string,
      patch: HistoryEntryPatch,
    ): Promise<HistoryEntry | null> => {
      const updated = await bridgeHistoryUpdate(id, patch);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const ok = await bridgeHistoryDelete(id);
      await refresh();
      return ok;
    },
    [refresh],
  );

  const clearAll = useCallback(async (): Promise<void> => {
    await bridgeHistoryClear();
    await refresh();
  }, [refresh]);

  return { entries, loading, error, refresh, add, update, remove, clearAll };
}
