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
  /**
   * Missing = found but not placed yet (no map at launch, or the spot is unknown). The pin still has
   * its page, checklist row and progress; the map skips it until a coordinate is added via its id.
   */
  coord?: Coord;
  source: PinSource;
  credit?: Credit;
  region?: string;
  media?: MediaRef[];
  tags?: string[];
  relatedIds?: EntityRef[];
}

/** A pin that has a map position. */
export type PlacedPin = Pin & { coord: Coord };
export const isPlaced = (p: Pin): p is PlacedPin => Array.isArray(p.coord);
