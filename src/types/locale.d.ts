import { languages } from "../i18n/ui"; // Importation dynamique des langues

export type Locale = keyof typeof languages; // "en" | "ja" | autres langues que tu ajouterais

declare global {
  interface Astro {
    currentLocale: Locale; // currentLocale peut être n'importe quelle clé de l'objet `languages`
  }
}
