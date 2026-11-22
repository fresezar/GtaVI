/**
 * Server-side i18n: the core dictionary plus pin text and generated checklist titles. Import this from server
 * components, pages and metadata only. A client component importing it would ship every pin's text to the
 * browser; client code uses "@/i18n" (core) and gets pin text from /pin-data/text.<locale>.json instead.
 */
import pinTextEn from "@content/pin-text.en.json";
import pinTextTr from "@content/pin-text.tr.json";
import pinTextEs from "@content/pin-text.es.json";
import { CATEGORIES } from "@/data/categories";
import { CHECKLIST_CATEGORY, CHECKLISTS, COMPLETION_CHECKLIST_ID } from "@/data/checklists";
import { PINS, SAMPLE_MODE } from "@/data/pins";
import type { ChecklistId } from "@/domain";
import { DICTIONARIES, type Dict } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./locale";
import { categoryKey, checklistItemKey, checklistKey, checklistSectionKey, pinKey } from "./keys";
import type { Translate } from "./index";

export type { Locale } from "./locale";
export type { Translate } from "./index";
export { LOCALES, DEFAULT_LOCALE, LOCALE_TAG, localePath, alternates } from "./locale";

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** Checklist titles and section names, generated from the categories (and sample text in sample mode). */
function composed(core: Dict): Dict {
  const out: Dict = {};
  const categoryName = (id: string) => core[categoryKey(id as never)] ?? id;
  for (const c of CHECKLISTS) {
    const catId = CHECKLIST_CATEGORY[c.id as ChecklistId];
    if (c.id === COMPLETION_CHECKLIST_ID) {
      out[checklistKey(c.id)] = core["ui.checklist.completionTitle"];
      for (const s of c.sections) {
        const cat = CATEGORIES.find((x) => x.slug === s.id);
        if (cat) out[checklistSectionKey(c.id, s.id)] = categoryName(cat.id);
      }
    } else if (catId) {
      out[checklistKey(c.id)] = fill(core["ui.checklist.categoryTitle"], { category: categoryName(catId) });
      out[checklistSectionKey(c.id, "all")] = core["ui.checklist.allSection"];
    }
  }
  if (SAMPLE_MODE) {
    PINS.forEach((p, i) => {
      out[pinKey(p.id, "title")] = fill(core["ui.sample.pin"], { n: String(i + 1).padStart(2, "0") });
      out[pinKey(p.id, "description")] = core["ui.sample.pinDesc"];
    });
    for (const c of CHECKLISTS) {
      out[checklistKey(c.id)] = core["ui.sample.checklist"];
      for (const sec of c.sections) {
        out[checklistSectionKey(c.id, sec.id)] = sec.id.replace(/^./, (x) => x.toUpperCase());
        sec.items.forEach((item, i) => {
          out[checklistItemKey(item.id)] = fill(core["ui.sample.item"], { section: sec.id, n: i + 1 });
        });
      }
    }
  }
  return out;
}

const PIN_TEXT: Record<Locale, Dict> = { en: pinTextEn as Dict, tr: pinTextTr as Dict, es: pinTextEs as Dict };
const FULL: Record<Locale, Dict> = Object.fromEntries(
  (Object.keys(DICTIONARIES) as Locale[]).map((l) => [l, { ...DICTIONARIES[l], ...composed(DICTIONARIES[l]), ...PIN_TEXT[l] }]),
) as Record<Locale, Dict>;

/** Like the core t(), with pin text and checklist titles. Falls back to English, then to the key. */
export function t(key: string, vars?: Record<string, string | number>, locale: Locale = DEFAULT_LOCALE): string {
  const raw = FULL[locale][key] ?? FULL.en[key] ?? key;
  return vars ? fill(raw, vars) : raw;
}

export const tFor =
  (locale: Locale): Translate =>
  (key, vars) =>
    t(key, vars, locale);

export const hasText = (key: string, locale: Locale = DEFAULT_LOCALE) => t(key, undefined, locale) !== key;
