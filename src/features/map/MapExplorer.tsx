"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, CategoryId, PinId } from "@/domain";
import { CATEGORIES } from "@/data/categories";
import { MAPS } from "@/data/maps";
import { PINS } from "@/data/pins";
import { SITE } from "@/config/site";
import { t } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";
import { computeProgress } from "@/lib/progress";
import { copyText } from "@/lib/clipboard";
import DevPanel from "./DevPanel";
import MapView, { type MapFocus } from "./MapView";
import SiteHeader from "@/components/ui/SiteHeader";
import { useDevTool } from "./dev/useDevTool";
import { useProgress } from "@/hooks/useProgress";
import { CATEGORY_COLORS } from "./tokens";

const DEF = MAPS[0];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;
const MAP_PINS = PINS.filter((p) => p.mapId === DEF.id);
const LANDMARKS = MAP_PINS.filter((p) => p.categoryId === "cat_landmarks");
const DEFAULT_HIDDEN = new Set(CATEGORIES.filter((c) => c.hiddenByDefault).map((c) => c.id));
const SEARCH_INDEX = MAP_PINS.map((p) => ({ pin: p, title: t(pinKey(p.id, "title")), haystack: t(pinKey(p.id, "title")).toLowerCase() }));
const SEARCH_LIMIT = 8;

