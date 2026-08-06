import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UseUpdaterReturn {
  status: UpdaterStatus;
  /** Version string of the available update (e.g. "2.0.0"). */
  updateVersion: string | null;
  /** File size of the update in bytes (null if unknown). */
  updateSize: number | null;
  /** Release date of the update as a string (null if unknown). */
  updateReleaseDate: string | null;
  /** Download progress percentage (0–100), only valid when status === "downloading". */
  progress: number;
  /** Error message when status === "error". */
  errorMessage: string | null;
  /** Explicitly check for updates. */
  checkForUpdates: () => Promise<void>;
  /** Start downloading the available update. */
  downloadUpdate: () => Promise<void>;
  /** Quit the app and install the downloaded update. */
  quitAndInstall: () => void;
}

export function useUpdater(): UseUpdaterReturn {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateSize, setUpdateSize] = useState<number | null>(null);
  const [updateReleaseDate, setUpdateReleaseDate] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listenersRef = useRef(false);

  // Register IPC listeners once.
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    if (listenersRef.current) return;
    listenersRef.current = true;

    api.onUpdateAvailable((info: any) => {
      setUpdateVersion(info?.version ?? null);
      setUpdateReleaseDate(info?.releaseDate ?? null);
      
      // info.files is an array of files. We try to find the size of the main exe or use the first file's size.
      let size: number | null = null;
      if (Array.isArray(info?.files) && info.files.length > 0) {
        size = info.files[0]?.size ?? null;
      }
      setUpdateSize(size);
      setStatus("available");
    });

    api.onUpdateNotAvailable(() => {
      setStatus("not-available");
      // Reset back to "idle" after 30 seconds so the user can check again.
      setTimeout(() => {
        setStatus("idle");
      }, 30_000);
    });

    api.onUpdateProgress((p: any) => {
      setStatus("downloading");
      setProgress(p?.percent ?? 0);
    });

    api.onUpdateDownloaded((info: any) => {
      setUpdateVersion(info?.version ?? updateVersion);
      setUpdateReleaseDate(info?.releaseDate ?? null);
      let size: number | null = null;
      if (Array.isArray(info?.files) && info.files.length > 0) {
        size = info.files[0]?.size ?? null;
      }
      setUpdateSize(size);
      setStatus("downloaded");
      setProgress(100);
    });

    api.onUpdateError((msg: string) => {
      setStatus("error");
      setErrorMessage(msg);
    });

    return () => {
      api.removeUpdateListeners();
      listenersRef.current = false;
    };
  }, [t]);

  const checkForUpdates = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    setStatus("checking");
    setErrorMessage(null);
    try {
      await api.checkForUpdates();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message ?? t("errors.unknown"));
    }
  }, [t]);

  const downloadUpdate = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    setStatus("downloading");
    setErrorMessage(null);
    try {
      await api.downloadUpdate();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message ?? t("errors.unknown"));
    }
  }, [t]);

  const quitAndInstall = useCallback(() => {
    const api = window.electronAPI;
    if (!api) return;
    api.quitAndInstall();
  }, []);

  return {
    status,
    updateVersion,
    updateSize,
    updateReleaseDate,
    progress,
    errorMessage,
    checkForUpdates,
    downloadUpdate,
    quitAndInstall,
  };
}
