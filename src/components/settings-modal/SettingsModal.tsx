import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Globe, Sun, Moon, RefreshCw, Download, RotateCw } from "lucide-react";
import { DownloadFolder } from "@/components/download-folder/DownloadFolder";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useTheme, SUPPORTED_THEMES, type Theme } from "@/hooks/useTheme";
import type { UseUpdaterReturn } from "@/hooks/useUpdater";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  updater?: UseUpdaterReturn;
}

/**
 * SettingsModal
 *
 * A modal overlay (not a separate page) that shows app configuration
 * options. Opens when the user clicks the settings button in the
 * top-right corner and closes via the close button or backdrop click.
 *
 * Contains:
 * - Theme selector (dark / light, persisted in localStorage)
 * - Language selector (persisted in localStorage)
 * - Download destination folder picker
 * - Update checker (when running in Electron)
 */
export function SettingsModal({ isOpen, onClose, updater }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title")}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl animate-slide-up border border-surface-border bg-surface-card backdrop-blur-xl"
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {t("settings.title")}
          </h2>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-glassHover transition-colors"
            aria-label={t("settings.closeAria")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Theme selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <Sun className="w-4 h-4" />
              {t("settings.themeLabel")}
            </label>
            <div className="flex gap-2">
              {SUPPORTED_THEMES.map((th) => {
                const active = theme === th;
                const Icon = th === "dark" ? Moon : Sun;
                const label = th === "dark" ? t("settings.themeDark") : t("settings.themeLight");
                return (
                  <button
                    key={th}
                    id={`theme-${th}`}
                    onClick={() => handleThemeChange(th)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                      active
                        ? "bg-brand-500 border-brand-400 text-white shadow-sm shadow-brand-900/30"
                        : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-brand-400/40 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language selector */}
          <div className="space-y-2">
            <label
              htmlFor="language-select"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
            >
              <Globe className="w-4 h-4" />
              {t("settings.languageLabel")}
            </label>
            <div className="flex gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  id={`lang-${lang}`}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                    selectedLang === lang
                      ? "bg-brand-500 border-brand-400 text-white shadow-sm shadow-brand-900/30"
                      : "bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-brand-400/40 hover:text-[var(--text-primary)]"
                  }`}
                >
                  {lang === "pt-BR" ? "Português" : "English"}
                </button>
              ))}
            </div>
          </div>

          {/* Download destination */}
          <DownloadFolder />

          {/* Update checker — only in Electron */}
          {updater && (
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <Download className="w-4 h-4" />
                {t("update.initial")}
              </label>

              {updater.status === "idle" && (
                <button
                  id="update-check-btn"
                  onClick={() => updater.checkForUpdates()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 bg-surface-muted border-surface-border text-[var(--text-secondary)] hover:border-brand-400/40 hover:text-[var(--text-primary)]"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("update.check")}
                </button>
              )}

              {updater.status === "checking" && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("update.checking")}
                </div>
              )}

              {updater.status === "available" && (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("update.available", { version: updater.updateVersion ?? "" })}
                  </p>
                  <button
                    id="update-download-btn"
                    onClick={() => updater.downloadUpdate()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 border-brand-400 text-white shadow-sm shadow-brand-900/30 transition-all duration-150 hover:bg-brand-600"
                  >
                    <Download className="w-4 h-4" />
                    {t("update.download")}
                  </button>
                </div>
              )}

              {updater.status === "not-available" && (
                <p className="text-sm text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {t("update.notAvailable")}
                </p>
              )}

              {updater.status === "downloading" && (
                <div className="space-y-1.5">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("update.downloading", { progress: Math.round(updater.progress) })}
                  </p>
                  <div className="w-full h-1.5 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${updater.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {updater.status === "downloaded" && (
                <div className="space-y-3">
                  <p className="text-sm text-green-400">
                    {t("update.downloaded")}
                  </p>
                  <button
                    onClick={() => updater.quitAndInstall()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 border-brand-400 text-white shadow-sm shadow-brand-900/30 transition-all duration-150 hover:bg-brand-600"
                  >
                    <RotateCw className="w-4 h-4" />
                    {t("update.restart")}
                  </button>
                </div>
              )}

              {updater.status === "error" && (
                <p className="text-sm text-red-400">
                  {updater.errorMessage ?? t("update.failed")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
