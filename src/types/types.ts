export interface Image {
  _id: string;
  path: string;
  title?: string;
  altText?: string;
}

export interface Reference {
  _model: string;
  _id: string;
}

export interface Achievement {
  category: string;
  year: number;
  title: string;
}

export interface CategorySet {
  category: string;
}

export interface HeroCarouselItem {
  heroCarouselImg: Image;
  heroCarouselTitle: string;
  heroCarouselText: string;
  heroCarouselUrl: string;
}

export interface Artist {
  _id: string;
  name: string;
  slug: string;
  image: Image;
  image_hover?: Image; // Optionnel car pas toujours présent
  carousel?: Image[]; // Plus typé qu'un tableau vide
  birthyear?: number;
  deathyear?: number;
  categorySet?: CategorySet[];
  type: string;
  level: string;
  statement: string;
  biography?: string;
  achievements?: Achievement[];
}

export interface Artwork {
  _id: string;
  title: string;
  slug: string;
  image: Image;
  image_hover?: Image; // Optionnel
  images_add?: Image[]; // Plus typé
  artist: Reference;
  year?: number;
  size?: string;
  price?: string;
  sold?: boolean;
  description?: string;
  medium?: string[];
  subject?: string[];
  limited_edition?: boolean;
  highlight?: boolean;
}

export interface Exhibition {
  _id: string;
  title: string;
  slug: string;
  image: Image;
  location?: string;
  start_date: string; // Changé de Date à string car souvent reçu comme string depuis l'API
  end_date: string;
  artist?: Reference;
  artworks?: Reference[]; // Plus cohérent avec le type Reference
  description?: string;
}

export interface HomePage {
  _id: string;
  heroCarousel?: HeroCarouselItem[];
  introTitle: string;
  introText: string;
  exclusiveTitle: string;
  exclusiveText: string;
  exclusiveImage: Image;
  exclusiveLogo: Image;
  carouselArtists?: Reference[];
  carouselArtworks?: Reference[];
  carouselClassicCollection?: Reference[];
  carouselJapaneseCollection?: Reference[];
}

// Types utilitaires pour les réponses API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
