// Accès au contenu de l'API Cockpit.
//
// Ce module est réservé au serveur : il importe le token via `astro:env/server`
// et ne doit jamais être importé depuis un îlot Vue. Les helpers d'images, qui
// n'ont pas besoin du token, vivent dans `cockpitImages.ts`.
import { COCKPIT_API_TOKEN } from "astro:env/server";
import {
  COCKPIT_API_URL,
  acquireSlot,
  releaseSlot,
  sleep,
} from "./cockpitImages";

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

const MAX_RETRIES = 4;
const RETRY_BASE_DELAY = 500; // ms, doublé à chaque tentative

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
