import type { ISODate } from "./common";

/**
 * Editorial records (timeline milestones, news). Like pins, they carry no language:
 * text lives in i18n as `timeline.<id>.title|body` and `news.<id>.title|summary`.
 * Every record names a source; "confirmed" must point to a first-party source.
 */
export type EditorialKind = "confirmed" | "rumor" | "launch";

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
