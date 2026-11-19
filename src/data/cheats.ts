import raw from "@content/cheats.json";

/**
 * GTA 6 story-mode cheats. Source of truth: content/cheats.json.
 * Codes and unlock conditions: GTA 6 Intel (gta6intel.com/cheats), shared by its founder for reuse; credited on the page.
 * `code` = D-pad sequence, the same on PS5 and Xbox; null = not found yet.
 */
export type CheatKind = "player" | "weapons" | "vehicles" | "world";
export type Dir = "up" | "down" | "left" | "right";

export interface Cheat {
  id: string;
  slug: string;
  name: string;
  kind: CheatKind;
  code: Dir[] | null;
  effect: { en: string; tr: string };
  /** null = available as soon as the story is finished. */
  unlock: { en: string; tr: string } | null;
}

export const CHEATS = raw as Cheat[];
export const CHEAT_KINDS: readonly CheatKind[] = ["player", "weapons", "vehicles", "world"];
export const CHEAT_SOURCE = { name: "GTA 6 Intel", url: "https://gta6intel.com/cheats" } as const;
