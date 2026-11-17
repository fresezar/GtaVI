import contentText from "@content/text.en.json";
import { CATEGORIES } from "@/data/categories";
import { CHECKLIST_CATEGORY, CHECKLISTS, COMPLETION_CHECKLIST_ID } from "@/data/checklists";
import { PINS, SAMPLE_MODE } from "@/data/pins";
import type { ChecklistId } from "@/domain";
import { categoryKey, checklistItemKey, checklistKey, checklistSectionKey, pinKey } from "./keys";

const ui: Record<string, string> = {
  "ui.brand.tag": "Unofficial · early build",
  "ui.progress.complete": "Complete",
  "ui.progress.found": "{done} of {total} found",
  "ui.filters.title": "Categories",
  "ui.filters.hideDone": "Hide completed",
  "ui.filters.all": "All",
  "ui.filters.none": "None",
  "ui.search.label": "Search",
  "ui.search.placeholder": "Search pins…",
  "ui.search.empty": "No matches",
  "ui.backup.title": "Backup",
  "ui.backup.export": "Copy backup code",
  "ui.backup.import": "Restore from code",
  "ui.backup.note": "Progress is saved on this device only.",
  "ui.backup.copied": "Backup code copied",
  "ui.backup.prompt": "Paste your backup code",
  "ui.backup.restored": "Progress restored",
  "ui.backup.invalid": "That code is not valid",
  "ui.pin.markDone": "Mark as found",
  "ui.pin.markUndone": "Mark as not found",
  "ui.pin.spoiler": "Spoiler: tap to reveal",
  "ui.pin.foundBy": "Found by {name}",
  "ui.pin.openPage": "Open page",
  "ui.pin.showOnMap": "Show on map",
  "ui.pin.backToMap": "← Back to map",
  "ui.pin.source": "Source",
  "ui.pin.watchAt": "Watch on {platform} at {time}",
  "ui.pin.watch": "Watch on {platform}",
  "ui.pin.openSource": "Open source",
  "ui.pin.nearby": "Nearby",
  "ui.pin.allInCategory": "All {category}",
  "ui.pin.metaDescription": "Where to find {title} ({category}) on the interactive map, with the source clip and who found it.",
  "ui.pin.status.verified": "Verified",
  "ui.pin.status.unverified": "Unverified",
  "ui.pin.status.disputed": "Disputed",
  "ui.pin.status.deprecated": "Removed",
  "ui.pin.status.unverifiedHint": "Seen in one source so far. It is marked verified once a second independent source or the community confirms it.",
  "ui.pin.status.disputedHint": "Sources disagree about this one. Double-check before you travel.",
  "ui.theme.toggle": "Toggle theme",
  "ui.map.loading": "Loading map…",
  "ui.map.attribution": "Map art: {name}",
  "ui.nav.map": "Map",
  "ui.nav.checklists": "Checklists",
  "ui.checklist.items": "{done} of {total} done",
  "ui.checklist.onMap": "On map",
  "ui.checklist.hideDone": "Hide completed",
  "ui.checklist.index": "All checklists",
  "ui.checklist.empty": "Nothing here yet. Pins appear as soon as they are found.",
};

const content = contentText as Record<string, string>;

// Fallback name for any category without text (visible but not blank).
const categoryFallbacks = Object.fromEntries(
  CATEGORIES.map((c) => [categoryKey(c.id), c.slug.replace(/-/g, " ").replace(/^./, (s) => s.toUpperCase())]),
);
const categoryName = (id: string) => content[`category.${id}.name`] ?? categoryFallbacks[`category.${id}.name`] ?? id;

// Titles for checklists generated from pins (data has no language; text is composed here).
const generatedChecklists: Record<string, string> = {};
for (const c of CHECKLISTS) {
  const catId = CHECKLIST_CATEGORY[c.id as ChecklistId];
  if (c.id === COMPLETION_CHECKLIST_ID) {
    generatedChecklists[checklistKey(c.id)] = "100% completion checklist";
    for (const s of c.sections) {
      const cat = CATEGORIES.find((x) => x.slug === s.id);
      if (cat) generatedChecklists[checklistSectionKey(c.id, s.id)] = categoryName(cat.id);
    }
  } else if (catId) {
    generatedChecklists[checklistKey(c.id)] = `${categoryName(catId)} checklist`;
    generatedChecklists[checklistSectionKey(c.id, "all")] = "All locations";
  }
}

// Sample text only while there are no real pins.
const sample: Record<string, string> = {};
if (SAMPLE_MODE) {
  PINS.forEach((p, i) => {
    sample[pinKey(p.id, "title")] = `Sample pin ${String(i + 1).padStart(2, "0")}`;
    sample[pinKey(p.id, "description")] = "Placeholder description. Replace with real data.";
  });
  for (const c of CHECKLISTS) {
    sample[checklistKey(c.id)] = "100% Completion (sample)";
    for (const sec of c.sections) {
      sample[checklistSectionKey(c.id, sec.id)] = sec.id.replace(/^./, (x) => x.toUpperCase());
      sec.items.forEach((item, i) => {
        sample[checklistItemKey(item.id)] = `Sample item ${sec.id} ${i + 1}`;
      });
    }
  }
}

/** Real content text lives in content/text.en.json and always wins. */
export const en: Record<string, string> = { ...ui, ...categoryFallbacks, ...generatedChecklists, ...sample, ...content };
