import type { ChecklistItemId, Coord, GameId, ISODate, MapId, PinId, ProfileId, Id } from "./common";

export const PROGRESS_SCHEMA_VERSION = 1;

export interface Profile {
  id: ProfileId;
  gameId: GameId;
  name: string;
  /** Empty while local-only; set after account sync. */
  ownerId?: string;
  createdAt: ISODate;
}

export type ProgressRef = PinId | ChecklistItemId;

/** Completion % is never stored; it is always computed. */
export interface ProgressEntry {
  ref: ProgressRef;
  done: boolean;
  doneAt?: ISODate;
  note?: string;
  schemaVersion: number;
  updatedAt: ISODate;
}

export type ProgressMap = Record<string, ProgressEntry>;

/** Personal pin (premium). Kept separate from official Pin on purpose. */
export interface UserMarker {
  id: Id<"umk">;
  profileId: ProfileId;
  mapId: MapId;
  coord: Coord;
  customCategory?: string;
  note?: string;
  imageRef?: string;
  updatedAt: ISODate;
}
