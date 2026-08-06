import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Download, X, RefreshCw } from "lucide-react";
import type { UseUpdaterReturn } from "@/hooks/useUpdater";

interface UpdateNotificationProps {
  updater: UseUpdaterReturn;
  /** Called when the user clicks "Download" — opens Settings modal. */
  onDownload: () => void;
}

/**
 * UpdateNotification
 *
 * Shows a dismissible bar notification when the automatic startup
 * update check finds a new version. Displays "Download" (opens Settings
 * where the user can start the download) and "Later" (dismisses).
 *
 * Only appears for the **automatic** check (15s after app launch),
 * not when the user manually checks from Settings — that case is
 * already handled inside the SettingsModal.
 */
export function UpdateNotification({ updater, onDownload }: UpdateNotificationProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  // Tracks whether the current "available" status came from the automatic
  // startup check (not a manual click in Settings). The automatic check
  // fires the `update:available` IPC event directly, so status jumps from
  // "idle" → "available" without passing through "checking".
  const wasManualCheckRef = useRef(false);

  useEffect(() => {
    if (updater.status === "checking") {
      // User clicked "Check for updates" in Settings — mark as manual
      wasManualCheckRef.current = true;
    }
  }, [updater.status]);

  // Reset state when a new check cycle starts
  useEffect(() => {
    if (updater.status === "idle") {
      setDismissed(false);
      wasManualCheckRef.current = false;
    }
  }, [updater.status]);

  // Only show for automatic checks (not manual ones from Settings)
  if (
    dismissed ||
    updater.status !== "available" ||
    wasManualCheckRef.current
  ) {
    return null;
  }

  const version = updater.updateVersion ?? "";

  return (
    <div className="fixed z-40 top-4 left-1/2 -translate-x-1/2 animate-fade-in w-full max-w-md backdrop-blur-xl rounded-xl">
      <div
        className="w-full glass border border-brand-400/40 backdrop-blur-xl rounded-xl shadow-2xl p-4 flex items-start gap-3 relative"
        role="alert"
        aria-live="polite"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-brand-400" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-brand-400">
            {t("update.toastAvailable", { version })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              id="update-toast-download-btn"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 border border-brand-400 text-white/80 hover:bg-brand-600 transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5" />
              {t("update.toastDownload")}
            </button>
            <button
              id="update-toast-later-btn"
              onClick={() => setDismissed(true)}
              className="flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-border bg-surface-muted text-[var(--text-secondary)] hover:text-brand-400 hover:border-brand-400/40 transition-all duration-150"
            >
              {t("update.toastLater")}
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={t("toast.close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
