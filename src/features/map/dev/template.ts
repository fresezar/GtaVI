import type { CategoryId, Coord, MapId, Pin, PinId, PinSource } from "@/domain";
import { ulid } from "@/lib/ulid";

export interface TemplateInput {
  mapId: MapId;
  categoryId: CategoryId;
  coord: readonly [number, number];
  source: PinSource;
  credit?: string;
  title?: string;
}

export interface PinTemplate {
  id: PinId;
  json: string;
  i18n: string;
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Builds a ready-to-paste Pin literal plus its i18n lines. Always `unverified` until confirmed. */
export function buildPinTemplate(input: TemplateInput): PinTemplate {
  const id: PinId = `pin_${ulid()}`;
  const title = input.title?.trim() ?? "";
  const coord: Coord = [round4(clamp01(input.coord[0])), round4(clamp01(input.coord[1]))];
  const credit = input.credit?.trim();

  const pin: Pin = {
    id,
    slug: slugify(title) || `pin-${id.slice(-8).toLowerCase()}`,
    mapId: input.mapId,
    categoryId: input.categoryId,
    coord,
    source: input.source,
    ...(credit ? { credit: { name: credit } } : {}),
    status: "unverified",
    spoilerLevel: "none",
    addedAt: new Date().toISOString().slice(0, 10),
    dataVersion: 1,
  };

  const i18n =
    `"pin.${id}.title": ${JSON.stringify(title || "TODO title")},\n` + `"pin.${id}.description": "",`;

  return { id, json: JSON.stringify(pin, null, 2), i18n };
}
