// Helpers d'images Cockpit.
//
// Ce module est volontairement séparé de `cockpit.ts` : il ne touche jamais au
// token d'API et peut donc être importé depuis les îlots Vue, qui sont bundlés
// pour le navigateur. `cockpit.ts` importe `astro:env/server` et ne peut pas
// l'être.

export const COCKPIT_BASE_URL = "https://cockpit.ikono.art";
export const COCKPIT_API_URL = `${COCKPIT_BASE_URL}/api`;

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
 * Construit l'URL d'une image Cockpit redimensionnée.
 *
 * Le paramètre `o=1` fait servir l'image binaire directement, au lieu de
 * renvoyer en texte l'URL d'une vignette dans /storage/tmp/. La fonction
 * n'a donc plus aucun appel réseau à faire : elle assemble une URL.
 *
 * C'est ce qui corrige les images cassées. L'ancienne version résolvait
 * l'URL par un fetch au build, sans retry et avec un timeout de 5 s ; au
 * moindre aléa réseau elle retombait sur `/assets/image/<id>` sans
 * paramètres, une URL qui répond 400. Un échec passager gravait donc une
 * image cassée dans le HTML.
 *
 * Cockpit répond avec `cache-control: public, max-age=2592000, immutable`
 * et un ETag, et met la vignette en cache de son côté.
 */
export function getOptimizedImage(
  imageId: string,
  options: ImageOptimizationOptions = {}
): string {
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

  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    m: resize,
    q: optimalQuality.toString(),
    mime: supportedFormat,
    ...(progressive && { progressive: "1" }),
    o: "1",
  });

  return `${COCKPIT_API_URL}/assets/image/${imageId}?${params.toString()}`;
}

/**
 * Construit un srcset à partir d'une liste de largeurs.
 */
export function buildSrcSet(
  imageId: string,
  widths: number[],
  baseOptions: ImageOptimizationOptions = {}
): string {
  const { width = 800, height = 600, quality } = baseOptions;

  return widths
    .map((bp) => {
      const scaledHeight = Math.round((height * bp) / width);
      const url = getOptimizedImage(imageId, {
        ...baseOptions,
        width: bp,
        height: scaledHeight,
        quality: getOptimalQuality(bp, quality || 70),
      });
      return `${url} ${bp}w`;
    })
    .join(", ");
}
