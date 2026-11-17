import type { MapDef } from "@/domain";

/**
 * PLACEHOLDER map. To use the community map (see docs/INGEST.md, "Harita"):
 *  - single image:  source: { kind: "image", url: "/maps/main.webp" }, imageSize: its pixel size
 *  - tiles (large): source: { kind: "tiles", urlTemplate: "/tiles/main/{z}/{x}/{y}.png", ... }
 *  - attribution:   { name: "<map author>", url: "<their page>" }  (required for someone else's map)
 *
 * Pins are stored in the coordinate frame of the FIRST real map. When a later image has different
 * borders or scale, run the dev calibrate tool (/map?dev=true) and paste its `calibration` here:
 * pins are then fitted onto the new image and never need editing.
 */
export const MAPS: readonly MapDef[] = [
  {
    id: "map_main",
    gameId: "gta6",
    slug: "main",
    imageSize: { width: 4096, height: 3072 },
    source: { kind: "image", url: "/maps/placeholder.svg" },
    revision: 1,
  },
];
