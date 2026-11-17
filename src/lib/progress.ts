import type { Category, CategoryId, Checklist, ChecklistItem, Pin, ProgressMap } from "@/domain";

export interface CountPair {
  done: number;
  total: number;
}

export interface ProgressSummary extends CountPair {
  percent: number;
  byCategory: Record<string, CountPair>;
}

/** Completion is always derived, never stored. Floor so 100% means truly complete. */
export function computeProgress(
  pins: readonly Pin[],
  categories: readonly Category[],
  progress: ProgressMap,
): ProgressSummary {
  const counts = new Map<CategoryId, boolean>(categories.map((c) => [c.id, c.countsForProgress]));
  const byCategory: Record<string, CountPair> = {};
  let done = 0;
  let total = 0;
  for (const pin of pins) {
    if (pin.status === "deprecated") continue;
    const pair = (byCategory[pin.categoryId] ??= { done: 0, total: 0 });
    const isDone = progress[pin.id]?.done === true;
    pair.total += 1;
    if (isDone) pair.done += 1;
    if (counts.get(pin.categoryId)) {
      total += 1;
      if (isDone) done += 1;
    }
  }
  return { done, total, percent: total === 0 ? 0 : Math.floor((done / total) * 100), byCategory };
}

/** Linked items share progress with their pin, so map and checklist always agree. */
export function checklistRef(item: ChecklistItem): string {
  return item.linkedPinId ?? item.id;
}

export interface ChecklistSummary {
  done: number;
  total: number;
  percent: number;
  bySection: Record<string, { done: number; total: number }>;
}

/** Weighted completion over a checklist. */
export function computeChecklistProgress(checklist: Checklist, progress: ProgressMap): ChecklistSummary {
  let done = 0;
  let total = 0;
  const bySection: ChecklistSummary["bySection"] = {};
  for (const section of checklist.sections) {
    const pair = (bySection[section.id] = { done: 0, total: 0 });
    for (const item of section.items) {
      pair.total += item.weight;
      total += item.weight;
      if (progress[checklistRef(item)]?.done === true) {
        pair.done += item.weight;
        done += item.weight;
      }
    }
  }
  return { done, total, percent: total === 0 ? 0 : Math.floor((done / total) * 100), bySection };
}
