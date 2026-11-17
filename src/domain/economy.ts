import type { ActivityId, ContentMeta, GameId } from "./common";

export type ActivityKind = "heist" | "business" | "market" | "job" | "other";

/** Numbers live in data; formulas live in code. */
export interface EconomyActivity extends ContentMeta {
  id: ActivityId;
  slug: string;
  gameId: GameId;
  kind: ActivityKind;
  payout: { min: number; max: number };
  durationMinutes?: number;
  requirements?: string[];
}
