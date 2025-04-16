// URL de l'API Cockpit et clé d'authentification

export const COCKPIT_BASE_URL = "http://localhost:8888/ikonoart";
const COCKPIT_API_URL = `${COCKPIT_BASE_URL}/api`;
const COCKPIT_API_TOKEN = "API-16d53b4cf6f170aa278382e9af9926d36281cee9"; // Remplace par ton token

/**
 * Fonction générique pour effectuer des requêtes à l'API Cockpit.
 * @param endpoint - L'URL de l'endpoint Cockpit (ex: "collections/get/articles").
 * @param options - Options supplémentaires pour la requête (ex: méthode, headers).
 * @returns Les données retournées par l'API en JSON.
 */
async function fetchCockpit(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${COCKPIT_API_URL}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur API Cockpit : ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les éléments d'une collection en fonction de la langue.
 * @param collectionName - Nom de la collection à récupérer.
 * @param lang - Langue des résultats (ex: "fr", "en", "ja_JP").
 * @returns Un tableau d'objets représentant les entrées de la collection.
 */
export async function getCollection(
  collectionName: string,
  lang: string = "en"
): Promise<any[]> {
  const data = await fetchCockpit(
    `content/items/${collectionName}?token=${COCKPIT_API_TOKEN}&locale=${lang}`
  );
  return data || []; // Retourne les entrées ou un tableau vide
}

/**
 * Récupère un élément spécifique d'une collection via son ID et sa langue.
 * @param collectionName - Nom de la collection.
 * @param itemId - ID de l'élément à récupérer.
 * @param lang - Langue des résultats.
 * @returns L'objet correspondant ou null s'il n'existe pas.
 */
export async function getCollectionItem(
  collectionName: string,
  itemId: string,
  lang: string = "en"
): Promise<any | null> {
  try {
    const data = await fetchCockpit(
      `content/item/${collectionName}/${itemId}?token=${COCKPIT_API_TOKEN}&locale=${lang}`
    );
    return data || null; // Retourne l'élément ou null si inexistant
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de l'élément ${itemId} de la collection ${collectionName} :`,
      error
    );
    return null;
  }
}

/**
 * Récupère l'URL optimisée d'une image via l'API de Cockpit.
 * @param imageId - ID de l'image dans Cockpit.
 * @param width - Largeur souhaitée pour l'image optimisée.
 * @returns L'URL de l'image optimisée ou l'URL par défaut si l'optimisation échoue.
 */
export async function getOptimizedImage(
  imageId: string,
  width: number,
  height: number,
  resize: string
): Promise<string> {
  const imageUrl = `${COCKPIT_API_URL}/assets/image/${imageId}?w=${width}&h=${height}&m=${resize}&q=70&mime=webp`;

  try {
    const response = await fetch(imageUrl);

    if (response.ok) {
      const optimizedUrl = await response.text(); // Cockpit retourne l'URL en texte brut
      return optimizedUrl;
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'image optimisée :",
      error
    );
  }

  return imageUrl; // Retourne l'URL par défaut si l'optimisation échoue
}
