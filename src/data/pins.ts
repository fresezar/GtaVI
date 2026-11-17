import type { Pin } from "@/domain";
import { CATEGORIES } from "./categories";

/**
 * SAMPLE DATA ONLY (tag "sample"). Replace with real pins from the ?dev=true tool.
 * Real pins are plain object literals in this array.
 */
const SAMPLE_COORDS: ReadonlyArray<readonly [number, number]> = [
  [0.45, 0.2], [0.52, 0.28], [0.58, 0.35], [0.42, 0.4], [0.5, 0.45],
  [0.56, 0.52], [0.47, 0.58], [0.4, 0.3], [0.6, 0.45], [0.53, 0.65],
  [0.46, 0.7], [0.58, 0.72], [0.38, 0.5], [0.62, 0.6], [0.5, 0.37],
];

const samplePins: Pin[] = SAMPLE_COORDS.map((coord, i) => {
  const n = String(i + 1).padStart(2, "0");
  const category = CATEGORIES[i % CATEGORIES.length];
  return {
    id: `pin_sample_${n}`,
    slug: `sample-pin-${n}`,
    mapId: "map_main",
    categoryId: category.id,
    coord,
    source: "self",
    status: i % 3 === 0 ? "verified" : "unverified",
    spoilerLevel: i % 5 === 0 ? "mild" : "none",
    tags: ["sample"],
    addedAt: "2026-11-16",
    dataVersion: 1,
  };
});

export const PINS: readonly Pin[] = [...samplePins];
