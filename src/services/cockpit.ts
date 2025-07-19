// Configuration de l'API Cockpit
export const COCKPIT_BASE_URL = "https://ikonoart.xaviersenente.fr";
const COCKPIT_API_URL = `${COCKPIT_BASE_URL}/api`;

// Récupération sécurisée du token depuis les variables d'environnement
const COCKPIT_API_TOKEN =
  import.meta.env.COCKPIT_API_TOKEN ||
  "API-16d53b4cf6f170aa278382e9af9926d36281cee9";

// Interface pour les options de requête
interface FetchOptions extends RequestInit {
  timeout?: number;
}

// Interface pour les paramètres de collection
interface CollectionParams {
  locale?: string;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, any>;
  populate?: number;
}

/**
 * Fonction générique pour effectuer des requêtes à l'API Cockpit avec gestion d'erreurs améliorée.
 * @param endpoint - L'URL de l'endpoint Cockpit
 * @param options - Options pour la requête
 * @returns Les données retournées par l'API
 */
async function fetchCockpit<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${COCKPIT_API_URL}/${endpoint}`;
  const timeout = options.timeout || 10000; // 10 secondes par défaut

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Erreur API Cockpit (${response.status}): ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Timeout: La requête a pris trop de temps");
      }
      throw error;
    }

    throw new Error("Erreur inconnue lors de la requête API");
  }
}

/**
 * Construit l'URL avec les paramètres de requête
 * @param endpoint - L'endpoint de base
 * @param params - Les paramètres à ajouter
 * @returns L'URL complète avec les paramètres
 */
function buildUrl(endpoint: string, params: CollectionParams = {}): string {
  const url = new URL(`${COCKPIT_API_URL}/${endpoint}`);

  // Ajouter le token
  url.searchParams.append("token", COCKPIT_API_TOKEN);

  // Ajouter les autres paramètres
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        url.searchParams.append(key, JSON.stringify(value));
      } else {
        url.searchParams.append(key, value.toString());
      }
    }
  });

  return url.toString();
}

/**
 * Récupère les éléments d'une collection avec paramètres optionnels
 * @param collectionName - Nom de la collection
 * @param params - Paramètres de la requête
 * @returns Un tableau d'objets de la collection
 */
export async function getCollection<T = any>(
  collectionName: string,
  params: CollectionParams = {}
): Promise<T[]> {
  try {
    const url = buildUrl(`content/items/${collectionName}`, {
      locale: "en",
      ...params,
    });

    const data = await fetchCockpit<T[]>(
      url.replace(`${COCKPIT_API_URL}/`, "")
    );
    return data || [];
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de la collection ${collectionName}:`,
      error
    );
    return [];
  }
}

/**
 * Récupère un élément spécifique d'une collection via son ID
 * @param collectionName - Nom de la collection
 * @param itemId - ID de l'élément
 * @param params - Paramètres de la requête
 * @returns L'objet correspondant ou null
 */
export async function getCollectionItem<T = any>(
  collectionName: string,
  itemId: string,
  params: CollectionParams = {}
): Promise<T | null> {
  try {
    const url = buildUrl(`content/item/${collectionName}/${itemId}`, {
      locale: "en",
      ...params,
    });

    const data = await fetchCockpit<T>(url.replace(`${COCKPIT_API_URL}/`, ""));
    return data || null;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de l'élément ${itemId} de la collection ${collectionName}:`,
      error
    );
    return null;
  }
}

/**
 * Récupère un singleton avec paramètres optionnels
 * @param singletonName - Nom du singleton
 * @param options - Options supplémentaires (ex: { populate: 1 })
 * @param params - Paramètres de la requête
 * @returns L'objet singleton ou null
 */
export async function getSingleton<T = any>(
  singletonName: string,
  params: CollectionParams = {}
  //options: { populate?: number } = {}
): Promise<T | null> {
  try {
    const url = buildUrl(`content/item/${singletonName}`, {
      locale: "en",
      ...params,
    });

    const data = await fetchCockpit<T>(url.replace(`${COCKPIT_API_URL}/`, ""));
    return data || null;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération du singleton ${singletonName}:`,
      error
    );
    return null;
  }
}

/**
 * Récupère un singleton en fonction de la langue.
 * @param singletonName - Nom du singleton à récupérer.
 * @param lang - Langue des résultats (ex: "fr", "en", "ja_JP").
 * @returns L'objet singleton ou null s'il n'existe pas.
 */
// export async function getSingleton(
//   singletonName: string,
//   lang: string = "en",
//   options: { populate?: number } = {}
// ): Promise<any | null> {
//   try {
//     // Construction des paramètres de requête
//     const params = new URLSearchParams({
//       token: COCKPIT_API_TOKEN,
//       locale: lang,
//     });

//     // Ajout du paramètre populate si spécifié
//     if (options.populate) {
//       params.append("populate", options.populate.toString());
//     }

//     const data = await fetchCockpit(
//       `content/item/${singletonName}?${params.toString()}`
//     );
//     return data || null; // Retourne le singleton ou null si inexistant
//   } catch (error) {
//     console.error(
//       `Erreur lors de la récupération du singleton ${singletonName} :`,
//       error
//     );
//     return null;
//   }
// }

/**
 * Récupère l'URL optimisée d'une image via l'API de Cockpit.
 * @param imageId - ID de l'image dans Cockpit.
 * @param width - Largeur souhaitée pour l'image optimisée.
 * @returns L'URL de l'image optimisée ou l'URL par défaut si l'optimisation échoue.
 */
// export async function getOptimizedImage(
//   imageId: string,
//   width: number,
//   height: number,
//   resize: string
// ): Promise<string> {
//   const imageUrl = `${COCKPIT_API_URL}/assets/image/${imageId}?w=${width}&h=${height}&m=${resize}&q=70&mime=webp`;

//   try {
//     const response = await fetch(imageUrl);

//     if (response.ok) {
//       const optimizedUrl = await response.text(); // Cockpit retourne l'URL en texte brut
//       return optimizedUrl;
//     }
//   } catch (error) {
//     console.error(
//       "Erreur lors de la récupération de l'image optimisée :",
//       error
//     );
//   }

//   return imageUrl; // Retourne l'URL par défaut si l'optimisation échoue
// }

/**
 * Récupère l'URL optimisée d'une image via l'API de Cockpit
 * @param imageId - ID de l'image dans Cockpit
 * @param options - Options de redimensionnement
 * @returns L'URL de l'image optimisée
 */
export async function getOptimizedImage(
  imageId: string,
  options: {
    width?: number;
    height?: number;
    resize?: "thumbnail" | "bestFit" | "resize" | "fitToWidth" | "fitToHeight";
    quality?: number;
    format?: "webp" | "jpeg" | "png";
  } = {}
): Promise<string> {
  const {
    width = 800,
    height = 600,
    resize = "bestFit",
    quality = 70,
    format = "webp",
  } = options;

  const imageUrl = `${COCKPIT_API_URL}/assets/image/${imageId}?w=${width}&h=${height}&m=${resize}&q=${quality}&mime=${format}`;

  try {
    const response = await fetch(imageUrl);
    if (response.ok) {
      const optimizedUrl = await response.text(); // Cockpit retourne l'URL en texte brut
      return optimizedUrl;
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'image optimisée:",
      error
    );
  }

  return imageUrl;
}
