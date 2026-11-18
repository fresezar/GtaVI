import type { Missable } from "@/domain";
import raw from "@content/missables.json";

/** Story order (content/missables.json, checked by scripts/validate-content.mjs). Removed entries stay as "deprecated". */
export const MISSABLES: readonly Missable[] = [...(raw as unknown as Missable[])]
  .filter((m) => m.status !== "deprecated")
  .sort((a, b) => a.order - b.order);
