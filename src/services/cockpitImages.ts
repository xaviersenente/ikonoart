// Helpers d'images Cockpit.
//
// Ce module est volontairement séparé de `cockpit.ts` : il ne touche jamais au
// token d'API et peut donc être importé depuis les îlots Vue, qui sont bundlés
// pour le navigateur. `cockpit.ts` importe `astro:env/server` et ne peut pas
// l'être.

export const COCKPIT_BASE_URL = "https://cockpit.ikono.art";
export const COCKPIT_API_URL = `${COCKPIT_BASE_URL}/api`;

// Cache en mémoire pour les URLs d'images
const CACHE_DURATION = 1000 * 60 * 60; // 1 heure

interface CacheEntry {
  url: string;
  timestamp: number;
}

const imageCacheWithTimestamp = new Map<string, CacheEntry>();

// Interface pour les options d'optimisation
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  resize?: "thumbnail" | "bestFit" | "resize" | "fitToWidth" | "fitToHeight";
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
  progressive?: boolean;
}

// Plafond de requêtes simultanées vers Cockpit, partagé avec les requêtes de
// contenu de `cockpit.ts` : les assets tapent le même serveur et comptent dans
// le même quota. Le build génère ~1000 pages et plusieurs d'entre elles lancent
// des rafales parallèles (Promise.all) : sans plafond, l'API répond 429.
const MAX_CONCURRENT_REQUESTS = 6;

let activeRequests = 0;
const pendingRequests: Array<() => void> = [];

export async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  // Le slot est transmis directement par releaseSlot : pas de réincrément ici.
  await new Promise<void>((resolve) => pendingRequests.push(resolve));
}

export function releaseSlot(): void {
  const next = pendingRequests.shift();
  if (next) {
    next();
  } else {
    activeRequests--;
  }
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
  const { width = 800, height = 600, quality } = baseOptions;

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
