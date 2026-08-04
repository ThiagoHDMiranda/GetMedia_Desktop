import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { X } from "lucide-react";

interface ToastNotificationProps {
  type: "errorType" | "warnType" | "successType";
  message: string;
  clearUseState: () => void;
}

const TOAST_CONFIG = {
  errorType: {
    titleKey: "toast.error",
    bg: "bg-red-500/15 border-red-500/30",
    dot: "bg-red-400",
    text: "text-red-400",
    icon: "✕",
  },
  warnType: {
    titleKey: "toast.warn",
    bg: "bg-amber-500/15 border-amber-500/30",
    dot: "bg-amber-400",
    text: "text-amber-400",
    icon: "⚠",
  },
  successType: {
    titleKey: "toast.success",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    icon: "✓",
  },
} as const;

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  message,
  clearUseState,
}) => {
  const { t } = useTranslation();
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const cfg = TOAST_CONFIG[type];

  const waitAndClear = useDebounce(clearUseState, 400);

  const close = () => {
    setVisible(false);
    waitAndClear();
  };

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 80);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(clearUseState, 400);
    }, 5000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed z-50 top-4 flex w-full justify-center items-center self-center">
      <div
      ref={toastRef}
      className={`
         backdrop-blur-2xl z-50 flex items-start gap-3 p-4 pl-8 rounded-xl border
         max-w-sm shadow-2xl
        ${cfg.bg}
        transition-all duration-400
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"}
      `}
      role="alert"
      aria-live="polite"
    >
      <span className={`absolute top-2 left-2 flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${cfg.text}`}>
          {t(cfg.titleKey)}

        </p>
        <p className="text-[var(--text-secondary)] text-sm mt-0.5 break-words">{message}</p>
      </div>

      <button
        onClick={close}
        className="absolute top-2 right-2 flex-shrink-0 ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none"
        aria-label={t("toast.close")}
      >
        <X className="w-4 h-4 text-center"/>
      </button>
    </div>
    </div>
  );
};
