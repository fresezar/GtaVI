import textEn from "@content/text.en.json";
import textTr from "@content/text.tr.json";
import { CATEGORIES } from "@/data/categories";
import { CHECKLIST_CATEGORY, CHECKLISTS, COMPLETION_CHECKLIST_ID } from "@/data/checklists";
import { PINS, SAMPLE_MODE } from "@/data/pins";
import type { ChecklistId } from "@/domain";
import { categoryKey, checklistItemKey, checklistKey, checklistSectionKey, pinKey } from "./keys";
import type { Locale } from "./locale";
import { UI_EN } from "./ui.en";
import { UI_TR } from "./ui.tr";

type Dict = Record<string, string>;

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/**
 * One dictionary per locale: UI strings + composed texts (generated checklists, sample data)
 * + content text (content/text.<locale>.json, which always wins). Missing keys fall back to English in t().
 */
function build(ui: Dict, content: Dict, contentEn: Dict): Dict {
  const categoryName = (id: string) =>
    content[categoryKey(id as never)] ?? contentEn[categoryKey(id as never)] ?? id.replace(/^cat_/, "").replace(/_/g, " ");

  const composed: Dict = {};
  for (const c of CHECKLISTS) {
    const catId = CHECKLIST_CATEGORY[c.id as ChecklistId];
    if (c.id === COMPLETION_CHECKLIST_ID) {
      composed[checklistKey(c.id)] = ui["ui.checklist.completionTitle"];
      for (const s of c.sections) {
        const cat = CATEGORIES.find((x) => x.slug === s.id);
        if (cat) composed[checklistSectionKey(c.id, s.id)] = categoryName(cat.id);
      }
    } else if (catId) {
      composed[checklistKey(c.id)] = fill(ui["ui.checklist.categoryTitle"], { category: categoryName(catId) });
      composed[checklistSectionKey(c.id, "all")] = ui["ui.checklist.allSection"];
    }
  }

  if (SAMPLE_MODE) {
    PINS.forEach((p, i) => {
      composed[pinKey(p.id, "title")] = fill(ui["ui.sample.pin"], { n: String(i + 1).padStart(2, "0") });
      composed[pinKey(p.id, "description")] = ui["ui.sample.pinDesc"];
    });
    for (const c of CHECKLISTS) {
      composed[checklistKey(c.id)] = ui["ui.sample.checklist"];
      for (const sec of c.sections) {
        composed[checklistSectionKey(c.id, sec.id)] = sec.id.replace(/^./, (x) => x.toUpperCase());
        sec.items.forEach((item, i) => {
          composed[checklistItemKey(item.id)] = fill(ui["ui.sample.item"], { section: sec.id, n: i + 1 });
        });
      }
    }
  }

  const categoryNames = Object.fromEntries(CATEGORIES.map((c) => [categoryKey(c.id), categoryName(c.id)]));
  return { ...ui, ...categoryNames, ...composed, ...content };
}

const EN_CONTENT = textEn as Dict;

export const DICTIONARIES: Record<Locale, Dict> = {
  en: build(UI_EN, EN_CONTENT, EN_CONTENT),
  tr: build(UI_TR, textTr as Dict, EN_CONTENT),
};
