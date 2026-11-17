import type { ContentMeta, GameId, ISODate, PinId, VehicleId, VerificationStatus, WeaponId, MediaRef } from "./common";

/** A stat always says how it was obtained, so users can judge trust. */
export interface MeasuredStat {
  value: number;
  unit: string;
  /** Test protocol, e.g. "0-100 km/h, flat road, dry, 5 runs". */
  method: string;
  sampleSize: number;
  status: VerificationStatus;
  sourceUrl?: string;
  measuredAt?: ISODate;
}

export type VehicleStatKey = "topSpeed" | "acceleration" | "handling" | "braking";
export type WeaponStatKey = "damage" | "fireRate" | "range" | "accuracy";

export interface Acquisition {
  pinId?: PinId;
  /** i18n key for free text, optional. */
  noteKey?: string;
}

export interface Vehicle extends ContentMeta {
  id: VehicleId;
  slug: string;
  gameId: GameId;
  classId: string;
  stats: Partial<Record<VehicleStatKey, MeasuredStat>>;
  price?: number;
  modCost?: number;
  acquisition?: Acquisition;
  media?: MediaRef[];
}

export interface Weapon extends ContentMeta {
  id: WeaponId;
  slug: string;
  gameId: GameId;
  classId: string;
  stats: Partial<Record<WeaponStatKey, MeasuredStat>>;
  price?: number;
  acquisition?: Acquisition;
  media?: MediaRef[];
}
