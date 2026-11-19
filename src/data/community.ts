import type { Pin } from "@/domain";
import { PINS } from "./pins";

/** Contributor ranks: wanted-level stars. Thresholds = accepted finds. Six Star is the top rank. */
export const RANKS = [
  { stars: 1, min: 1 },
  { stars: 2, min: 5 },
  { stars: 3, min: 15 },
  { stars: 4, min: 40 },
  { stars: 5, min: 100 },
  { stars: 6, min: 250 },
] as const;

export const rankFor = (finds: number) => [...RANKS].reverse().find((r) => finds >= r.min)?.stars ?? 0;

export interface Contributor {
  name: string;
  url?: string;
  finds: number;
  verified: number;
  /** Data sources (e.g. GTADB) are credited but not ranked against players. */
  isSource: boolean;
}

/** Names that are open datasets, not players. */
const SOURCES = new Set(["GTADB.org"]);

/** Everyone credited on a live pin, most finds first. */
export const CONTRIBUTORS: readonly Contributor[] = (() => {
  const by = new Map<string, Contributor>();
  for (const p of PINS) {
    if (!p.credit?.name) continue;
    const c = by.get(p.credit.name) ?? { name: p.credit.name, url: p.credit.url, finds: 0, verified: 0, isSource: SOURCES.has(p.credit.name) };
    c.finds += 1;
    if (p.status === "verified") c.verified += 1;
    by.set(p.credit.name, c);
  }
  return [...by.values()].sort((a, b) => b.finds - a.finds);
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
