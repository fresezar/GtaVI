import type { Coord, GameId, MapId } from "./common";

export type MapSource =
  | { kind: "image"; url: string }
  | {
      kind: "tiles";
      /** XYZ scheme, e.g. "/tiles/main/{z}/{x}/{y}.png" */
      urlTemplate: string;
      tileSize: number;
      minNativeZoom: number;
      maxNativeZoom: number;
    };

/**
 * One landmark seen in two places: `frame` = where pins store it (the coordinate frame of the
 * first real map), `image` = where it sits on THIS map image (normalized 0..1).
 */
export interface ControlPoint {
  label?: string;
  frame: Coord;
  image: Coord;
}

export interface MapDef {
  id: MapId;
  gameId: GameId;
  slug: string;
  /** Full-resolution pixel size (at maxNativeZoom for tiles). */
  imageSize: { width: number; height: number };
  source: MapSource;
  /**
   * Absent = this image IS the pin frame (identity).
   * Present (3+ points) = pins are fitted onto this image with an affine transform, so a new
   * map image with different borders/scale never moves pins. Produce it with the dev calibrate tool.
   */
  calibration?: { points: ControlPoint[] };
  /**
   * Part of the image worth showing (frame coords 0..1): initial fit, pan limit and tile requests.
   * Absent = the whole image. Tile sets that cover a big empty grid (open sea) set this to the land.
   */
  view?: { min: Coord; max: Coord };
  /** Fills the area outside the tiles (e.g. the sea colour), so edges and missing tiles don't show. */
  background?: string;
  /** Credit for community-made map art (required when we use someone else's map). */
  attribution?: { name: string; url?: string };
  /** Bump after a game patch changes the map. */
  revision: number;
}
