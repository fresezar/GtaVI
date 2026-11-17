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
  /** "0.4512, 0.3381": paste into the `coord` column of the import table. */
  coordText: string;
  json: string;
  i18n: string;
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

export function formatCoord(c: readonly [number, number]): string {
  return `${round4(c[0]).toFixed(4)}, ${round4(c[1]).toFixed(4)}`;
}

export function slugify(text: string): string {
  return text
    .replace(/[ıİ]/g, "i") // dotless i has no NFKD decomposition
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Builds a ready-to-paste Pin literal plus its text lines. Always `unverified` until confirmed.
 * The import table (docs/INGEST.md) is the main path; this JSON is for one-off manual edits.
 */
export function buildPinTemplate(input: TemplateInput): PinTemplate {
  const id: PinId = `pin_${ulid()}`;
  const title = input.title?.trim() ?? "";
  // Frame coordinates may fall slightly outside 0..1 on a calibrated map: round, never clamp.
  const coord: Coord = [round4(input.coord[0]), round4(input.coord[1])];
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

  const i18n = `"pin.${id}.title": ${JSON.stringify(title || "TODO title")},\n"pin.${id}.description": "",`;

  return { id, coordText: formatCoord(coord), json: JSON.stringify(pin, null, 2), i18n };
}
