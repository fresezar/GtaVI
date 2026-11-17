import type { GameId, Profile, ProfileId, ProgressEntry, ProgressMap } from "@/domain";
import { PROGRESS_SCHEMA_VERSION } from "@/domain";
import type { StorageAdapter } from "./StorageAdapter";

const PREFIX = "atlas:v1:";
const PROFILES_KEY = `${PREFIX}profiles`;
const progressKey = (id: ProfileId) => `${PREFIX}progress:${id}`;
const CODE_PREFIX = "ATLAS1:";

/** Safe wrapper: storage can throw (private mode, blocked, quota). Falls back to memory. */
const memory = new Map<string, string>();
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}
function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}
function readJson<T>(key: string, fallback: T): T {
  const raw = read(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isEntry(v: unknown): v is ProgressEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.ref === "string" && typeof e.done === "boolean" && typeof e.updatedAt === "string";
}

export class LocalStorageAdapter implements StorageAdapter {
  async listProfiles(gameId: GameId): Promise<Profile[]> {
    return readJson<Profile[]>(PROFILES_KEY, []).filter((p) => p.gameId === gameId);
  }

  async createProfile(gameId: GameId, name: string): Promise<Profile> {
    const all = readJson<Profile[]>(PROFILES_KEY, []);
    const profile: Profile = {
      id: `prof_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      gameId,
      name,
      createdAt: new Date().toISOString(),
    };
    write(PROFILES_KEY, JSON.stringify([...all, profile]));
    return profile;
  }

  async getProgress(profileId: ProfileId): Promise<ProgressMap> {
    return readJson<ProgressMap>(progressKey(profileId), {});
  }

  async setProgressEntry(profileId: ProfileId, entry: ProgressEntry): Promise<void> {
    const map = readJson<ProgressMap>(progressKey(profileId), {});
    map[entry.ref] = entry;
    write(progressKey(profileId), JSON.stringify(map));
  }

  async exportProgress(profileId: ProfileId): Promise<string> {
    const progress = await this.getProgress(profileId);
    return CODE_PREFIX + toBase64(JSON.stringify({ v: PROGRESS_SCHEMA_VERSION, progress }));
  }

  async importProgress(profileId: ProfileId, code: string): Promise<ProgressMap> {
    const trimmed = code.trim();
    if (!trimmed.startsWith(CODE_PREFIX)) throw new Error("invalid code");
    let parsed: unknown;
    try {
      parsed = JSON.parse(fromBase64(trimmed.slice(CODE_PREFIX.length)));
    } catch {
      throw new Error("invalid code");
    }
    const incoming = (parsed as { progress?: unknown })?.progress;
    if (typeof incoming !== "object" || incoming === null) throw new Error("invalid code");

    const merged = await this.getProgress(profileId);
    for (const value of Object.values(incoming as Record<string, unknown>)) {
      if (!isEntry(value)) continue;
      const current = merged[value.ref];
      if (!current || current.updatedAt < value.updatedAt) merged[value.ref] = value;
    }
    write(progressKey(profileId), JSON.stringify(merged));
    return merged;
  }
}
