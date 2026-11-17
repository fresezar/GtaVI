import type { ContributionId, ISODate, UserId } from "./common";
import type { Pin } from "./pin";

export type ContributionStatus = "pending" | "approved" | "rejected";

/** A proposed pin waiting in the moderation queue. */
export interface Contribution {
  id: ContributionId;
  proposerId: UserId;
  payload: Omit<Pin, "id" | "status" | "dataVersion" | "addedAt">;
  status: ContributionStatus;
  reviewerId?: UserId;
  reason?: string;
  createdAt: ISODate;
}
