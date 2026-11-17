import type { GameId } from "@/domain";

export const SITE = {
  /** Working title: final brand is decided after launch. */
  name: "Atlas",
  description: "Unofficial interactive map, checklists and guides for players.",
  gameId: "gta6" as GameId,
  defaultLocale: "en",
  disclaimer:
    "Unofficial fan project. Not affiliated with, endorsed by, or connected to Rockstar Games or Take-Two Interactive. All trademarks belong to their owners.",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /**
   * Official Rockstar artwork as decoration (src/config/art.ts). Set to false to remove every
   * official image in one step (e.g. after a takedown request); our own SVG scene takes over.
   */
  officialArt: true,
  /** Launch day (local midnight in the visitor's timezone drives the countdown). */
  launch: { year: 2026, month: 11, day: 19 },
  /** Community links: empty = hidden. Fill when the accounts exist. */
  links: {
    discord: "",
    x: "",
    donate: "",
  },
} as const;
