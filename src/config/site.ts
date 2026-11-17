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
} as const;
