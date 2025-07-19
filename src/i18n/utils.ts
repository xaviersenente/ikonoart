// i18n/utils.ts - Utilitaires de traduction centralisés
import { ui, defaultLang, languages } from "./ui";
import type { Locale } from "./ui";

/**
 * Fonction de traduction principale
 */
export function useTranslations(locale: Locale) {
  return function t(key: string): string {
    const keys = key.split(".");
    let value: any = ui[locale] || ui[defaultLang];

    for (const k of keys) {
      value = value?.[k];
    }

    // Fallback vers la langue par défaut si la traduction n'existe pas
    if (!value && locale !== defaultLang) {
      let fallbackValue: any = ui[defaultLang];
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
      }
      return fallbackValue || key;
    }

    return value || key;
  };
}

/**
 * Hook pour récupérer les métadonnées de page traduites
 */
export function usePageMeta(locale: Locale, pageKey: string) {
  const t = useTranslations(locale);
  return {
    title: t(`${pageKey}.title`),
    description: t(`${pageKey}.description`),
  };
}

/**
 * Génère les chemins statiques pour toutes les langues
 */
export function generateI18nPaths() {
  return Object.keys(languages).map((lang) => ({ params: { lang } }));
}

/**
 * Récupère la locale courante avec fallback
 */
export function getCurrentLocale(astroCurrentLocale?: string): Locale {
  return (astroCurrentLocale || defaultLang) as Locale;
}
