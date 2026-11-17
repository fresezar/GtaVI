import type { ISODate, ProfileId, UserId } from "./common";

export type PlanId = "free" | "pro";

export type FeatureKey =
  | "multiProfile"
  | "userMarkers"
  | "cloudSync"
  | "adFree"
  | "customImages"
  | "netWorth";

export interface User {
  id: UserId;
  planId: PlanId;
  createdAt: ISODate;
}

export type CollectionEntityType = "vehicle" | "weapon";

export interface CollectionEntry {
  profileId: ProfileId;
  entityType: CollectionEntityType;
  entityId: string;
  owned: boolean;
  upgraded: boolean;
  favorite: boolean;
  note?: string;
  imageRef?: string;
}
