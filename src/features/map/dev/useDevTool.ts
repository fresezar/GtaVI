"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, CategoryId, ControlPoint, MapDef, Pin, PinSource } from "@/domain";
import { t } from "@/i18n";
import { pinKey } from "@/i18n/keys";
import { fitAffine, maxResidual } from "@/lib/affine";
import { copyText } from "@/lib/clipboard";
import { buildPinTemplate, type PinTemplate } from "./template";

export type CopyFormat = "coord" | "json";

export interface DevSettings {
  categoryId: CategoryId | null;
  source: PinSource;
  credit: string;
  autoCopy: boolean;
  /** "coord" = text for the import table (default), "json" = full pin literal. */
  copyFormat: CopyFormat;
}

export interface DevCapture extends PinTemplate {
  coord: [number, number];
  at: number;
}

export interface Calibration {
  active: boolean;
  index: number;
  points: ControlPoint[];
}

const SETTINGS_KEY = "atlas:dev:settings";
const CAPTURES_KEY = "atlas:dev:captures";
const round4 = (n: number) => Math.round(n * 10000) / 10000;

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

/**
 * Click map -> coordinate (or pin JSON) on the clipboard in one action. Built for speed while
 * watching a stream. Also runs map calibration: click known landmarks on a new map image.
 */
export function useDevTool(enabled: boolean, def: MapDef, categories: readonly Category[], landmarks: readonly Pin[]) {
  const [settings, setSettings] = useState<DevSettings>({
    categoryId: categories[0]?.id ?? null,
    source: "stream",
    credit: "",
    autoCopy: true,
    copyFormat: "coord",
  });
  const [captures, setCaptures] = useState<DevCapture[]>([]);
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState("");
  const [calib, setCalib] = useState<Calibration>({ active: false, index: 0, points: [] });
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
    setCaptures(load<DevCapture[]>(CAPTURES_KEY, []).filter((c) => typeof c.coordText === "string"));
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

  const live = useRef({ settings, title, calib });
  useEffect(() => {
    live.current = { settings, title, calib };
  });

  const payload = (c: PinTemplate, format: CopyFormat) => (format === "coord" ? c.coordText : c.json);

  const capture = useCallback(
    (coord: readonly [number, number], image: readonly [number, number]) => {
      const { settings: s, title: currentTitle, calib: cal } = live.current;

      if (cal.active) {
        const target = landmarks[cal.index];
        if (!target) return;
        const point: ControlPoint = {
          label: t(pinKey(target.id, "title")),
          frame: target.coord,
          image: [round4(image[0]), round4(image[1])],
        };
        setCalib({ ...cal, index: cal.index + 1, points: [...cal.points, point] });
        flash(`Point ${cal.points.length + 1} set`);
        return;
      }

      if (!s.categoryId) return;
      const tpl = buildPinTemplate({
        mapId: def.id,
        categoryId: s.categoryId,
        coord,
        source: s.source,
        credit: s.credit,
        title: currentTitle,
      });
      setCaptures((prev) => [...prev, { ...tpl, coord: [coord[0], coord[1]], at: Date.now() }]);
      setTitle("");
      if (s.autoCopy) void copy(payload(tpl, s.copyFormat), s.copyFormat === "coord" ? "Coord" : "Pin JSON");
      else flash("Captured");
    },
    [def.id, landmarks, copy, flash],
  );

  const last = captures[captures.length - 1] ?? null;
  const copyLast = useCallback(
    () => last && copy(payload(last, live.current.settings.copyFormat), "Last"),
    [last, copy],
  );
  const copyLastI18n = useCallback(() => last && copy(last.i18n, "Text lines"), [last, copy]);
  const copyAll = useCallback(() => {
    const format = live.current.settings.copyFormat;
    const sep = format === "coord" ? "\n" : ",\n";
    return copy(captures.map((c) => payload(c, format)).join(sep), `${captures.length} captures`);
  }, [captures, copy]);
  const undo = useCallback(() => setCaptures((p) => p.slice(0, -1)), []);
  const clear = useCallback(() => setCaptures([]), []);

  // ---- calibration ----
  const startCalibration = useCallback(() => setCalib({ active: true, index: 0, points: [] }), []);
  const stopCalibration = useCallback(() => setCalib({ active: false, index: 0, points: [] }), []);
  const skipLandmark = useCallback(() => setCalib((c) => ({ ...c, index: c.index + 1 })), []);
  const undoLandmark = useCallback(
    () => setCalib((c) => (c.points.length ? { ...c, index: Math.max(0, c.index - 1), points: c.points.slice(0, -1) } : c)),
    [],
  );
  const calibResult = useMemo(() => {
    if (calib.points.length < 3) return null;
    try {
      const pairs = calib.points.map((p) => ({ from: p.frame, to: p.image }));
      const residual = maxResidual(fitAffine(pairs), pairs);
      const json = `calibration: ${JSON.stringify({ points: calib.points }, null, 2)},`;
      return { residual, json, error: null as string | null };
    } catch (e) {
      return { residual: 0, json: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [calib.points]);
  const copyCalibration = useCallback(() => calibResult?.json && copy(calibResult.json, "Calibration"), [calibResult, copy]);

  // Hotkeys: 1-9 and 0 pick category 1-10, C copy last, Z undo
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        const cat = categories[e.key === "0" ? 9 : Number(e.key) - 1];
        if (cat) setSettings((s) => ({ ...s, categoryId: cat.id }));
      } else if (e.key === "c") void copyLast();
      else if (e.key === "z") {
        if (live.current.calib.active) undoLandmark();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, categories, copyLast, undo, undoLandmark]);

  return {
    settings,
    setSettings,
    title,
    setTitle,
    captures,
    capture,
    last,
    toast,
    copyLast,
    copyLastI18n,
    copyAll,
    undo,
    clear,
    landmarks,
    calib,
    calibResult,
    startCalibration,
    stopCalibration,
    skipLandmark,
    undoLandmark,
    copyCalibration,
  };
}

export type DevTool = ReturnType<typeof useDevTool>;
