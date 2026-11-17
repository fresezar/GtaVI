import type { GameId, MapId } from "./common";

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

export interface MapDef {
  id: MapId;
  gameId: GameId;
  slug: string;
  /** Full-resolution pixel size (at maxNativeZoom for tiles). Pins are normalized, so this may change freely. */
  imageSize: { width: number; height: number };
  source: MapSource;
  /** Bump after a game patch changes the map. */
  revision: number;
}
