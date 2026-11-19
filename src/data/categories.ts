import type { Category } from "@/domain";
import raw from "@content/categories.json";

/** Source of truth: content/categories.json (checked by scripts/validate-content.mjs). */
export const CATEGORIES: readonly Category[] = [...(raw as Category[])].sort((a, b) => a.sortOrder - b.sortOrder);
export const CATEGORY_BY_ID: ReadonlyMap<Category["id"], Category> = new Map(CATEGORIES.map((c) => [c.id, c]));
