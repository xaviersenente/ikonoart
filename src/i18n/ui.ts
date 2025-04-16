import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const languages = {
  en: "English",
  ja: "日本語",
} as const; // `as const` empêche toute modification des valeurs

export type Locale = keyof typeof languages; // "en" | "ja"

export const defaultLang: Locale = "en"; // Typé pour éviter des erreurs

// On utilise une importation dynamique des traductions
export const ui: Record<Locale, Record<string, Record<string, string>>> = {
  en: en,
  ja: ja,
} as const; // Assure l'immuabilité de l'objet
