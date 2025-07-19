import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const languages = {
  en: "English",
  ja: "日本語",
} as const;

export type Locale = keyof typeof languages;
export const defaultLang: Locale = "en";

export const ui: Record<Locale, any> = {
  en: en,
  ja: ja,
} as const;
