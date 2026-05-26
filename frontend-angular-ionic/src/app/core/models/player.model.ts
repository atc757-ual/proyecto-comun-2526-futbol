/**
 * Modelo unificado de jugador para Node.js (MongoDB/Express) y Java (Spring Boot) backends.
 *
 * Campos duplicados: Node usa snake_case; Java usa camelCase. El mapper en
 * java-player.service.ts sincroniza ambas variantes al leer/escribir.
 * Canonical: snake_case. Las variantes camelCase son sólo para compatibilidad con Java.
 */
export interface Player {
  // --- Identificadores ---
  _id?: string;
  external_id?: number;

  // --- Datos personales ---
  name: string;
  fullname?: string;
  age?: number;
  birth_date?: string;
  birth_place?: string;
  birth_country?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  summary?: string;

  // --- Datos deportivos ---
  number?: number;
  position: string;
  side?: string;
  team: string;
  secondary_team?: string;
  league?: string;
  status?: boolean;

  // --- Imágenes ---
  image_url?: string;
  photo?: string;        // Java backend field (equivale a image_url)
  images?: {
    thumb?: string;
    poster?: string;
    cutout?: string;
    cartoon?: string;
    banner?: string;
    render?: string;
  };

  // --- Propietario ---
  user_id: string;       // Node backend (canonical)
  userId?: string;       // Java backend (sincronizado via mapper)

  // --- Ubicación ---
  location?: {
    type: string;
    coordinates: number[];
  };

  // --- Relaciones ---
  comments?: import('./comment.model').Comment[];
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
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

  // --- Flags ---
  is_manual?: boolean;
  is_favorite?: boolean;   // Node canonical / Java normalizado via mapper
  isFavorite?: boolean;    // Java API field (sincronizado via mapper)
  is_featured?: boolean;   // Node canonical / Java normalizado via mapper
  isFeatured?: boolean;    // Java API field (sincronizado via mapper)

  // --- Auditoría ---
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
}
