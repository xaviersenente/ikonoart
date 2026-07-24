// Configuration de l'API Cockpit
export const COCKPIT_BASE_URL = "https://cockpit.ikono.art";
const COCKPIT_API_URL = `${COCKPIT_BASE_URL}/api`;

// Récupération sécurisée du token depuis les variables d'environnement
const COCKPIT_API_TOKEN =
  import.meta.env.COCKPIT_API_TOKEN ||
  "API-16d53b4cf6f170aa278382e9af9926d36281cee9";

// Cache en mémoire pour les URLs d'images
const imageUrlCache = new Map<string, string>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 heure

interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCacheWithTimestamp = new Map<string, CacheEntry>();

// Interface pour les options d'optimisation
interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  resize?: "thumbnail" | "bestFit" | "resize" | "fitToWidth" | "fitToHeight";
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
  progressive?: boolean;
}

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

// Plafond de requêtes simultanées vers Cockpit. Le build génère ~1000 pages
// et plusieurs d'entre elles lancent des rafales de requêtes parallèles
// (Promise.all) : sans plafond, l'API répond 429 et le build échoue.
const MAX_CONCURRENT_REQUESTS = 6;
const MAX_RETRIES = 4;
const RETRY_BASE_DELAY = 500; // ms, doublé à chaque tentative

let activeRequests = 0;
const pendingRequests: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  // Le slot est transmis directement par releaseSlot : pas de réincrément ici.
  await new Promise<void>((resolve) => pendingRequests.push(resolve));
}

function releaseSlot(): void {
  const next = pendingRequests.shift();
  if (next) {
    next();
  } else {
    activeRequests--;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Erreur HTTP renvoyée par Cockpit, porteuse du statut pour décider d'un retry.
 */
class CockpitHttpError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
    readonly retryAfter: string | null = null
  ) {
    super(`Erreur API Cockpit (${status}): ${statusText}`);
    this.name = "CockpitHttpError";
  }

  /** 429 et 5xx sont transitoires ; les autres 4xx ne s'amélioreront pas. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

/**
 * Calcule le délai avant nouvelle tentative : backoff exponentiel avec jitter,
 * ou en-tête Retry-After si l'API en fournit un plus long.
 */
function getRetryDelay(error: Error, attempt: number): number {
  const backoff = RETRY_BASE_DELAY * 2 ** attempt + Math.random() * 250;

  if (error instanceof CockpitHttpError && error.retryAfter) {
    const seconds = Number(error.retryAfter);
    if (!Number.isNaN(seconds)) {
      return Math.max(backoff, seconds * 1000);
    }
    const date = Date.parse(error.retryAfter);
    if (!Number.isNaN(date)) {
      return Math.max(backoff, date - Date.now());
    }
  }

  return backoff;
}

/**
 * Fonction générique pour effectuer des requêtes à l'API Cockpit avec gestion d'erreurs améliorée.
 * Réessaie automatiquement les erreurs transitoires (429, 5xx, timeout, réseau).
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

  let lastError: Error = new Error("Erreur inconnue lors de la requête API");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(getRetryDelay(lastError, attempt - 1));
    }

    await acquireSlot();

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

      if (!response.ok) {
        throw new CockpitHttpError(
          response.status,
          response.statusText,
          response.headers.get("retry-after")
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof CockpitHttpError) {
        if (!error.retryable) throw error;
        lastError = error;
      } else if (error instanceof Error) {
        lastError =
          error.name === "AbortError"
            ? new Error("Timeout: La requête a pris trop de temps")
            : error;
      }
    } finally {
      clearTimeout(timeoutId);
      releaseSlot();
    }
  }

  throw lastError;
}

// Cache des réponses de contenu. Les ~1000 pages générées repartagent très
// largement les mêmes requêtes (mêmes collections, mêmes items) : sans cache,
// chaque page refait l'appel réseau et sature l'API.
// En dev on garde un TTL court pour continuer à voir les changements Cockpit.
const CONTENT_CACHE_TTL = import.meta.env.DEV ? 5_000 : Infinity;

interface ContentCacheEntry {
  promise: Promise<any>;
  timestamp: number;
}

const contentCache = new Map<string, ContentCacheEntry>();

/**
 * Variante de fetchCockpit qui mutualise les requêtes identiques.
 * Le cache stocke la promesse, ce qui déduplique aussi les appels concurrents.
 */
function fetchCockpitCached<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const cached = contentCache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < CONTENT_CACHE_TTL) {
    return cached.promise as Promise<T>;
  }

  const promise = fetchCockpit<T>(endpoint, options).catch((error) => {
    // Un échec ne doit pas être mis en cache : la page suivante doit réessayer.
    contentCache.delete(endpoint);
    throw error;
  });

  contentCache.set(endpoint, { promise, timestamp: Date.now() });
  return promise;
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

    const data = await fetchCockpitCached<T[]>(
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

    const data = await fetchCockpitCached<T>(
      url.replace(`${COCKPIT_API_URL}/`, "")
    );
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

    const data = await fetchCockpitCached<T>(
      url.replace(`${COCKPIT_API_URL}/`, "")
    );
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
 * Récupère l'URL optimisée d'une image via l'API de Cockpit
 * @param imageId - ID de l'image dans Cockpit
 * @param options - Options de redimensionnement
 * @returns L'URL de l'image optimisée
 */
// export async function getOptimizedImage(
//   imageId: string,
//   options: {
//     width?: number;
//     height?: number;
//     resize?: "thumbnail" | "bestFit" | "resize" | "fitToWidth" | "fitToHeight";
//     quality?: number;
//     format?: "webp" | "jpeg" | "png";
//   } = {}
// ): Promise<string> {
//   const {
//     width = 800,
//     height = 600,
//     resize = "bestFit",
//     quality = 70,
//     format = "webp",
//   } = options;

//   const imageUrl = `${COCKPIT_API_URL}/assets/image/${imageId}?w=${width}&h=${height}&m=${resize}&q=${quality}&mime=${format}`;

//   try {
//     const response = await fetch(imageUrl);
//     if (response.ok) {
//       const optimizedUrl = await response.text(); // Cockpit retourne l'URL en texte brut
//       return optimizedUrl;
//     }
//   } catch (error) {
//     console.error(
//       "Erreur lors de la récupération de l'image optimisée:",
//       error
//     );
//   }

//   return imageUrl;
// }

/**
 * Fonction de cache intelligente avec expiration
 */
function getCachedUrl(cacheKey: string): string | null {
  const cached = imageCacheWithTimestamp.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }
  if (cached) {
    imageCacheWithTimestamp.delete(cacheKey); // Nettoie le cache expiré
  }
  return null;
}

