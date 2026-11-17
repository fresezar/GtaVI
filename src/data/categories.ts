import type { Category } from "@/domain";

export const CATEGORIES: readonly Category[] = [
  { id: "cat_hidden_packages", slug: "hidden-packages", sortOrder: 1, colorToken: "coral", iconToken: "package", countsForProgress: true },
  { id: "cat_easter_eggs", slug: "easter-eggs", sortOrder: 2, colorToken: "orchid", iconToken: "egg", countsForProgress: true },
  { id: "cat_rare_vehicles", slug: "rare-vehicles", sortOrder: 3, colorToken: "turquoise", iconToken: "car", countsForProgress: true },
  { id: "cat_weapons", slug: "weapon-locations", sortOrder: 4, colorToken: "sun", iconToken: "gun", countsForProgress: true },
  { id: "cat_safehouses", slug: "safehouses", sortOrder: 5, colorToken: "sky", iconToken: "house", countsForProgress: true },
  { id: "cat_side_missions", slug: "side-missions", sortOrder: 6, colorToken: "lime", iconToken: "flag", countsForProgress: true },
];
