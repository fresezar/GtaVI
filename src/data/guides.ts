import type { Guide } from "@/domain";
import raw from "@content/guides.json";

/** content/guides.json (checked by scripts/validate-content.mjs). Removed guides stay as "deprecated". */
export const GUIDES: readonly Guide[] = [...(raw as unknown as Guide[])]
  .filter((g) => g.status !== "deprecated")
  .sort((a, b) => a.order - b.order);

export const GUIDE_BY_SLUG: ReadonlyMap<string, Guide> = new Map(GUIDES.map((g) => [g.slug, g]));
