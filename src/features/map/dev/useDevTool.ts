"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, CategoryId, ControlPoint, Pin } from "@/domain";
import { t } from "@/i18n";
import { pinKey } from "@/i18n/keys";
import { fitAffine, maxResidual } from "@/lib/affine";
import { copyText } from "@/lib/clipboard";
import { formatCoord, toCsv } from "./template";

/**
 * In-site data entry (replaces the Google Sheet): click the map for the coordinate, fill the form,
 * add to the list, download one CSV for `npm run import:pins`. Also runs map calibration.
 * Everything is kept in this browser (localStorage) until downloaded.
 */

export interface EntryFields {
  categoryId: CategoryId | null;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  sourceUrl: string;
  timestamp: string;
  finder: string;
  finderUrl: string;
  spoiler: "none" | "mild" | "major";
  status: "unverified" | "verified" | "disputed";
  confidence: "low" | "medium" | "high";
  region: string;
}

export interface EntryRow extends EntryFields {
  coord: [number, number] | null;
  at: number;
}

export interface Calibration {
  active: boolean;
  index: number;
  points: ControlPoint[];
}

/** Kept after "add": one stream session = same VOD, streamer and usually category. */
const STICKY: (keyof EntryFields)[] = ["categoryId", "sourceUrl", "finder", "finderUrl", "status", "confidence", "region"];

const EMPTY = (categoryId: CategoryId | null): EntryFields => ({
  categoryId,
  title: "",
  titleTr: "",
  description: "",
  descriptionTr: "",
  sourceUrl: "",
  timestamp: "",
  finder: "",
  finderUrl: "",
  spoiler: "none",
  status: "unverified",
  confidence: "medium",
  region: "",
});

const FIELDS_KEY = "atlas:dev:fields";
const ROWS_KEY = "atlas:dev:rows";
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
    /* storage unavailable: still works for this session */
  }
}

export function useDevTool(enabled: boolean, categories: readonly Category[], landmarks: readonly Pin[]) {
  const [fields, setFields] = useState<EntryFields>(() => EMPTY(categories[0]?.id ?? null));
  const [coord, setCoord] = useState<[number, number] | null>(null);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [toast, setToast] = useState("");
  const [calib, setCalib] = useState<Calibration>({ active: false, index: 0, points: [] });
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }, []);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;
    setFields((f) => ({ ...f, ...load<Partial<EntryFields>>(FIELDS_KEY, {}) }));
    setRows(load<EntryRow[]>(ROWS_KEY, []));
  }, [enabled]);
  useEffect(() => {
    if (enabled && loaded.current) save(FIELDS_KEY, fields);
  }, [enabled, fields]);
  useEffect(() => {
    if (enabled && loaded.current) save(ROWS_KEY, rows);
  }, [enabled, rows]);

  const set = useCallback(<K extends keyof EntryFields>(key: K, value: EntryFields[K]) => setFields((f) => ({ ...f, [key]: value })), []);

  const live = useRef({ calib });
  useEffect(() => {
    live.current = { calib };
  });

  /** Map click: sets the draft coordinate, or records a calibration point. */
  const capture = useCallback(
    (frame: readonly [number, number], image: readonly [number, number]) => {
      const cal = live.current.calib;
      if (cal.active) {
        const target = landmarks[cal.index];
        if (!target) return;
        const point: ControlPoint = { label: t(pinKey(target.id, "title")), frame: target.coord, image: [round4(image[0]), round4(image[1])] };
        setCalib({ ...cal, index: cal.index + 1, points: [...cal.points, point] });
        flash(`Nokta ${cal.points.length + 1} alındı`);
        return;
      }
      setCoord([round4(frame[0]), round4(frame[1])]);
    },
    [landmarks, flash],
  );

  const canAdd = Boolean(fields.categoryId && fields.title.trim());
  const add = useCallback(() => {
    if (!fields.categoryId || !fields.title.trim()) {
      flash("Kategori ve başlık gerekli");
      return;
    }
    setRows((r) => [...r, { ...fields, title: fields.title.trim(), coord, at: Date.now() }]);
    setFields((f) => {
      const next = EMPTY(f.categoryId);
      for (const k of STICKY) (next as unknown as Record<string, unknown>)[k] = f[k];
      return next;
    });
    setCoord(null);
    flash(coord ? "Listeye eklendi" : "Konumsuz eklendi (sonra konum verilebilir)");
  }, [fields, coord, flash]);

  const remove = useCallback((at: number) => setRows((r) => r.filter((x) => x.at !== at)), []);
  const clearRows = useCallback(() => setRows([]), []);

  const csv = useMemo(() => {
    const slug = (id: CategoryId | null) => categories.find((c) => c.id === id)?.slug ?? "";
    return toCsv(
      rows.map((r) => ({
        category: slug(r.categoryId),
        title: r.title,
        title_tr: r.titleTr,
        description: r.description,
        description_tr: r.descriptionTr,
        coord: r.coord ? formatCoord(r.coord) : "",
        source_url: r.sourceUrl,
        timestamp: r.timestamp,
        finder: r.finder,
        finder_url: r.finderUrl,
        spoiler: r.spoiler,
        status: r.status,
        confidence: r.confidence,
        region: r.region,
      })),
    );
  }, [rows, categories]);

  const download = useCallback(() => {
    if (!rows.length) return;
    // Digits only (no bracket regex here: Tailwind's class scanner would read "[x:y]" as a CSS property).
    const stamp = new Date().toISOString().slice(0, 16).replace(/\D/g, "");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pins-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash(`${rows.length} satır indirildi: inbox/ klasörüne koy`);
  }, [csv, rows.length, flash]);

  const copyCsv = useCallback(async () => {
    flash((await copyText(csv)) ? "CSV kopyalandı: sohbete yapıştırabilirsin" : "Kopyalanamadı");
  }, [csv, flash]);

  const copyCoord = useCallback(async () => {
    if (coord) flash((await copyText(formatCoord(coord))) ? "Koordinat kopyalandı" : "Kopyalanamadı");
  }, [coord, flash]);

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
      return { residual, json: `calibration: ${JSON.stringify({ points: calib.points }, null, 2)},`, error: null as string | null };
    } catch (e) {
      return { residual: 0, json: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [calib.points]);
  const copyCalibration = useCallback(async () => {
    if (calibResult?.json) flash((await copyText(calibResult.json)) ? "Kalibrasyon kopyalandı" : "Kopyalanamadı");
  }, [calibResult, flash]);

  // Hotkeys outside inputs: 1-9 and 0 pick category 1-10, Esc drops the draft coordinate.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        const cat = categories[e.key === "0" ? 9 : Number(e.key) - 1];
        if (cat) set("categoryId", cat.id);
      } else if (e.key === "Escape") setCoord(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, categories, set]);

  /** Markers to draw: listed rows (small) + the draft (big, last). */
  const markers = useMemo(
    () => [...rows.filter((r) => r.coord).map((r) => r.coord as [number, number]), ...(coord ? [coord] : [])],
    [rows, coord],
  );

  return {
    fields,
    set,
    coord,
    setCoord,
    rows,
    canAdd,
    add,
    remove,
    clearRows,
    download,
    copyCsv,
    copyCoord,
    capture,
    markers,
    toast,
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
