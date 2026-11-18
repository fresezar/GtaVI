import type { ISODate, PinId, SpoilerLevel, VerificationStatus } from "./common";

/**
 * Editorial records (timeline milestones, news). Like pins, they carry no language:
 * text lives in i18n as `timeline.<id>.title|body` and `news.<id>.title|summary`.
 * Every record names a source; "confirmed" must point to a first-party source.
 */
/**
 * confirmed = first-party (Rockstar, Take-Two). reported = outlets that played the game say so
 * (reviews, hands-on guides), not first-party. rumor = everything else.
 */
export type EditorialKind = "confirmed" | "reported" | "rumor" | "launch";

export interface TimelineEvent {
  id: string;
  date: ISODate;
  kind: EditorialKind;
  sourceName: string;
  sourceUrl: string;
}

export interface NewsItem {
  id: string;
  date: ISODate;
  kind: EditorialKind;
  sourceName: string;
  sourceUrl: string;
  /** Optional link inside the site (pin, checklist, guide) the story is about. */
  internalHref?: string;
}

/**
 * Something the player can lose for good (finished story missions cannot be replayed).
 * Text in i18n: `missable.<id>.title` (spoiler-free: what you can miss) and
 * `missable.<id>.body` (when the window closes and how to get it; hidden when spoilerLevel is not "none").
 */
export interface Missable {
  id: string;
  /** Story order: lower = earlier in the game. Leave gaps (10, 20, 30) so entries can slot in between. */
  order: number;
  spoilerLevel: SpoilerLevel;
  status: VerificationStatus;
  addedAt: ISODate;
  sourceName: string;
  sourceUrl: string;
  /** The map spot, if it has one. */
  pinId?: PinId;
}
