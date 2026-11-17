"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, CategoryId, ControlPoint, PlacedPin } from "@/domain";
import { t } from "@/i18n";
import { pinKey } from "@/i18n/keys";
import { fitAffine, maxResidual } from "@/lib/affine";
import { copyText } from "@/lib/clipboard";
import { parseTimestamp, withTimestamp } from "@/lib/source";
import { formatCoord, parseCoord, parseCsv, toCsv } from "./template";

/**
 * In-site data entry (/map?dev=true). Two speeds:
 * - quick note: link + time + a few words while watching a stream (a draft, nothing else needed);
 * - full entry: category, title, details and a map click. A draft is finished later by opening it
 *   from the list ("edit"), so finds can be noted now and placed one by one when the map exists.
 * Rows live in this browser (localStorage); the downloaded CSV holds every row, so it is also the backup.
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
  /** Private note: goes to the CSV `notes` column, never to the site. */
  note: string;
}

export interface EntryRow extends EntryFields {
  coord: [number, number] | null;
  /** Creation time; doubles as the row's local id. */
  at: number;
}

/** draft = not publishable yet (no category or title) · unplaced = publishable, no map spot · ready = both. */
export type RowState = "draft" | "unplaced" | "ready";
export const rowState = (r: EntryRow): RowState => (!r.categoryId || !r.title.trim() ? "draft" : r.coord ? "ready" : "unplaced");

export interface QuickNote {
  sourceUrl: string;
  timestamp: string;
  note: string;
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
  note: "",
});

const FIELDS_KEY = "atlas:dev:fields";
const ROWS_KEY = "atlas:dev:rows";
const QUICK_KEY = "atlas:dev:quick";
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

