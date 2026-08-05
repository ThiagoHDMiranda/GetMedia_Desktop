import { X, Info, Scale, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_INFO } from "@/lib/app-info";
import iconUrl from "@/assets/getmedia_icon_512x512.png";
import logoUrl from "@/assets/getmedia.png";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AboutModal
 *
 * A modal overlay that displays app metadata: name, version, author,
 * license, and links to the GitHub repository and yt-dlp. Mirrors the
 * SettingsModal layout pattern (backdrop + slide-up panel + close X).
 */
export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t("about.title")}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl animate-slide-up border border-surface-border bg-surface-card backdrop-blur-xl"
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
            <Info className="w-5 h-5 text-brand-400" />
            {t("about.title")}
          </h2>
          <button
            id="about-close-btn"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-glassHover transition-colors"
            aria-label={t("about.closeAria")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* App identity */}
          <div className="text-center space-y-1">
            <div className="w-full place-self-center flex items-center justify-center gap-2 mb-3">
              <img src={iconUrl} className="w-auto h-6" />
              <img src={logoUrl} className="w-auto h-6" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {t("about.version")} {APP_INFO.version}
            </p>
          </div>

          {/* Description */}
          {APP_INFO.description && (
            <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">
              {t("about.description")}
            </p>
          )}

          {/* Meta info grid */}
          <div className="grid grid-cols-1 gap-3">
            {/* Author */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-surface-muted">
              <span className="text-lg"><UserRound className="w-[18px] h-[18px] text-brand-400 flex-shrink-0"/></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t("about.author")}
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {APP_INFO.author}
                </p>
              </div>
            </div>

            {/* License */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-surface-muted">
              <Scale className="w-[18px] h-[18px] text-brand-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t("about.license")}
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {APP_INFO.license}
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2.5">
            {/* GitHub repo */}
            <a
              href="https://github.com/ThiagoHDMiranda/GetMedia_Desktop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-surface-muted hover:border-brand-400/40 hover:bg-glassHover transition-colors group"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[18px] h-[18px] text-[var(--text-secondary)] group-hover:text-brand-400 transition-colors flex-shrink-0"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
             </svg>
              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-brand-400 transition-colors">
                {t("about.repo")}
              </span>
              <span className="ml-auto text-[var(--text-secondary)] text-sm">↗</span>
            </a>

            {/* yt-dlp attribution */}
            <a
              href="https://github.com/yt-dlp/yt-dlp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-surface-muted hover:border-brand-400/40 hover:bg-glassHover transition-colors group"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[18px] h-[18px] text-[var(--text-secondary)] group-hover:text-brand-400 transition-colors flex-shrink-0"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
              </svg>
              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-brand-400 transition-colors">
                {t("about.poweredBy")}
              </span>
              <span className="ml-auto text-[var(--text-secondary)] text-sm">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
