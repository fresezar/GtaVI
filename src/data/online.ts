import raw from "@content/online-weekly.json";

/**
 * GTA 6 Online readiness. Online is not out (no official date; press reports point to 2027).
 * WEEKLY = the weekly bonus and discount tracker, newest first. Empty until Online launches;
 * the /online page switches from "coming" to the live tracker as soon as the first week is added.
 */
export interface OnlineWeek {
  /** Monday or the update day of that week, YYYY-MM-DD. */
  weekOf: string;
  items: {
    kind: "bonus" | "discount" | "event" | "new";
    title: { en: string; tr: string };
    detail?: { en: string; tr: string };
  }[];
  sourceName: string;
  sourceUrl: string;
}

export const WEEKLY = (raw as OnlineWeek[]).slice().sort((a, b) => b.weekOf.localeCompare(a.weekOf));

/** What the site will offer for Online. `when`: ready on launch day, or shortly after (needs data from the game). */
export const ONLINE_FEATURES = [
  { id: "weekly", when: "launch" },
  { id: "money", when: "after" },
  { id: "crew", when: "launch" },
  { id: "map", when: "launch" },
  { id: "guide", when: "launch" },
  { id: "alerts", when: "after" },
] as const;
