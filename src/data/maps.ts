import type { MapDef } from "@/domain";

/**
 * Leonida, in-game map look: GTADB "day" tileset (CC BY 4.0), zoom 0-5, served from /tiles/day
 * (`npm run tiles`, see scripts/fetch-tiles.mjs). At zoom 5 the full grid is 32768 px and 1 px = 1 m.
 *
 * Pin frame = this grid, 0..1. From in-game / GTADB world metres (X east, Y north, origin at the grid centre):
 *   frame = [(X + 16384) / 32768, (16384 - Y) / 32768]      (helper: src/lib/worldCoord.ts)
 *
 * A later map image with other borders or scale: run the dev calibrate tool (/map?dev=true) and paste its
 * `calibration` here; pins never need editing.
 */
const GRID = 32768;
const TILE = 256;
/** Tiles that exist at zoom 5 (GTADB tileSetRanges "day": x 17-83, y 17-103). */
const tileToFrame = (t: number) => (t * TILE) / GRID;

export const MAPS: readonly MapDef[] = [
  {
    id: "map_main",
    gameId: "gta6",
    slug: "main",
    imageSize: { width: GRID, height: GRID },
    source: { kind: "tiles", urlTemplate: "/tiles/day/{z}/{x}/{y}.jpg", tileSize: TILE, minNativeZoom: 0, maxNativeZoom: 5 },
    view: { min: [tileToFrame(17), tileToFrame(17)], max: [tileToFrame(84), tileToFrame(104)] },
    background: "#2F90B0",
    attribution: { name: "GTADB.org (CC BY 4.0) · © Rockstar Games", url: "https://map.gtadb.org" },
    revision: 2,
  },
];
