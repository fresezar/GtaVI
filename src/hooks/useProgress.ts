"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameId, Profile, ProgressEntry, ProgressMap } from "@/domain";
import { PROGRESS_SCHEMA_VERSION } from "@/domain";
import { getStorage } from "@/storage";

const PROGRESS_EVENT = "atlas:progress";
const announce = () => window.dispatchEvent(new Event(PROGRESS_EVENT));

export function useProgress(gameId: GameId) {
  const storage = useMemo(() => getStorage(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);
  const progressRef = useRef<ProgressMap>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const existing = await storage.listProfiles(gameId);
      const p = existing[0] ?? (await storage.createProfile(gameId, "Player 1"));
      const map = await storage.getProgress(p.id);
      if (!alive) return;
      progressRef.current = map;
      setProfile(p);
      setProgress(map);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [storage, gameId]);

  // Several components use this hook at once (map, header stars). A write in one reloads the others.
  useEffect(() => {
    if (!profile) return;
    const reload = async () => {
      const map = await storage.getProgress(profile.id);
      progressRef.current = map;
      setProgress(map);
    };
    window.addEventListener(PROGRESS_EVENT, reload);
    return () => window.removeEventListener(PROGRESS_EVENT, reload);
  }, [profile, storage]);

  const isDone = useCallback((ref: string) => progress[ref]?.done === true, [progress]);

  const toggle = useCallback(
    (ref: string) => {
      if (!profile) return;
      const now = new Date().toISOString();
      const wasDone = progressRef.current[ref]?.done === true;
      const entry: ProgressEntry = {
        ref: ref as ProgressEntry["ref"],
        done: !wasDone,
        doneAt: wasDone ? undefined : now,
        schemaVersion: PROGRESS_SCHEMA_VERSION,
        updatedAt: now,
      };
      const next = { ...progressRef.current, [ref]: entry };
      progressRef.current = next;
      setProgress(next);
      void storage.setProgressEntry(profile.id, entry).then(announce);
    },
    [profile, storage],
  );

  const exportCode = useCallback(async () => (profile ? storage.exportProgress(profile.id) : ""), [profile, storage]);

  const importCode = useCallback(
    async (code: string) => {
      if (!profile) throw new Error("not ready");
      const merged = await storage.importProgress(profile.id, code);
      progressRef.current = merged;
      setProgress(merged);
      announce();
    },
    [profile, storage],
  );

  return { ready, progress, isDone, toggle, exportCode, importCode };
}
