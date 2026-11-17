"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, CategoryId, MapDef, PinSource } from "@/domain";
import { copyText } from "@/lib/clipboard";
import { buildPinTemplate, type PinTemplate } from "./template";

export interface DevSettings {
  categoryId: CategoryId | null;
  source: PinSource;
  credit: string;
  autoCopy: boolean;
}

export interface DevCapture extends PinTemplate {
  coord: [number, number];
  at: number;
}

const SETTINGS_KEY = "atlas:dev:settings";
const CAPTURES_KEY = "atlas:dev:captures";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: dev tool still works for this session */
  }
}

/** Click map -> JSON on the clipboard in one action. Built for speed while watching a stream. */
export function useDevTool(enabled: boolean, def: MapDef, categories: readonly Category[]) {
  const [settings, setSettings] = useState<DevSettings>({
    categoryId: categories[0]?.id ?? null,
    source: "stream",
    credit: "",
    autoCopy: true,
  });
  const [captures, setCaptures] = useState<DevCapture[]>([]);
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState("");
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;
    setSettings((s) => ({ ...s, ...load<Partial<DevSettings>>(SETTINGS_KEY, {}) }));
    setCaptures(load<DevCapture[]>(CAPTURES_KEY, []));
  }, [enabled]);

  useEffect(() => {
    if (enabled && loaded.current) save(SETTINGS_KEY, settings);
  }, [enabled, settings]);
  useEffect(() => {
    if (enabled && loaded.current) save(CAPTURES_KEY, captures);
  }, [enabled, captures]);

  const copy = useCallback(
    async (text: string, label: string) => {
      flash((await copyText(text)) ? `${label} copied` : "Copy failed: select manually");
    },
    [flash],
  );

  const settingsRef = useRef(settings);
  const titleRef = useRef(title);
  useEffect(() => {
    settingsRef.current = settings;
    titleRef.current = title;
  });

  const capture = useCallback(
    (coord: readonly [number, number]) => {
      const s = settingsRef.current;
      if (!s.categoryId) return;
      const tpl = buildPinTemplate({
        mapId: def.id,
        categoryId: s.categoryId,
        coord,
        source: s.source,
        credit: s.credit,
        title: titleRef.current,
      });
      const cap: DevCapture = { ...tpl, coord: [coord[0], coord[1]], at: Date.now() };
      setCaptures((prev) => [...prev, cap]);
      setTitle("");
      if (s.autoCopy) void copy(tpl.json, "Pin JSON");
      else flash("Captured");
    },
    [def.id, copy, flash],
  );

  const last = captures[captures.length - 1] ?? null;
  const copyLast = useCallback(() => last && copy(last.json, "Pin JSON"), [last, copy]);
  const copyLastI18n = useCallback(() => last && copy(last.i18n, "i18n lines"), [last, copy]);
  const copyAll = useCallback(
    () => copy(captures.map((c) => c.json).join(",\n"), `${captures.length} pins`),
    [captures, copy],
  );
  const copyAllI18n = useCallback(() => copy(captures.map((c) => c.i18n).join("\n"), "All i18n lines"), [captures, copy]);
  const undo = useCallback(() => setCaptures((p) => p.slice(0, -1)), []);
  const clear = useCallback(() => setCaptures([]), []);

  // Hotkeys: 1-9 category, C copy last, Z undo
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) {
        const cat = categories[Number(e.key) - 1];
        if (cat) setSettings((s) => ({ ...s, categoryId: cat.id }));
      } else if (e.key === "c") void copyLast();
      else if (e.key === "z") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, categories, copyLast, undo]);

  return { settings, setSettings, title, setTitle, captures, capture, last, toast, copyLast, copyLastI18n, copyAll, copyAllI18n, undo, clear };
}

export type DevTool = ReturnType<typeof useDevTool>;
