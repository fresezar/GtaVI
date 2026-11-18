import type { GameId } from "@/domain";

export const SITE = {
  /** Brand (decided 2026-11-18, domain sixstargta.com). */
  name: "Six Star",
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
  /**
   * Search engines: false = robots.txt blocks crawling and pages say noindex. Turn on once the final
   * domain is attached, so search ranking is not built on the temporary workers.dev address.
   */
  indexable: true,
  /**
   * Cloudflare Web Analytics (cookieless, free). Dashboard > Analytics & Logs > Web Analytics > Add a site >
   * hostname > "Manage site" shows a JS snippet: paste only its token here. Empty = no analytics script.
   */
  analytics: { cloudflareToken: "b5385201f20c4f16b6d8a34cee3cca22" },
  /** Community links: empty = hidden. Fill when the accounts exist. */
  links: {
    tiktok: "",
    discord: "",
    x: "",
    donate: "",
  },
} as const;
