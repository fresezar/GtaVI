import type { Pin } from "@/domain";
import { PINS } from "./pins";

/**
 * Points per contribution (shown on the Community page). "live" = counted today; "soon" = needs sign-in (phase 2).
 * Only the first to send a spot earns its points: duplicates are merged in moderation (/admin flags spots nearby).
 */
export const POINTS = [
  { id: "find", points: 10, live: true },
  { id: "verified", points: 5, live: true },
  { id: "featured", points: 25, live: true },
  { id: "fix", points: 5, live: false },
  { id: "confirm", points: 2, live: false },
] as const;
const PTS = Object.fromEntries(POINTS.map((p) => [p.id, p.points])) as Record<(typeof POINTS)[number]["id"], number>;

/** Pin tag set by hand when a find is featured in a Six Star short. */
export const FEATURED_TAG = "featured";

/** Contributor ranks: wanted-level stars. Thresholds = points. Six Star is the top rank. */
export const RANKS = [
  { stars: 1, min: 10 },
  { stars: 2, min: 50 },
  { stars: 3, min: 150 },
  { stars: 4, min: 400 },
  { stars: 5, min: 1000 },
  { stars: 6, min: 2500 },
] as const;

export const rankFor = (points: number) => [...RANKS].reverse().find((r) => points >= r.min)?.stars ?? 0;

export interface Contributor {
  name: string;
  url?: string;
  finds: number;
  verified: number;
  featured: number;
  points: number;
  /** Data sources (e.g. GTADB) are credited but not ranked against players. */
  isSource: boolean;
}

/** Names that are open datasets, not players. */
const SOURCES = new Set(["GTADB.org", "Open GTA 6 Map"]);

/** Everyone credited on a live pin, most points first. */
export const CONTRIBUTORS: readonly Contributor[] = (() => {
  const by = new Map<string, Contributor>();
  for (const p of PINS) {
    if (!p.credit?.name) continue;
    const c =
      by.get(p.credit.name) ??
      { name: p.credit.name, url: p.credit.url, finds: 0, verified: 0, featured: 0, points: 0, isSource: SOURCES.has(p.credit.name) };
    c.finds += 1;
    c.points += PTS.find;
    if (p.status === "verified") {
      c.verified += 1;
      c.points += PTS.verified;
    }
    if (p.tags?.includes(FEATURED_TAG)) {
      c.featured += 1;
      c.points += PTS.featured;
    }
    by.set(p.credit.name, c);
  }
  return [...by.values()].sort((a, b) => b.points - a.points || b.finds - a.finds);
})();

/** Newest first: by date added, then by position in pins.json (later = newer). */
export const LATEST_PINS: readonly Pin[] = PINS.map((p, i) => ({ p, i }))
  .sort((a, b) => (b.p.addedAt ?? "").localeCompare(a.p.addedAt ?? "") || b.i - a.i)
  .map(({ p }) => p);

export const COMMUNITY_STATS = {
  pins: PINS.length,
  verified: PINS.filter((p) => p.status === "verified").length,
  players: CONTRIBUTORS.filter((c) => !c.isSource).length,
};
