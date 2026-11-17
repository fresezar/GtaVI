import type { Checklist } from "@/domain";

/**
 * SAMPLE checklist (ids start with "sample"). Linked items share progress with the map:
 * an item with `linkedPinId` is done exactly when that pin is done.
 */
export const CHECKLISTS: readonly Checklist[] = [
  {
    id: "chk_sample_completion",
    slug: "100-percent-completion",
    gameId: "gta6",
    status: "unverified",
    spoilerLevel: "none",
    addedAt: "2026-11-16",
    dataVersion: 1,
    sections: [
      {
        id: "collectibles",
        items: [1, 2, 3, 4, 5].map((n) => ({
          id: `chi_sample_c${n}` as const,
          type: "collectible" as const,
          linkedPinId: `pin_sample_${String(n).padStart(2, "0")}` as const,
          weight: 1,
        })),
      },
      {
        id: "story",
        items: [1, 2, 3].map((n) => ({ id: `chi_sample_s${n}` as const, type: "mission" as const, weight: 2 })),
      },
      {
        id: "extras",
        items: [1, 2].map((n) => ({ id: `chi_sample_x${n}` as const, type: "manual" as const, weight: 1 })),
      },
    ],
  },
];
