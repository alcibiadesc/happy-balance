import { writable, derived } from "svelte/store";

// Import JSON translation files
import enTranslations from "../i18n/en.json";
import esTranslations from "../i18n/es.json";

// Store para el idioma actual
export const currentLanguage = writable<string>("en");

// Traducciones cargadas dinámicamente desde archivos JSON
const translations = {
  en: enTranslations,
  es: esTranslations,
};

// Store derivado para las traducciones actuales
export const t = derived(currentLanguage, ($currentLanguage) => {
  return (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any =
      translations[$currentLanguage as keyof typeof translations];

    for (const k of keys) {
      value = value?.[k];
    }

    let result = value || key;

    // Interpolate parameters if provided
    if (params && typeof result === "string") {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(
          new RegExp(`\\{${paramKey}\\}`, "g"),
          String(paramValue),
        );
      });
    }

    return result;
  };
});

// Función para cambiar idioma
export function setLanguage(lang: string) {
  currentLanguage.set(lang);
}