function setCachedUrl(cacheKey: string, url: string): void {
  imageCacheWithTimestamp.set(cacheKey, {
    url,
    timestamp: Date.now(),
  });
}

/**
 * Détection du support des formats modernes
 */
function getSupportedFormat(preferredFormat: string): string {
  // En SSG, on privilégie WebP avec fallback
  if (preferredFormat === "avif") {
    return "webp"; // Fallback pour la compatibilité
  }
  return preferredFormat;
}

/**
 * Optimisation intelligente de la qualité selon le contexte
 */
function getOptimalQuality(width: number, quality: number): number {
  if (width <= 400) return Math.max(50, quality - 20); // Mobiles
  if (width <= 800) return Math.max(60, quality - 10); // Tablettes
  return quality; // Desktop
}

/**
 * Fonction principale d'optimisation d'images avec cache
 */
export async function getOptimizedImage(
  imageId: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    width = 800,
    height = 600,
    resize = "bestFit",
    quality = 70,
    format = "webp",
    progressive = true,
  } = options;

  // Optimisations automatiques
  const supportedFormat = getSupportedFormat(format);
  const optimalQuality = getOptimalQuality(width, quality);

  // Clé de cache unique
  const cacheKey = `${imageId}-${width}x${height}-${resize}-${optimalQuality}-${supportedFormat}`;

  // Vérification du cache
  const cachedUrl = getCachedUrl(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  // Construction de l'URL optimisée
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    m: resize,
    q: optimalQuality.toString(),
    mime: supportedFormat,
    ...(progressive && { progressive: "1" }),
  });

  const imageUrl = `${COCKPIT_API_URL}/assets/image/${imageId}?${params.toString()}`;

  // Même plafond de concurrence que les requêtes de contenu : les assets
  // tapent le même serveur et comptent dans le même quota.
  await acquireSlot();

  try {
    // Appel à l'API Cockpit avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain, */*",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      // Cockpit retourne l'URL optimisée en texte brut
      const optimizedUrl = await response.text();
      setCachedUrl(cacheKey, optimizedUrl);
      return optimizedUrl;
    } else {
      console.warn(`Image non trouvée (${response.status}): ${imageId}`);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn(`Timeout lors du chargement de l'image: ${imageId}`);
    } else {
      console.error(
        "Erreur lors de la récupération de l'image optimisée:",
        error
      );
    }
  } finally {
    releaseSlot();
  }

  // Fallback vers l'URL de base sans optimisation
  const fallbackUrl = `${COCKPIT_API_URL}/assets/image/${imageId}`;
  setCachedUrl(cacheKey, fallbackUrl);
  return fallbackUrl;
}

/**
 * Génération de srcset optimisé pour responsive images - Corrigé pour Cockpit
 */
export async function generateResponsiveSrcSet(
  imageId: string,
  baseOptions: ImageOptimizationOptions = {},
  breakpoints: number[] = [320, 480, 768, 1024, 1200]
): Promise<string> {
  const { width = 800, height = 600, resize, format, quality } = baseOptions;

  const srcsetPromises = breakpoints
    .filter((bp) => bp <= width * 1.5) // Évite les upscaling excessifs
    .map(async (bp) => {
      const scaledHeight = Math.round((height * bp) / width);

      try {
        const optimizedUrl = await getOptimizedImage(imageId, {
          ...baseOptions,
          width: bp,
          height: scaledHeight,
          quality: getOptimalQuality(bp, quality || 70),
        });
        return `${optimizedUrl} ${bp}w`;
      } catch (error) {
        console.warn(`Erreur génération srcset pour ${bp}w:`, error);
        return null;
      }
    });

  const srcsetResults = await Promise.all(srcsetPromises);
  const validSrcset = srcsetResults.filter(Boolean);

  return validSrcset.length > 0 ? validSrcset.join(", ") : "";
}

/**
 * Preload intelligent des images critiques
 */
export function preloadCriticalImages(
  imageIds: string[],
  options: ImageOptimizationOptions = {}
): void {
  if (typeof document === "undefined") return; // SSR safety

  imageIds.forEach(async (imageId) => {
    const url = await getOptimizedImage(imageId, {
      quality: 60, // Qualité réduite pour le preload
      ...options,
    });

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Nettoyage périodique du cache
 */
export function cleanupImageCache(): void {
  const now = Date.now();
  for (const [key, entry] of imageCacheWithTimestamp.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      imageCacheWithTimestamp.delete(key);
    }
  }
}

// Nettoyage automatique du cache toutes les 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupImageCache, 30 * 60 * 1000);
}
