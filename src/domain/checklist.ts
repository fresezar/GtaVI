import type { ChecklistId, ChecklistItemId, ContentMeta, GameId, PinId } from "./common";

export type ChecklistItemType = "mission" | "collectible" | "manual";

/** Text lives in i18n: `checklist.<id>.title`, `checklistItem.<id>.label`. */
export interface ChecklistItem {
  id: ChecklistItemId;
  type: ChecklistItemType;
  linkedPinId?: PinId;
  /** Share of overall completion. */
  weight: number;
}

export interface ChecklistSection {
  id: string;
  items: ChecklistItem[];
}

export interface Checklist extends ContentMeta {
  id: ChecklistId;
  slug: string;
  gameId: GameId;
  sections: ChecklistSection[];
}