export default function MapExplorer() {
  const [dev, setDev] = useState(false);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<CategoryId>>(DEFAULT_HIDDEN);
  const [hideDone, setHideDone] = useState(false);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");

  const { ready, progress, isDone, toggle, exportCode, importCode } = useProgress(SITE.gameId);
  const devTool = useDevTool(dev, DEF, CATEGORIES, LANDMARKS);

  const focusPin = useCallback((id: PinId) => setFocus((f) => ({ id, nonce: (f?.nonce ?? 0) + 1 })), []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setDev(q.get("dev") === "true");
    const pin = q.get("pin");
    if (pin) focusPin(pin as PinId);
  }, [focusPin]);

  const summary = useMemo(() => computeProgress(MAP_PINS, CATEGORIES, progress), [progress]);

  // A focused pin always shows, even if its layer is off or it is completed.
  const visiblePins = useMemo(
    () =>
      MAP_PINS.filter(
        (p) => p.id === focus?.id || (!hidden.has(p.categoryId) && !(hideDone && progress[p.id]?.done === true)),
      ),
    [hidden, hideDone, progress, focus],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return SEARCH_INDEX.filter((r) => r.haystack.includes(q)).slice(0, SEARCH_LIMIT);
  }, [query]);

  /** Jump to the next not-yet-found pin in a category (cycles), turning the layer on if needed. */
  const nextUnfound = useCallback(
    (categoryId: CategoryId) => {
      const list = MAP_PINS.filter((p) => p.categoryId === categoryId && progress[p.id]?.done !== true);
      if (!list.length) return;
      const at = list.findIndex((p) => p.id === focus?.id);
      setHidden((prev) => {
        if (!prev.has(categoryId)) return prev;
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
      focusPin(list[(at + 1) % list.length].id);
    },
    [progress, focus, focusPin],
  );

  const toggleCategory = useCallback((id: CategoryId) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(""), 2200);
  };

  const onExport = async () => {
    flash((await copyText(await exportCode())) ? t("ui.backup.copied") : "Copy failed");
  };
  const onImport = async () => {
    const code = window.prompt(t("ui.backup.prompt"));
    if (!code) return;
    try {
      await importCode(code);
      flash(t("ui.backup.restored"));
    } catch {
      flash(t("ui.backup.invalid"));
    }
  };

  const devMarkers = useMemo(() => devTool.captures.map((c) => c.coord), [devTool.captures]);
  const calibrationMarkers = useMemo(() => devTool.calib.points.map((p) => p.image), [devTool.calib.points]);

  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader compact />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <main className="relative order-1 min-h-0 flex-1 md:order-2">
        <MapView
          def={DEF}
          pins={visiblePins}
          categories={CATEGORY_MAP}
          isDone={isDone}
          onToggle={toggle}
          onMapClick={dev ? devTool.capture : undefined}
          devMarkers={dev ? devMarkers : undefined}
          calibrationMarkers={dev && devTool.calib.active ? calibrationMarkers : undefined}
          focus={focus}
        />
        {dev && (
          <span className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-neon">
            {devTool.calib.active ? "Calibrating" : "Dev mode"}
          </span>
        )}
        <details className="absolute right-3 top-3 z-[500] rounded-2xl border border-line-strong bg-[#1f1335]/90 px-3 py-2 text-xs backdrop-blur-md">
          <summary className="cursor-pointer font-extrabold uppercase tracking-widest text-muted">{t("ui.map.legend")}</summary>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-[#fff4ec] bg-accent2" />{t("ui.map.legend.verified")}</li>
            <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-[#fff4ec] bg-accent2" />{t("ui.map.legend.unverified")}</li>
            <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-accent2 bg-accent2/20" />{t("ui.map.legend.found")}</li>
            <li className="flex items-center gap-2"><span className="atlas-cluster h-4 w-4 text-[9px]">3</span>{t("ui.map.legend.cluster")}</li>
          </ul>
        </details>
      </main>

      <aside
        className="order-2 max-h-[46dvh] w-full shrink-0 space-y-4 overflow-y-auto border-t border-line bg-[#140c22] p-4 md:order-1 md:max-h-none md:w-[360px] md:border-r md:border-t-0"
        aria-label="Map controls"
      >
        <section className="card-solid" aria-label="Progress">
          <div className="flex items-end justify-between">
            <p className="font-display text-5xl leading-none">{ready ? summary.percent : 0}%</p>
            <p className="pb-1 text-sm font-bold uppercase tracking-wider text-muted">{t("ui.progress.complete")}</p>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={summary.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-sun transition-[width] duration-300" style={{ width: `${summary.percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">{t("ui.progress.found", { done: summary.done, total: summary.total })}</p>
        </section>

        {dev && <DevPanel dev={devTool} categories={CATEGORIES} />}

        <section aria-label={t("ui.search.label")} className="relative">
          <label className="field">
            <span className="sr-only">{t("ui.search.label")}</span>
            <input
              type="search"
              value={query}
              placeholder={t("ui.search.placeholder")}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </label>
          {query.trim().length >= 2 && (
            <ul className="mt-2 space-y-1">
              {results.length === 0 && <li className="text-sm text-muted">{t("ui.search.empty")}</li>}
              {results.map(({ pin, title }) => {
                const c = CATEGORY_MAP[pin.categoryId];
                return (
                  <li key={pin.id}>
                    <button type="button" className="row min-h-[40px] text-sm" onClick={() => focusPin(pin.id)}>
                      <span className="dot !h-3 !w-3" style={{ background: c ? CATEGORY_COLORS[c.colorToken] : undefined }} />
                      <span className="flex-1 truncate text-left">{title}</span>
                      {isDone(pin.id) && <span aria-hidden="true">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label={t("ui.filters.title")}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted">{t("ui.filters.title")}</h2>
            <div className="flex gap-3 text-xs font-bold underline">
              <button type="button" onClick={() => setHidden(new Set())}>{t("ui.filters.all")}</button>
              <button type="button" onClick={() => setHidden(new Set(CATEGORIES.map((c) => c.id)))}>{t("ui.filters.none")}</button>
            </div>
          </div>
          <ul className="space-y-1.5">
            {CATEGORIES.map((c) => {
              const pair = summary.byCategory[c.id] ?? { done: 0, total: 0 };
              const on = !hidden.has(c.id);
              const name = t(categoryKey(c.id));
              return (
                <li key={c.id} className="flex gap-1.5">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCategory(c.id)}
                    className={`row flex-1 ${on ? "" : "row-off"}`}
                  >
                    <span className="dot" style={{ background: CATEGORY_COLORS[c.colorToken], color: CATEGORY_COLORS[c.colorToken] }} />
                    <span className="flex-1 text-left">{name}</span>
                    <span className="text-sm tabular-nums text-muted">{pair.done}/{pair.total}</span>
                  </button>
                  <button
                    type="button"
                    className="row w-11 shrink-0 justify-center px-0 text-lg text-muted hover:text-accent2 disabled:opacity-30"
                    onClick={() => nextUnfound(c.id)}
                    disabled={pair.done >= pair.total}
                    aria-label={t("ui.filters.next", { category: name })}
                    title={t("ui.filters.next", { category: name })}
                  >
                    →
                  </button>
                </li>
              );
            })}
          </ul>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
            {t("ui.filters.hideDone")}
          </label>
        </section>

        <section aria-label={t("ui.backup.title")}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t("ui.backup.title")}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={onExport} disabled={!ready}>{t("ui.backup.export")}</button>
            <button type="button" className="btn" onClick={onImport} disabled={!ready}>{t("ui.backup.import")}</button>
          </div>
          <p className="mt-2 text-xs text-muted">{t("ui.backup.note")}</p>
          <p className="h-4 text-xs font-bold text-accent2" role="status" aria-live="polite">{note}</p>
        </section>

        <footer className="text-[11px] leading-snug text-muted">{SITE.disclaimer}</footer>
      </aside>
      </div>
    </div>
  );
}
