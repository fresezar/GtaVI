import textEn from "@content/text.en.json";
import textTr from "@content/text.tr.json";
import textEs from "@content/text.es.json";
import { CATEGORIES } from "@/data/categories";
import { categoryKey } from "./keys";
import type { Locale } from "./locale";
import { UI_EN } from "./ui.en";
import { UI_TR } from "./ui.tr";
import { UI_ES } from "./ui.es";

export type Dict = Record<string, string>;

/**
 * Core dictionary per locale: UI strings + category names + content text (content/text.<locale>.json, which
 * wins). This is what every page ships to the browser, so it stays small: pin titles and descriptions live in
 * content/pin-text.<locale>.json and are added on the server (src/i18n/server.ts) or fetched by the map
 * (/pin-data/text.<locale>.json). Missing keys fall back to English in t().
 */
function build(ui: Dict, content: Dict, contentEn: Dict): Dict {
  const categoryName = (id: string) =>
    content[categoryKey(id as never)] ?? contentEn[categoryKey(id as never)] ?? id.replace(/^cat_/, "").replace(/_/g, " ");
  const categoryNames = Object.fromEntries(CATEGORIES.map((c) => [categoryKey(c.id), categoryName(c.id)]));
  return { ...ui, ...categoryNames, ...content };
}

const EN_CONTENT = textEn as Dict;

export const DICTIONARIES: Record<Locale, Dict> = {
  en: build(UI_EN, EN_CONTENT, EN_CONTENT),
  tr: build(UI_TR, textTr as Dict, EN_CONTENT),
  es: build(UI_ES, textEs as Dict, EN_CONTENT),
};
