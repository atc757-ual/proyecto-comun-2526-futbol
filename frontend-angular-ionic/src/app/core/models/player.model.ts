export interface Player {
  _id?: string;
  name: string;
  age?: number;
  birth_date?: string;
  birth_place?: string;
  birth_country?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  number?: number;
  position: string;
  side?: string; // Pie hábil
  image_url?: string;
  team: string;
  secondary_team?: string;
  league?: string;
  user_id: string; // Obligatorio
  userId?: string; // Opcional para backend de Java
  external_id?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
  comments?: any[];
  status?: boolean;
  fullname?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
  summary?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  images?: {
    thumb?: string;
    poster?: string;
    cutout?: string;
    cartoon?: string;
    banner?: string;
    render?: string;
  };
  tsdb_ids?: {
    player_id?: string;
    team_id?: string;
    team_id2?: string;
    league_id?: string;
    transfermarkt_id?: string;
    espn_id?: string;
    wikidata_id?: string;
  };
  is_manual?: boolean;
  is_favorite?: boolean;
  isFavorite?: boolean;
  is_featured?: boolean;
  isFeatured?: boolean;
}
