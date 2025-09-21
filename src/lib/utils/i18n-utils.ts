import { get } from "svelte/store";
import { currentLanguage } from "../stores/i18n";

// Import JSON translation files directly
import enTranslations from "../i18n/en.json";
import esTranslations from "../i18n/es.json";

const translations = {
  en: enTranslations,
  es: esTranslations,
};

/**
 * Non-reactive translation function for use in TypeScript domain files
 * @param key Translation key (e.g., "validation.income_negative_amount")
 * @param params Optional parameters for interpolation
 * @returns Translated string
 */
export function getTranslation(
  key: string,
  params?: Record<string, string | number>
): string {
  const currentLang = get(currentLanguage) as keyof typeof translations;
  const keys = key.split(".");
  let value: any = translations[currentLang] || translations.en;

  for (const k of keys) {
    value = value?.[k];
  }

  let result = value || key;

  // Interpolate parameters if provided
  if (params && typeof result === "string") {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(
        new RegExp(`\\{${paramKey}\\}`, "g"),
        String(paramValue)
      );
    });
  }

  return result;
}

/**
 * Get translation with specific language (for cases where we need to override current language)
 * @param key Translation key
 * @param lang Language code (e.g., "en", "es")
 * @param params Optional parameters for interpolation
 * @returns Translated string
 */
export function getTranslationForLang(
  key: string,
  lang: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split(".");
  let value: any = translations[lang as keyof typeof translations] || translations.en;

  for (const k of keys) {
    value = value?.[k];
  }

  let result = value || key;

  // Interpolate parameters if provided
  if (params && typeof result === "string") {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(
        new RegExp(`\\{${paramKey}\\}`, "g"),
        String(paramValue)
      );
    });
  }

  return result;
}