import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "@/locales/pt-BR/translation.json";
import en from "@/locales/en/translation.json";

export const SUPPORTED_LANGUAGES = ["en", "pt-BR"] as const;
export const DEFAULT_LANGUAGE = "en";

/**
 * Initialize i18next with bundled translations.
 *
 * The language is read from localStorage first (set by the language
 * switcher in SettingsModal). If not found, falls back to the OS
 * locale (navigator.language) if it's a supported language, otherwise
 * defaults to en.
 */
function detectInitialLanguage(): string {
  // 1. Saved preference
  const saved = localStorage.getItem("language");
  if (saved && SUPPORTED_LANGUAGES.includes(saved as (typeof SUPPORTED_LANGUAGES)[number])) {
    return saved;
  }

  // 2. OS locale
  const osLocale = navigator.language;
  if (SUPPORTED_LANGUAGES.includes(osLocale as (typeof SUPPORTED_LANGUAGES)[number])) {
    return osLocale;
  }

  // 3. Check prefix (e.g. "pt" matches "pt-BR")
  const prefix = osLocale.split("-")[0];
  if (prefix === "pt") return "pt-BR";
  if (prefix === "en") return "en";

  // 4. Default
  return DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
  },
  lng: detectInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export default i18n;
