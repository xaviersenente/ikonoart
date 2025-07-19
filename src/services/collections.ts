import { getCollection, getCollectionItem } from "./cockpit";
import type { Artist, Artwork, Exhibition, HomePage } from "../types/types";

/**
 * Récupère la liste des artistes avec tri par type
 * @param lang - Langue des résultats
 * @returns Un tableau d'artistes triés
 */
export async function getArtists(lang: string = "en"): Promise<Artist[]> {
  const artists = await getCollection<Artist>("artist", { locale: lang });

  const typeOrder = ["Represented", "Exhibited", "Exclusive", "Collection"];

  return artists.sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  );
}

/**
 * Récupère un artiste spécifique par son ID
 * @param artistId - ID de l'artiste
 * @param lang - Langue des résultats
 * @returns L'artiste ou null
 */
export async function getArtistById(
  artistId: string,
  lang: string = "en"
): Promise<Artist | null> {
  return getCollectionItem<Artist>("artist", artistId, { locale: lang });
}

/**
 * Récupère la liste des œuvres
 * @param lang - Langue des résultats
 * @returns Un tableau d'œuvres
 */
export async function getArtworks(lang: string = "en"): Promise<Artwork[]> {
  return getCollection<Artwork>("artwork", { locale: lang });
}

/**
 * Récupère les œuvres mises en avant
 * @param lang - Langue des résultats
 * @param limit - Nombre maximum d'œuvres à retourner
 * @returns Un tableau d'œuvres mises en avant
 */
export async function getHighlightedArtworks(
  lang: string = "en",
  limit: number = 20
): Promise<Artwork[]> {
  const allArtworks = await getCollection<Artwork>("artwork", {
    locale: lang,
    filter: { highlight: true },
    limit,
  });

  return allArtworks.filter((artwork) => artwork.highlight === true);
}

/**
 * Récupère une œuvre spécifique par son ID
 * @param artworkId - ID de l'œuvre
 * @param lang - Langue des résultats
 * @returns L'œuvre ou null
 */
export async function getArtworkById(
  artworkId: string,
  lang: string = "en"
): Promise<Artwork | null> {
  return getCollectionItem<Artwork>("artwork", artworkId, { locale: lang });
}

/**
 * Récupère toutes les œuvres d'un artiste avec séparation par type
 * @param artistId - ID de l'artiste
 * @param lang - Langue des résultats
 * @returns Un objet contenant les œuvres standards et édition limitée
 */
export async function getArtworksByArtist(
  artistId: string,
  lang: string = "en"
): Promise<{ standard: Artwork[]; limitedEdition: Artwork[] }> {
  const artworks = await getCollection<Artwork>("artwork", {
    locale: lang,
    filter: { "artist._id": artistId },
  });

  return {
    standard: artworks.filter((artwork) => !artwork.limited_edition),
    limitedEdition: artworks.filter(
      (artwork) => artwork.limited_edition === true
    ),
  };
}

/**
 * Regroupe les achievements d'un artiste par catégorie et année
 * @param artist - L'artiste
 * @returns Un objet regroupant les achievements
 */
export function groupAchievementsByCategoryAndYear(artist: Artist) {
  if (!artist?.achievements) return {};

  return artist.achievements.reduce(
    (acc, achievement) => {
      const { category, year } = achievement;

      if (!acc[category]) {
        acc[category] = {};
      }

      if (!acc[category][year]) {
        acc[category][year] = [];
      }

      acc[category][year].push(achievement);
      return acc;
    },
    {} as Record<string, Record<number, typeof artist.achievements>>
  );
}

/**
 * Récupère la liste des expositions
 * @param lang - Langue des résultats
 * @returns Un tableau d'expositions
 */
export async function getExhibitions(
  lang: string = "en"
): Promise<Exhibition[]> {
  return getCollection<Exhibition>("exhibition", { locale: lang });
}

/**
 * Récupère une exposition spécifique par son ID
 * @param exhibitionId - ID de l'exposition
 * @param lang - Langue des résultats
 * @returns L'exposition ou null
 */
export async function getExhibitionById(
  exhibitionId: string,
  lang: string = "en"
): Promise<Exhibition | null> {
  return getCollectionItem<Exhibition>("exhibition", exhibitionId, {
    locale: lang,
  });
}

/**
 * Récupère toutes les œuvres d'une exposition avec gestion optimisée des erreurs
 * @param exhibitionId - ID de l'exposition
 * @param lang - Langue des résultats
 * @returns Un tableau d'œuvres complètes de l'exposition
 */
export async function getArtworksByExhibition(
  exhibitionId: string,
  lang: string = "en"
): Promise<Artwork[]> {
  try {
    const exhibition = await getExhibitionById(exhibitionId, lang);

    if (!exhibition?.artworks || !Array.isArray(exhibition.artworks)) {
      return [];
    }

    // Récupération parallèle des œuvres pour optimiser les performances
    const artworkPromises = exhibition.artworks.map(async (artworkRef) => {
      if (artworkRef?._id) {
        return await getArtworkById(artworkRef._id, lang);
      }
      return null;
    });

    const artworks = await Promise.all(artworkPromises);
    return artworks.filter((artwork): artwork is Artwork => artwork !== null);
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des œuvres de l'exposition ${exhibitionId}:`,
      error
    );
    return [];
  }
}

/**
 * Récupère la liste des pages
 * @param lang - Langue des résultats
 * @returns Un tableau de pages
 */
export async function getPages(lang: string = "en"): Promise<any[]> {
  return getCollection("page", { locale: lang });
}

/**
 * Récupère une page spécifique par son ID
 * @param pageId - ID de la page
 * @param lang - Langue des résultats
 * @returns La page ou null
 */
export async function getPageById(
  pageId: string,
  lang: string = "en"
): Promise<any | null> {
  return getCollectionItem("page", pageId, { locale: lang });
}

/**
 * Récupère la page d'accueil (singleton)
 * @param lang - Langue des résultats
 * @returns La page d'accueil ou null
 */
export async function getHomePage(
  lang: string = "en"
): Promise<HomePage | null> {
  return getCollectionItem<HomePage>("homepage", "homepage", { locale: lang });
}
