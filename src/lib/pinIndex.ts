import type { CategoryId, MapId, Pin, PinId } from "@/domain";

/**
 * Compact pin list for the browser (/pin-data/pins.json), and pure helpers that both sides share.
 * The full content/pins.json is ~2.6 MB; this keeps only what the map, the pin card and progress need.
 */
export interface CompactPin {
  id: string;
  s: string; // slug
  c: string; // categoryId
  m?: string; // mapId when not the main map
  x?: number;
  y?: number;
  st: Pin["status"];
  sp?: Pin["spoilerLevel"]; // omitted when "none"
  cr?: [string, string?]; // credit name, url
  r?: string; // region
  im?: string; // image url
  src?: string; // provenance.sourceUrl
  so?: Pin["source"]; // omitted when "community"
  a: string; // addedAt
  u?: string; // updatedAt
  tg?: string[]; // only the tags the browser uses (nopage, live, via:*, featured)
  n: string; // case file number
}

const BROWSER_TAGS = /^(nopage|live|featured|via:)/;

export function toCompact(p: Pin, fileNo: string): CompactPin {
  const image = p.media?.find((m) => m.kind === "image");
  const tags = p.tags?.filter((t) => BROWSER_TAGS.test(t));
  return {
    id: p.id,
    s: p.slug,
    c: p.categoryId,
    ...(p.mapId !== "map_main" ? { m: p.mapId } : {}),
    ...(p.coord ? { x: p.coord[0], y: p.coord[1] } : {}),
    st: p.status,
    ...(p.spoilerLevel !== "none" ? { sp: p.spoilerLevel } : {}),
    ...(p.credit ? { cr: p.credit.url ? [p.credit.name, p.credit.url] : [p.credit.name] } : {}),
    ...(p.region ? { r: p.region } : {}),
    ...(image ? { im: image.url } : {}),
    ...(p.provenance?.sourceUrl ? { src: p.provenance.sourceUrl } : {}),
    ...(p.source !== "community" ? { so: p.source } : {}),
    a: p.addedAt,
    ...(p.updatedAt ? { u: p.updatedAt } : {}),
    ...(tags?.length ? { tg: tags } : {}),
    n: fileNo,
  };
}

/** Browser-side Pin, with its case file number attached. */
export type ClientPin = Pin & { fileNo: string };

export function fromCompact(c: CompactPin): ClientPin {
  return {
    id: c.id as PinId,
    slug: c.s,
    mapId: (c.m ?? "map_main") as MapId,
    categoryId: c.c as CategoryId,
    ...(c.x !== undefined && c.y !== undefined ? { coord: [c.x, c.y] as [number, number] } : {}),
    source: c.so ?? "community",
    ...(c.cr ? { credit: { name: c.cr[0], ...(c.cr[1] ? { url: c.cr[1] } : {}) } } : {}),
    ...(c.r ? { region: c.r } : {}),
    ...(c.im ? { media: [{ kind: "image" as const, url: c.im }] } : {}),
    ...(c.tg ? { tags: c.tg } : {}),
    status: c.st,
    spoilerLevel: c.sp ?? "none",
    ...(c.src ? { provenance: { sourceUrl: c.src, confidence: "medium" as const, extractedBy: "human" as const } } : {}),
    addedAt: c.a,
    ...(c.u ? { updatedAt: c.u } : {}),
    dataVersion: 1,
    fileNo: c.n,
  };
}

/** Own page or not (see src/data/pins.ts). Pure, so client code can use it without the pin list. */
export const hasPage = (p: Pin): boolean => !p.tags?.some((t) => t === "nopage" || t === "live");
/** English path for a pin: its page, or its spot on the map. Wrap with localePath / useHref. */
export const pinPath = (p: Pin): string => (hasPage(p) ? `/pins/${p.slug}` : `/map?pin=${p.id}`);
