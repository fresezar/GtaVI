import type { CategoryId } from "./common";

export type ColorToken =
  | "coral"
  | "orchid"
  | "sky"
  | "sun"
  | "lime"
  | "rose"
  | "turquoise"
  | "plum"
  | "rust"
  | "mint"
  | "peach"
  | "slate"
  | "indigo"
  | "ice"
  | "green"
  | "crimson"
  | "magenta"
  | "navy"
  | "sand"
  | "gold"
  | "jade"
  | "cobalt"
  | "lilac"
  | "copper"
  | "salmon"
  | "orange"
  | "teal"
  | "berry"
  | "amber"
  | "lavender"
  | "olive"
  | "aqua"
  | "brick"
  | "violet"
  | "steel";

/** Text lives in i18n: `category.<id>.name`. Data lives in content/categories.json. */
export interface Category {
  /** Immutable once real pins use it. Remove a category by leaving it unused, not by renaming. */
  id: CategoryId;
  slug: string;
  sortOrder: number;
  colorToken: ColorToken;
  iconToken: string;
  /** Does this category count toward the overall completion %? (also gets its own checklist) */
  countsForProgress: boolean;
  /** Map starts with this layer off (dense, low-interest layers such as shops). */
  hiddenByDefault?: boolean;
}
