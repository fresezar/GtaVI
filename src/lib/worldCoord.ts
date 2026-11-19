import type { Coord } from "@/domain";

/** Half the GTADB grid in metres: the grid is 32768 m wide, centred on the world origin. */
const HALF = 16384;
const SIZE = HALF * 2;

/** In-game / GTADB world metres (X east, Y north) -> pin frame (0..1 on the main map grid). */
export const worldToFrame = (x: number, y: number): Coord => [(x + HALF) / SIZE, (HALF - y) / SIZE];

/** Pin frame -> world metres. */
export const frameToWorld = (c: Coord): [number, number] => [c[0] * SIZE - HALF, HALF - c[1] * SIZE];
