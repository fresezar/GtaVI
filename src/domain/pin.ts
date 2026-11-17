import type {
  CategoryId,
  ContentMeta,
  Coord,
  Credit,
  EntityRef,
  MapId,
  MediaRef,
  PinId,
} from "./common";

export type PinSource = "stream" | "community" | "self" | "datamine" | "official";

/** Text lives in i18n: `pin.<id>.title`, `pin.<id>.description`. */
export interface Pin extends ContentMeta {
  /** Immutable. User progress is keyed on this. */
  id: PinId;
  /** URL name; may change (old slugs must redirect). */
  slug: string;
  mapId: MapId;
  categoryId: CategoryId;
  coord: Coord;
  source: PinSource;
  credit?: Credit;
  region?: string;
  media?: MediaRef[];
  tags?: string[];
  relatedIds?: EntityRef[];
}
