/** Prefixed string IDs: type-safe, human-readable, never reused. */
export type Id<P extends string> = `${P}_${string}`;
export type PinId = Id<"pin">;
export type CategoryId = Id<"cat">;
export type MapId = Id<"map">;
export type ProfileId = Id<"prof">;
export type ChecklistId = Id<"chk">;
export type ChecklistItemId = Id<"chi">;
export type GuideId = Id<"gde">;
export type VehicleId = Id<"veh">;
export type WeaponId = Id<"wpn">;
export type MissionId = Id<"mis">;
export type ChoiceId = Id<"cho">;
export type EndingId = Id<"end">;
export type ActivityId = Id<"act">;
export type MiniGameId = Id<"mgm">;
export type ContributionId = Id<"con">;
export type UserId = Id<"usr">;

export type GameId = "gta6";
export type ISODate = string; // YYYY-MM-DD or full ISO timestamp

/** Normalized map coordinate: [x, y] in 0..1, origin top-left. Independent of image resolution. */
export type Coord = readonly [x: number, y: number];

export type VerificationStatus = "verified" | "unverified" | "disputed" | "deprecated";
export type SpoilerLevel = "none" | "mild" | "major";
export type Confidence = "low" | "medium" | "high";

export interface Provenance {
  sourceUrl?: string;
  retrievedAt?: ISODate;
  confidence: Confidence;
  extractedBy: "human" | "ai";
}

export interface Credit {
  name: string;
  url?: string;
}

export interface MediaRef {
  kind: "image" | "video";
  url: string;
  alt?: string;
}

export type EntityKind = "pin" | "guide" | "vehicle" | "weapon" | "mission" | "checklist";
export interface EntityRef {
  kind: EntityKind;
  id: string;
}

/** Fields every official content record carries. */
export interface ContentMeta {
  status: VerificationStatus;
  spoilerLevel: SpoilerLevel;
  provenance?: Provenance;
  addedAt: ISODate;
  updatedAt?: ISODate;
  /** Bump when the record changes meaningfully. */
  dataVersion: number;
}
