import type { CategoryId } from "./common";

export type ColorToken = "coral" | "turquoise" | "sun" | "orchid" | "sky" | "lime";

/** Text lives in i18n: `category.<id>.name`. */
export interface Category {
  id: CategoryId;
  slug: string;
  sortOrder: number;
  colorToken: ColorToken;
  iconToken: string;
  /** Does this category count toward the overall completion %? */
  countsForProgress: boolean;
}
