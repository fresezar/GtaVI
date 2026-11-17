import type { MapDef } from "@/domain";

/**
 * PLACEHOLDER map. To use real artwork:
 *  - single image:  source: { kind: "image", url: "/maps/main.webp" }
 *  - tiles (large): source: { kind: "tiles", urlTemplate: "/tiles/main/{z}/{x}/{y}.png", ... }
 * Pins are normalized (0..1), so swapping the image never moves them.
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
