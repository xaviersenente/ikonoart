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

export interface Artist {
  _id: string;
  name: string;
  slug: string;
  image: Image;
  main_artwork: Image;
  carousel?: [];
  birthyear?: number;
  deathyear?: number;
  categorySet?: {
    category: string;
  }[];
  type: string;
  level: string;
  statement: string;
  biography?: string;
  achievements?: {
    category: string;
    year: number;
    title: string;
  }[];
}

export interface Artwork {
  _id: string;
  title: string;
  slug: string;
  image: Image;
  image_hover: Image;
  artist: Reference;
  year?: number;
  size?: string;
  price?: string;
  description?: string;
  medium?: string;
  subject?: string;
  limited_edition?: boolean;
}

export interface Exhibition {
  _id: string;
  title: string;
  slug: string;
  image: Image;
  location?: string;
  start_date: Date;
  end_date: Date;
  artist?: Reference;
  description?: string;
}
