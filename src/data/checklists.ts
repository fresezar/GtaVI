import type { CategoryId, Checklist, ChecklistId, ChecklistItem, Pin } from "@/domain";
import { CATEGORIES } from "./categories";
import { PINS, SAMPLE_MODE } from "./pins";

/**
 * Checklists are derived from pins: add a pin and it appears on the map, in its category
 * checklist and in the 100% checklist at once. IDs derive from immutable pin/category IDs,
 * so progress stays stable. Hand-written checklists (missions without a map spot, etc.)
 * can be appended to HANDWRITTEN later.
 */

const HANDWRITTEN: Checklist[] = [];

/** Which generated checklist belongs to which category (used for titles). */
export const CHECKLIST_CATEGORY: Partial<Record<ChecklistId, CategoryId>> = {};
export const COMPLETION_CHECKLIST_ID: ChecklistId = "chk_completion";

const toItem = (p: Pin): ChecklistItem => ({
  id: `chi_${p.id}`,
  type: p.categoryId === "cat_story_missions" ? "mission" : "collectible",
  linkedPinId: p.id,
  weight: 1,
});

function generated(): Checklist[] {
  const progressCats = CATEGORIES.filter((c) => c.countsForProgress);
  const byCat = new Map(progressCats.map((c) => [c.id, PINS.filter((p) => p.categoryId === c.id)]));
  const withPins = progressCats.filter((c) => (byCat.get(c.id)?.length ?? 0) > 0);

  // The completion checklist always exists (possibly empty): static export needs >= 1 checklist page.
  const firstDate = PINS.map((p) => p.addedAt).sort()[0] ?? "2026-11-19";
  const meta = { gameId: "gta6", status: "verified", spoilerLevel: "none", addedAt: firstDate, dataVersion: 1 } as const;

  const completion: Checklist = {
    ...meta,
    id: COMPLETION_CHECKLIST_ID,
    slug: "100-percent-completion",
    sections: withPins.map((c) => ({ id: c.slug, items: byCat.get(c.id)!.map(toItem) })),
  };

  const perCategory = withPins.map((c): Checklist => {
    const id = `chk_${c.id.slice("cat_".length)}` as ChecklistId;
    CHECKLIST_CATEGORY[id] = c.id;
    return { ...meta, id, slug: c.slug, sections: [{ id: "all", items: byCat.get(c.id)!.map(toItem) }] };
  });

  return [completion, ...perCategory];
}

/** Placeholder shown only while there are no real pins (SAMPLE_MODE). */
const SAMPLE: Checklist[] = [
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
      { id: "story", items: [1, 2, 3].map((n) => ({ id: `chi_sample_s${n}` as const, type: "mission" as const, weight: 2 })) },
      { id: "extras", items: [1, 2].map((n) => ({ id: `chi_sample_x${n}` as const, type: "manual" as const, weight: 1 })) },
    ],
  },
];

export const CHECKLISTS: readonly Checklist[] = SAMPLE_MODE ? SAMPLE : [...generated(), ...HANDWRITTEN];
