// src/utils/fieldTranslations.ts
import { useTranslations } from "../i18n/utils";
import type { Locale } from "../i18n/ui";

/**
 * Traduit une valeur de champ select
 * @param value - La valeur en anglais à traduire
 * @param fieldType - Le type de champ (medium, technique, subject, etc.)
 * @param locale - La locale courante
 * @returns La valeur traduite ou la valeur originale si pas de traduction
 */
export function translateFieldValue(
  value: string,
  fieldType: string,
  locale: Locale
): string {
  const t = useTranslations(locale);

  // Convertit la valeur en clé de traduction (lowercase, espaces -> underscores)
  const key = value.toLowerCase().replace(/\s+/g, "_");

  // Cherche la traduction
  const translatedValue = t(`fieldValues.${fieldType}.${key}`);

  // Retourne la traduction si elle existe, sinon la valeur originale
  return translatedValue !== `fieldValues.${fieldType}.${key}`
    ? translatedValue
    : value;
}

/**
 * Traduit un tableau de valeurs
 * @param values - Tableau de valeurs à traduire
 * @param fieldType - Le type de champ
 * @param locale - La locale courante
 * @returns Tableau de valeurs traduites
 */
export function translateFieldValues(
  values: string[],
  fieldType: string,
  locale: Locale
): string[] {
  return values.map((value) => translateFieldValue(value, fieldType, locale));
}

/**
 * Traduit et joint les valeurs avec un séparateur
 * @param values - Tableau de valeurs à traduire
 * @param fieldType - Le type de champ
 * @param locale - La locale courante
 * @param separator - Séparateur (par défaut ', ')
 * @returns String avec les valeurs traduites jointes
 */
export function translateAndJoinFieldValues(
  values: string[],
  fieldType: string,
  locale: Locale,
  separator: string = ", "
): string {
  return translateFieldValues(values, fieldType, locale).join(separator);
}
