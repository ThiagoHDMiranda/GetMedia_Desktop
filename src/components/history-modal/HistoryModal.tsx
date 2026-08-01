import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  History as HistoryIcon,
  Trash2,
  Music,
  Video,
  FolderOpen,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ButtonComponent } from "@/components/button-component/ButtonComponent";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";
import type { HistoryEntry } from "@/types/history";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * HistoryModal
 *
 * A modal overlay (matching the SettingsModal pattern) that shows the
 * persisted download log. Entries are grouped newest-first and rendered
 * as a scrollable list. Each row exposes per-entry delete; a footer
 * button offers a confirmable "clear all".
 */
export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const { t } = useTranslation();
  const { entries, loading, refresh, remove, clearAll } = useDownloadHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refresh whenever the modal opens so we always show the latest data.
  useEffect(() => {
    if (isOpen) {
      void refresh();
    }
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  const handleCopyLink = async (entry: HistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.url);
      setCopiedId(entry.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === entry.id ? null : current));
      }, 1500);
    } catch {
      // Clipboard denied; silently ignore.
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  const handleClearAll = async () => {
    await clearAll();
    setConfirmClear(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t("history.title")}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl animate-slide-up border border-surface-border bg-surface-card backdrop-blur-xl flex flex-col"
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-none">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-brand-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t("history.title")}
            </h2>
          </div>
          <button
            id="history-close-btn"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-glassHover transition-colors"
            aria-label={t("settings.closeAria")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[var(--text-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {t("common.loading")}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  copied={copiedId === entry.id}
                  onCopy={() => void handleCopyLink(entry)}
                  onDelete={() => void handleDelete(entry.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="px-6 py-4 border-t border-surface-border flex-none">
            {confirmClear ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>{t("history.clearAllConfirm")}</span>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <ButtonComponent
                    id="history-clear-cancel-btn"
                    fontSize="small"
                    variant="outline"
                    onClick={() => setConfirmClear(false)}
                  >
                    {t("common.cancel")}
                  </ButtonComponent>
                  <ButtonComponent
                    id="history-clear-confirm-btn"
                    fontSize="small"
                    variant="primary"
                    onClick={() => void handleClearAll()}
                  >
                    {t("history.clearAll")}
                  </ButtonComponent>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <ButtonComponent
                  id="history-clear-btn"
                  fontSize="small"
                  variant="outline"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  {t("history.clearAll")}
                </ButtonComponent>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4">
        <HistoryIcon className="w-7 h-7 text-brand-400" aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-[var(--text-primary)] mb-1">
        {t("history.empty")}
      </p>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">
        {t("history.emptyHint")}
      </p>
    </div>
  );
}

interface HistoryRowProps {
  entry: HistoryEntry;
  copied: boolean;
  onCopy: () => void;
  onDelete: () => void;
}

function HistoryRow({ entry, copied, onCopy, onDelete }: HistoryRowProps) {
  const { t } = useTranslation();
  const TypeIcon = entry.type === "audio" ? Music : Video;

  return (
    <li className="group flex items-start gap-3 p-3 rounded-xl border border-surface-border bg-surface-muted hover:border-brand-400/40 transition-colors">
      {/* Thumbnail / type icon */}
      <div className="flex-none w-16 h-10 rounded-md overflow-hidden bg-black/30 flex items-center justify-center">
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <TypeIcon className="w-5 h-5 text-brand-400" aria-hidden="true" />
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <TypeIcon
            className="w-3.5 h-3.5 text-brand-400 flex-none"
            aria-hidden="true"
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {entry.type === "audio" ? t("history.typeAudio") : t("history.typeVideo")}
          </span>
          <StatusBadge status={entry.status} />
        </div>
        <p
          className="text-sm font-semibold text-[var(--text-primary)] truncate"
          title={entry.title ?? entry.url}
        >
          {entry.title ?? entry.url}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[var(--text-secondary)]">
          {entry.channel && <span>{entry.channel}</span>}
          {entry.format && (
            <span>
              {t("history.format")}: <span className="font-mono">{entry.format}</span>
            </span>
          )}
          {entry.quality && (
            <span>
              {t("history.quality")}: <span className="font-mono">{entry.quality}</span>
            </span>
          )}
          <span title={new Date(entry.startedAt).toISOString()}>
            {formatRelative(entry.startedAt)}
          </span>
          {entry.fileSize !== null && entry.fileSize > 0 && (
            <span>{formatBytes(entry.fileSize)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-none flex items-center gap-1">
        <button
          onClick={onCopy}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-glassHover transition-colors"
          aria-label={t("history.copyLink")}
          title={copied ? t("history.linkCopied") : t("history.copyLink")}
        >
          {copied ? (
            <Check className="w-4 h-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        {entry.filePath && (
          <button
            onClick={() => window.electronAPI?.openPath?.(entry.filePath!)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-glassHover transition-colors"
            aria-label={t("history.openFolder")}
            title={t("history.openFolder")}
          >
            <FolderOpen className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label={t("history.delete")}
          title={t("history.delete")}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: HistoryEntry["status"] }) {
  const { t } = useTranslation();
  const styles =
    status === "downloaded"
      ? "bg-success/15 text-success border-success/30"
      : status === "failed"
        ? "bg-red-500/15 text-red-400 border-red-500/30"
        : "bg-amber-500/15 text-amber-400 border-amber-500/30";
  const label =
    status === "downloaded"
      ? t("history.statusDownloaded")
      : status === "failed"
        ? t("history.statusFailed")
        : t("history.statusInProgress");
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${styles}`}
    >
      {label}
    </span>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
