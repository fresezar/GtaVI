import type { ChecklistId, ContentMeta, EntityRef, GameId, GuideId } from "./common";

/** Body lives in MDX at `bodyPath`; title in i18n: `guide.<id>.title`. */
export interface Guide extends ContentMeta {
  id: GuideId;
  slug: string;
  gameId: GameId;
  bodyPath: string;
  related?: EntityRef[];
  checklistId?: ChecklistId;
}
