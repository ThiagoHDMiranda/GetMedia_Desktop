import { useCallback, useEffect, useState } from "react";

export const SUPPORTED_THEMES = ["dark", "light"] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];
export const DEFAULT_THEME: Theme = "dark";

/**
 * useTheme
 *
 * Persisted theme preference (mirrors the language-selector pattern in i18n).
 * On mount it reads the value that the pre-paint script in index.html already
 * applied to documentElement; switching updates the attribute + localStorage.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== "undefined") {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "light" || current === "dark") return current;
    }
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("theme")) as Theme | null;
    return saved && SUPPORTED_THEMES.includes(saved) ? saved : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
