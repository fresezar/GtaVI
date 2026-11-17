import { LocalStorageAdapter } from "./LocalStorageAdapter";
import type { StorageAdapter } from "./StorageAdapter";

let instance: StorageAdapter | null = null;

/** Swap point: return a SupabaseAdapter here when accounts ship. */
export function getStorage(): StorageAdapter {
  return (instance ??= new LocalStorageAdapter());
}

export type { StorageAdapter };