/** Source link opened at the noted second, for re-watching while placing a draft. */
export function clipUrl(r: Pick<EntryFields, "sourceUrl" | "timestamp">): string | null {
  if (!/^https?:\/\//i.test(r.sourceUrl)) return null;
  const s = parseTimestamp(r.timestamp);
  return Number.isFinite(s) && s > 0 ? withTimestamp(r.sourceUrl, s) : r.sourceUrl;
}

export function useDevTool(enabled: boolean, categories: readonly Category[], landmarks: readonly PlacedPin[]) {
  const [fields, setFields] = useState<EntryFields>(() => EMPTY(categories[0]?.id ?? null));
  const [coord, setCoord] = useState<[number, number] | null>(null);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [quick, setQuick] = useState<QuickNote>({ sourceUrl: "", timestamp: "", note: "" });
  const [editingAt, setEditingAt] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [calib, setCalib] = useState<Calibration>({ active: false, index: 0, points: [] });
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;
    setFields((f) => ({ ...f, ...load<Partial<EntryFields>>(FIELDS_KEY, {}) }));
    setRows(load<EntryRow[]>(ROWS_KEY, []).map((r) => ({ ...EMPTY(null), ...r })));
    setQuick((q) => ({ ...q, sourceUrl: load<Partial<QuickNote>>(QUICK_KEY, {}).sourceUrl ?? "" }));
  }, [enabled]);
  useEffect(() => {
    if (enabled && loaded.current && editingAt === null) save(FIELDS_KEY, fields);
  }, [enabled, fields, editingAt]);
  useEffect(() => {
    if (enabled && loaded.current) save(ROWS_KEY, rows);
  }, [enabled, rows]);
  useEffect(() => {
    if (enabled && loaded.current) save(QUICK_KEY, { sourceUrl: quick.sourceUrl });
  }, [enabled, quick.sourceUrl]);

  const set = useCallback(<K extends keyof EntryFields>(key: K, value: EntryFields[K]) => setFields((f) => ({ ...f, [key]: value })), []);
  const setQuickField = useCallback(<K extends keyof QuickNote>(key: K, value: string) => setQuick((q) => ({ ...q, [key]: value })), []);

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

  /** Fresh form that keeps the session fields (source, finder, category...) of `from`. */
  const resetForm = useCallback((from: EntryFields) => {
    const next = EMPTY(from.categoryId);
    for (const k of STICKY) (next as unknown as Record<string, unknown>)[k] = from[k];
    setFields(next);
    setCoord(null);
  }, []);

  // ---- quick note ----
  const canQuickSave = Boolean(quick.sourceUrl.trim() || quick.note.trim());
  const saveQuick = useCallback(() => {
    if (!quick.sourceUrl.trim() && !quick.note.trim()) {
      flash("Link ya da not yaz");
      return;
    }
    const ts = quick.timestamp.trim();
    if (ts && !/^0+$/.test(ts) && parseTimestamp(ts) === 0) {
      flash("Zamanı 1:02:33 ya da 754 gibi yaz");
      return;
    }
    const row: EntryRow = {
      ...EMPTY(null),
      sourceUrl: quick.sourceUrl.trim(),
      timestamp: quick.timestamp.trim(),
      note: quick.note.trim(),
      coord: null,
      at: Date.now(),
    };
    setRows((r) => [...r, row]);
    setQuick((q) => ({ sourceUrl: q.sourceUrl, timestamp: "", note: "" }));
    flash("Not kaydedildi (taslak)");
  }, [quick, flash]);

  // ---- full entry / edit ----
  const editing = editingAt !== null;
  const canAdd = editing || Boolean(fields.categoryId && fields.title.trim());

  const add = useCallback(() => {
    if (editingAt !== null) {
      const updated: EntryRow = { ...fields, title: fields.title.trim(), coord, at: editingAt };
      setRows((r) => r.map((x) => (x.at === editingAt ? updated : x)));
      setEditingAt(null);
      resetForm(load<EntryFields>(FIELDS_KEY, fields));
      flash(rowState(updated) === "draft" ? "Kaydedildi (hâlâ taslak: kategori ve başlık eksik)" : "Güncellendi");
      return;
    }
    if (!fields.categoryId || !fields.title.trim()) {
      flash("Kategori ve başlık gerekli");
      return;
    }
    setRows((r) => [...r, { ...fields, title: fields.title.trim(), coord, at: Date.now() }]);
    resetForm(fields);
    flash(coord ? "Listeye eklendi" : "Konumsuz eklendi (sitede yayınlanır, konum sonra)");
  }, [fields, coord, editingAt, resetForm, flash]);

  /** Open a row in the form; the next map click places it. */
  const edit = useCallback(
    (at: number) => {
      const row = rows.find((r) => r.at === at);
      if (!row) return;
      const { coord: c, at: _at, ...rest } = row;
      void _at;
      // A quick note has no category yet: keep the one picked in the session.
      setFields({ ...rest, categoryId: rest.categoryId ?? fields.categoryId });
      setCoord(c);
      setEditingAt(at);
    },
    [rows, fields.categoryId],
  );

  const cancelEdit = useCallback(() => {
    setEditingAt(null);
    resetForm(load<EntryFields>(FIELDS_KEY, fields));
  }, [fields, resetForm]);

  /** Oldest row that still needs work: drafts first, then rows without a map spot. */
  const pending = useMemo(() => {
    const drafts = rows.filter((r) => rowState(r) === "draft");
    const unplaced = rows.filter((r) => rowState(r) === "unplaced");
    return { drafts: drafts.length, unplaced: unplaced.length, next: drafts[0] ?? unplaced[0] ?? null };
  }, [rows]);
  const editNext = useCallback(() => {
    if (pending.next) edit(pending.next.at);
    else flash("Bekleyen satır yok");
  }, [pending.next, edit, flash]);

  const remove = useCallback(
    (at: number) => {
      setRows((r) => r.filter((x) => x.at !== at));
      if (editingAt === at) cancelEdit();
    },
    [editingAt, cancelEdit],
  );
  /** Drops only finished rows (category + title + map spot). Drafts and unplaced rows stay until placed. */
  const clearReady = useCallback(() => setRows((r) => r.filter((x) => rowState(x) !== "ready")), []);

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
        notes: r.note,
      })),
    );
  }, [rows, categories]);

  const download = useCallback(() => {
    if (!rows.length) return;
    // Digits only. Never write a bracket with a colon inside (regex or comment) in src/: Tailwind's
    // class scanner turns it into an arbitrary CSS property and the CSS build fails.
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

  /** Restore rows from a CSV downloaded earlier (e.g. browser data was cleared). Skips rows already in the list. */
  const restoreCsv = useCallback(
    (text: string) => {
      const bySlug = new Map(categories.map((c) => [c.slug, c.id] as const));
      const key = (r: EntryRow) => [r.categoryId, r.title, r.sourceUrl, r.timestamp, r.note].join("|");
      const pick = <T extends string>(v: string, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
      const base = Date.now();
      const incoming = parseCsv(text).map(
        (c, i): EntryRow => ({
          categoryId: bySlug.get(c.category) ?? (categories.find((x) => x.id === c.category)?.id ?? null),
          title: c.title ?? "",
          titleTr: c.title_tr ?? "",
          description: c.description ?? "",
          descriptionTr: c.description_tr ?? "",
          sourceUrl: c.source_url ?? "",
          timestamp: c.timestamp ?? "",
          finder: c.finder ?? "",
          finderUrl: c.finder_url ?? "",
          spoiler: pick(c.spoiler, ["none", "mild", "major"] as const, "none"),
          status: pick(c.status, ["unverified", "verified", "disputed"] as const, "unverified"),
          confidence: pick(c.confidence, ["low", "medium", "high"] as const, "medium"),
          region: c.region ?? "",
          note: c.notes ?? "",
          coord: parseCoord(c.coord ?? ""),
          at: base + i,
        }),
      );
      const seen = new Set(rows.map(key));
      const fresh = incoming.filter((r) => !seen.has(key(r)) && seen.add(key(r)));
      setRows([...rows, ...fresh]);
      flash(incoming.length ? `${fresh.length} satır geri yüklendi (${incoming.length - fresh.length} zaten vardı)` : "Dosyada satır bulunamadı");
    },
    [rows, categories, flash],
  );

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

  /** Markers to draw: listed rows (small) + the draft (big, last). The row being edited shows as the draft only. */
  const markers = useMemo(
    () => [
      ...rows.filter((r) => r.coord && r.at !== editingAt).map((r) => r.coord as [number, number]),
      ...(coord ? [coord] : []),
    ],
    [rows, coord, editingAt],
  );

  return {
    fields,
    set,
    coord,
    setCoord,
    rows,
    canAdd,
    add,
    editing,
    editingAt,
    edit,
    cancelEdit,
    editNext,
    pending,
    quick,
    setQuickField,
    canQuickSave,
    saveQuick,
    remove,
    clearReady,
    download,
    copyCsv,
    restoreCsv,
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
