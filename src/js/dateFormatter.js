/**
 * Formate une plage de dates au format "13 June — 2 August 2025"
 * @param {string|Date} dateDebut - Date de début
 * @param {string|Date} dateFin - Date de fin
 * @param {string} locale - Locale pour le formatage (défaut: 'en-GB')
 * @returns {string} - Plage de dates formatée
 */
export function formatDateRange(dateDebut, dateFin, locale = "en-GB") {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  // Vérifier si les dates sont valides
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return "";
  }

  const sameYear = debut.getFullYear() === fin.getFullYear();

  const debutOptions = { day: "numeric", month: "long" };
  const finOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  // Ajouter l'année à la date de début si les années sont différentes
  if (!sameYear) {
    debutOptions.year = "numeric";
  }

  const debutFormatted = debut.toLocaleDateString(locale, debutOptions);
  const finFormatted = fin.toLocaleDateString(locale, finOptions);

  return `${debutFormatted} — ${finFormatted}`;
}

/**
 * Formate une date unique au format "13 June 2025"
 * @param {string|Date} date - Date à formater
 * @param {string} locale - Locale pour le formatage (défaut: 'en-GB')
 * @returns {string} - Date formatée
 */
export function formatSingleDate(date, locale = "en-GB") {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return dateObj.toLocaleDateString(locale, options);
}
