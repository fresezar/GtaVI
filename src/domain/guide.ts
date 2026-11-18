import type { ISODate, SpoilerLevel, VerificationStatus } from "./common";

export interface GuideSource {
  name: string;
  url: string;
}

/**
 * A written guide (content/guides.json). Text lives in i18n, like pins:
 *   guide.<id>.title, guide.<id>.lead,
 *   guide.<id>.s.<section>.title, guide.<id>.s.<section>.body
 * A body is plain text: blank line = new paragraph, lines starting with "- " = bullet list.
 * Facts come from the listed sources; the wording is always our own.
 */
export interface Guide {
  id: string;
  slug: string;
  /** Position on the guides index (lower = first). */
  order: number;
  status: VerificationStatus;
  spoilerLevel: SpoilerLevel;
  addedAt: ISODate;
  updatedAt?: ISODate;
  /** Banner key from src/config/art.ts; unknown keys fall back to a default banner. */
  art?: string;
  sections: string[];
  sources: GuideSource[];
  /** Internal links shown under the guide ("/map", "/guides/missables"...). */
  related?: string[];
}
