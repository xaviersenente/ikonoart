import { getCollection, getCollectionItem } from "./cockpit";
import type { Artist, Artwork, Exhibition } from "../types/types";

/**
 * Récupère la liste des artistes depuis Cockpit en fonction de la langue.
 * @param lang - Langue des résultats (ex: "fr", "en", "ja_JP").
 * @returns Un tableau d'artistes sous forme d'objets typés.
 */
export async function getArtists(lang: string = "en"): Promise<Artist[]> {
  return getCollection("artist", lang) as Promise<Artist[]>;
}

/**
 * Récupère un artiste spécifique par son ID et sa langue.
 * @param artistId - ID de l'artiste à récupérer.
 * @param lang - Langue des résultats.
 * @returns L'objet artiste ou null s'il n'existe pas.
 */
export async function getArtistById(
  artistId: string,
  lang: string = "en"
): Promise<Artist | null> {
  return getCollectionItem("artist", artistId, lang) as Promise<Artist | null>;
}

/**
 * Récupère la liste des œuvres depuis Cockpit en fonction de la langue.
 * @param lang - Langue des résultats.
 * @returns Un tableau d'œuvres sous forme d'objets typés.
 */
export async function getArtworks(lang: string = "en"): Promise<Artwork[]> {
  return getCollection("artwork", lang) as Promise<Artwork[]>;
}

/**
 * Récupère la liste des œuvres mises en avant depuis Cockpit en fonction de la langue.
 * @param lang - Langue des résultats.
 * @returns Un tableau d'œuvres mises en avant (max 20) sous forme d'objets typés.
 */
export async function getHighlightedArtworks(
  lang: string = "en"
): Promise<Artwork[]> {
  const allArtworks = (await getCollection("artwork", lang)) as Artwork[];

  return allArtworks
    .filter((artwork) => artwork.highlight === true)
    .slice(0, 20);
}

/**
 * Récupère une œuvre spécifique par son ID et sa langue.
 * @param artworkId - ID de l'œuvre à récupérer.
 * @param lang - Langue des résultats.
 * @returns L'objet œuvre ou null s'il n'existe pas.
 */
export async function getArtworkById(
  artworkId: string,
  lang: string = "en"
): Promise<Artwork | null> {
  return getCollectionItem(
    "artwork",
    artworkId,
    lang
  ) as Promise<Artwork | null>;
}

/**
 * Récupère toutes les œuvres d'un artiste spécifique en fonction de la langue et les sépare par type.
 * @param artistId - ID de l'artiste.
 * @param lang - Langue des résultats.
 * @returns Un objet contenant deux tableaux d'œuvres (standards et édition limitée).
 */
export async function getArtworksByArtist(
  artistId: string,
  lang: string = "en"
): Promise<{ standard: Artwork[]; limitedEdition: Artwork[] }> {
  const artworks = (await getCollection("artwork", lang)) as Artwork[];
  const artistArtworks = artworks.filter(
    (artwork) => artwork.artist?._id === artistId
  );

  return {
    standard: artistArtworks.filter((artwork) => !artwork.limited_edition),
    limitedEdition: artistArtworks.filter(
      (artwork) => artwork.limited_edition === true
    ),
  };
}

/**
 * Regroupe les achievements d'un artiste par année et par catégorie.
 * @param artist L'artiste dont les achievements doivent être regroupés.
 * @returns Un objet regroupant les achievements par année et catégorie.
 */
export function groupAchievementsByCategoryAndYear(artist: Artist) {
  if (!artist?.achievements) return {};

  // Regrouper d'abord par catégorie
  const groupedByCategory = artist.achievements.reduce(
    (acc, achievement) => {
      const { category, year } = achievement;
      // Créer une entrée pour la catégorie si elle n'existe pas encore
      if (!acc[category]) {
        acc[category] = {};
      }
      // Créer une entrée pour l'année si elle n'existe pas encore dans la catégorie
      if (!acc[category][year]) {
        acc[category][year] = [];
      }
      // Ajouter l'achievement dans le groupe par année et catégorie
      acc[category][year].push(achievement);

      return acc;
    },
    {} as Record<
      string,
      Record<number, { category: string; year: number; title: string }[]>
    >
  );

  return groupedByCategory;
}

/**
 * Récupère la liste des expoisitions depuis Cockpit en fonction de la langue.
 * @param lang - Langue des résultats (ex: "fr", "en", "ja_JP").
 * @returns Un tableau d'expositions sous forme d'objets typés.
 */
export async function getExhibitions(
  lang: string = "en"
): Promise<Exhibition[]> {
  return getCollection("exhibition", lang) as Promise<Exhibition[]>;
}

/**
 * Récupère un artiste spécifique par son ID et sa langue.
 * @param artistId - ID de l'artiste à récupérer.
 * @param lang - Langue des résultats.
 * @returns L'objet artiste ou null s'il n'existe pas.
 */
export async function getExhibitionById(
  exhibitionId: string,
  lang: string = "en"
): Promise<Exhibition | null> {
  return getCollectionItem(
    "exhibition",
    exhibitionId,
    lang
  ) as Promise<Exhibition | null>;
}
