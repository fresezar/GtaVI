import type { ChoiceId, ContentMeta, EndingId, GameId, MissionId } from "./common";

/** Generic enough for linear or branching stories. Titles in i18n: `mission.<id>.title`. */
export interface Mission extends ContentMeta {
  id: MissionId;
  slug: string;
  gameId: GameId;
  order: number;
  optional: boolean;
  /** Choices offered during this mission, if any. */
  choiceIds?: ChoiceId[];
}

export interface ChoiceOption {
  key: string;
  /** Missions or endings this option leads to. */
  leadsTo?: (MissionId | EndingId)[];
  /** Flags set when this option is picked. */
  setsFlags?: string[];
}

export interface Choice extends ContentMeta {
  id: ChoiceId;
  missionId: MissionId;
  options: ChoiceOption[];
}

export interface Ending extends ContentMeta {
  id: EndingId;
  gameId: GameId;
  requiresFlags?: string[];
}
