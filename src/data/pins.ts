import type { Pin, PinId } from "@/domain";
import raw from "@content/pins.json";
import { CATEGORIES } from "./categories";

/** Source of truth: content/pins.json, filled by `npm run import:pins` (see docs/INGEST.md). */
const REAL = raw as unknown as Pin[];

/**
 * Sample mode = no real pins yet. The first real pin switches the whole site to real data,
 * so there is no launch-day cleanup step to forget.
 */
export const SAMPLE_MODE = REAL.length === 0;

const SAMPLE_COORDS: ReadonlyArray<readonly [number, number]> = [
  [0.45, 0.2], [0.52, 0.28], [0.58, 0.35], [0.42, 0.4], [0.5, 0.45],
  [0.56, 0.52], [0.47, 0.58], [0.4, 0.3], [0.6, 0.45], [0.53, 0.65],
  [0.46, 0.7], [0.58, 0.72], [0.38, 0.5], [0.62, 0.6], [0.5, 0.37],
];

const samplePins = (): Pin[] =>
  SAMPLE_COORDS.map((coord, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      id: `pin_sample_${n}`,
      slug: `sample-pin-${n}`,
      mapId: "map_main",
      categoryId: CATEGORIES[i % CATEGORIES.length].id,
      coord,
      source: "self",
      status: i % 3 === 0 ? "verified" : "unverified",
      spoilerLevel: i % 5 === 0 ? "mild" : "none",
      tags: ["sample"],
      addedAt: "2026-11-16",
      dataVersion: 1,
    };
  });

/** All pins including deprecated ones (needed so old progress keeps resolving). */
export const ALL_PINS: readonly Pin[] = SAMPLE_MODE ? samplePins() : REAL;
/** Pins that should be shown and counted. */
export const PINS: readonly Pin[] = ALL_PINS.filter((p) => p.status !== "deprecated");
export const PIN_BY_ID: ReadonlyMap<PinId, Pin> = new Map(ALL_PINS.map((p) => [p.id, p]));
