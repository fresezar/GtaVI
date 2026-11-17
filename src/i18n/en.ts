import { CATEGORIES } from "@/data/categories";
import { CHECKLISTS } from "@/data/checklists";
import { PINS } from "@/data/pins";
import { categoryKey, checklistItemKey, checklistKey, checklistSectionKey, pinKey } from "./keys";

const ui: Record<string, string> = {
  "ui.brand.tag": "Unofficial · early build",
  "ui.progress.complete": "Complete",
  "ui.progress.found": "{done} of {total} found",
  "ui.filters.title": "Categories",
  "ui.filters.hideDone": "Hide completed",
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
  "ui.pin.status.verified": "Verified",
  "ui.pin.status.unverified": "Unverified",
  "ui.pin.status.disputed": "Disputed",
  "ui.pin.status.deprecated": "Removed",
  "ui.theme.toggle": "Toggle theme",
  "ui.map.loading": "Loading map…",
  "ui.nav.map": "Map",
  "ui.nav.checklists": "Checklists",
  "ui.checklist.items": "{done} of {total} done",
  "ui.checklist.onMap": "On map",
  "ui.checklist.hideDone": "Hide completed",
  "ui.checklist.index": "All checklists",
};

const categories = Object.fromEntries(
  CATEGORIES.map((c) => [categoryKey(c.id), c.slug.replace(/-/g, " ").replace(/^./, (s) => s.toUpperCase())]),
);

// Sample pin text only. Real pins get text via the dev tool's i18n lines.
const samplePins = Object.fromEntries(
  PINS.filter((p) => p.tags?.includes("sample")).flatMap((p, i) => [
    [pinKey(p.id, "title"), `Sample pin ${String(i + 1).padStart(2, "0")}`],
    [pinKey(p.id, "description"), "Placeholder description. Replace with real data."],
  ]),
);

// Sample checklist text only.
const sampleChecklists: Record<string, string> = {};
for (const c of CHECKLISTS.filter((x) => x.id.startsWith("chk_sample"))) {
  sampleChecklists[checklistKey(c.id)] = "100% Completion (sample)";
  for (const sec of c.sections) {
    sampleChecklists[checklistSectionKey(c.id, sec.id)] = sec.id.replace(/^./, (x) => x.toUpperCase());
    sec.items.forEach((item, i) => {
      sampleChecklists[checklistItemKey(item.id)] = `Sample item ${sec.id} ${i + 1}`;
    });
  }
}

/** Real pin text goes here (paste lines from the dev tool). */
const pins: Record<string, string> = {};

export const en: Record<string, string> = { ...ui, ...categories, ...samplePins, ...sampleChecklists, ...pins };
