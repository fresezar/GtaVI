import type { GameId, Profile, ProfileId, ProgressEntry, ProgressMap } from "@/domain";

/**
 * The only door to user data. Today: localStorage. Later: Supabase/PostgreSQL.
 * Feature code must never touch localStorage directly.
 */
export interface StorageAdapter {
  listProfiles(gameId: GameId): Promise<Profile[]>;
  createProfile(gameId: GameId, name: string): Promise<Profile>;
  getProgress(profileId: ProfileId): Promise<ProgressMap>;
  setProgressEntry(profileId: ProfileId, entry: ProgressEntry): Promise<void>;
  /** Portable backup string (works across devices before accounts exist). */
  exportProgress(profileId: ProfileId): Promise<string>;
  /** Merges a backup into the profile (newer entry wins). Throws on invalid code. */
  importProgress(profileId: ProfileId, code: string): Promise<ProgressMap>;
}
