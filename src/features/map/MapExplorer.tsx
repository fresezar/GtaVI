"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isPlaced, type Category, type CategoryId, type PinId, type PlacedPin } from "@/domain";
import { CATEGORIES } from "@/data/categories";
import { MAPS } from "@/data/maps";
import { usePins, usePinText } from "@/features/pins/pinData";
import { SITE } from "@/config/site";
import Link from "next/link";
import { useHref, useLocale, useT } from "@/i18n/client";
import { categoryKey, pinKey } from "@/i18n/keys";
import { computeProgress } from "@/lib/progress";
import { copyText } from "@/lib/clipboard";
import DevPanel from "./DevPanel";
import MapView, { type MapFocus } from "./MapView";
import PinCard from "./PinCard";
import PageTransition from "@/components/ui/PageTransition";
import { useDevTool } from "./dev/useDevTool";
import SuggestPanel from "@/features/community/SuggestPanel";
import { useCommunityPins } from "@/features/community/useCommunityPins";
import { useProgress } from "@/hooks/useProgress";
import { CATEGORY_COLORS } from "./tokens";
import { useMapOverlays, type Place } from "./overlays";
import PlayBar from "./PlayBar";
import InstallButton from "@/components/ui/InstallButton";

const DEF = MAPS[0];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;
/** Every pin of this map: progress counts them all, placed or not. */
/** Pins arrive from /pin-data (usePins); these split them for the map. */
/** Only these can be drawn, focused or searched on the map. */
const DEFAULT_HIDDEN = new Set(CATEGORIES.filter((c) => c.hiddenByDefault).map((c) => c.id));
const SEARCH_LIMIT = 8;

export default function MapExplorer() {
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  // Approved community pins that are not baked into the static site yet (live from the API).
  const live = useCommunityPins();
  const { pins: loaded } = usePins();
  const textReady = usePinText(locale);
  const MAP_PINS = useMemo(() => loaded.filter((p) => p.mapId === DEF.id), [loaded]);
  const PLACED = useMemo(() => MAP_PINS.filter((p): p is typeof p & PlacedPin => isPlaced(p)), [MAP_PINS]);
  const UNPLACED_COUNT = MAP_PINS.length - PLACED.length;
  const LANDMARKS = useMemo(() => PLACED.filter((p) => p.categoryId === "cat_landmarks"), [PLACED]);
  // Live community pins already baked into the site are skipped (the static copy wins).
  const liveNew = useMemo(() => {
    const known = new Set(loaded.map((p) => p.id));
    return live.filter((p) => !known.has(p.id));
  }, [live, loaded]);
  const placed = useMemo(() => [...PLACED, ...liveNew], [PLACED, liveNew]);
  const allMapPins = useMemo(() => [...MAP_PINS, ...liveNew], [MAP_PINS, liveNew]);
  const searchIndex = useMemo(
    () => placed.map((p) => ({ pin: p, title: t(pinKey(p.id, "title")), haystack: t(pinKey(p.id, "title")).toLocaleLowerCase(locale) })),
    [t, locale, placed, textReady],
  );
  const overlays = useMapOverlays();
  const [showRegions, setShowRegions] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [placeFocus, setPlaceFocus] = useState<{ id: string; nonce: number } | null>(null);
  const placeIndex = useMemo(
    () => (overlays?.places ?? []).map((p) => ({ place: p, haystack: `${p.name} ${p.district} ${p.area}`.toLocaleLowerCase(locale) })),
    [overlays, locale],
  );
  const focusPlace = useCallback((p: Place) => {
    setShowPlaces(true);
    setPlaceFocus((f) => ({ id: p.id, nonce: (f?.nonce ?? 0) + 1 }));
  }, []);
  // Play mode ("second screen"): full-screen map on the phone next to the TV, big next/found controls.
  const [play, setPlay] = useState(false);
  const [dev, setDev] = useState(false);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<CategoryId>>(DEFAULT_HIDDEN);
  const [hideDone, setHideDone] = useState(false);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState<PinId | null>(null);
  const selectedPin = selectedId ? placed.find((p) => p.id === selectedId) ?? null : null;
  // "Suggest a pin" mode: the next map tap sets the spot; the form opens on the right (bottom sheet on phones).
  const [suggesting, setSuggesting] = useState(false);
  const [draft, setDraft] = useState<[number, number] | null>(null);

  /** Select a pin (or clear) and mirror it in the address bar, so a copied URL opens the same card. */
  const select = useCallback((id: PinId | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("pin", id);
    else url.searchParams.delete("pin");
    window.history.replaceState(null, "", url);
  }, []);

  const { ready, progress, isDone, toggle, exportCode, importCode } = useProgress(SITE.gameId);
  const devTool = useDevTool(dev, CATEGORIES, LANDMARKS);

  const focusPin = useCallback((id: PinId) => setFocus((f) => ({ id, nonce: (f?.nonce ?? 0) + 1 })), []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setDev(q.get("dev") === "true");
    if (q.get("suggest") === "1") setSuggesting(true);
    if (q.get("play") === "1") setPlay(true);
    const pin = q.get("pin");
    if (pin) focusPin(pin as PinId);
  }, [focusPin]);

  const summary = useMemo(() => computeProgress(allMapPins, CATEGORIES, progress), [progress, allMapPins]);

  // A focused or selected pin always shows, even if its layer is off or it is completed.
  const visiblePins = useMemo(
    () =>
      placed.filter(
        (p) =>
          p.id === focus?.id ||
          p.id === selectedId ||
          (!hidden.has(p.categoryId) && !(hideDone && progress[p.id]?.done === true)),
      ),
    [placed, hidden, hideDone, progress, focus, selectedId],
  );

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    if (q.length < 2) return [];
    return searchIndex.filter((r) => r.haystack.includes(q)).slice(0, SEARCH_LIMIT);
  }, [query, searchIndex, locale]);
  /** Named places fill the rest of the result list (pins first: they are what players track). */
  const placeResults = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    if (q.length < 2) return [];
    return placeIndex.filter((r) => r.haystack.includes(q)).slice(0, Math.max(3, SEARCH_LIMIT - results.length));
  }, [query, placeIndex, locale, results.length]);

  /** Jump to the next not-yet-found pin in a category (cycles), turning the layer on if needed. */
  const nextUnfound = useCallback(
    (categoryId: CategoryId) => {
      const list = placed.filter((p) => p.categoryId === categoryId && progress[p.id]?.done !== true);
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
    [placed, progress, focus, focusPin],
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

  useEffect(() => {
    const html = document.documentElement;
    if (play) html.dataset.play = "1";
    else delete html.dataset.play;
    const url = new URL(window.location.href);
    if (play) url.searchParams.set("play", "1");
    else url.searchParams.delete("play");
    window.history.replaceState(null, "", url);
    return () => {
      delete html.dataset.play;
    };
  }, [play]);

  const devMarkers = devTool.markers;
  const calibrationMarkers = useMemo(() => devTool.calib.points.map((p) => p.image), [devTool.calib.points]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageTransition>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <main className="relative order-1 min-h-0 flex-1 md:order-2">
        <MapView
          def={DEF}
          pins={visiblePins}
          categories={CATEGORY_MAP}
          isDone={isDone}
          onSelect={select}
          selectedId={selectedId}
          t={t}
          onMapClick={dev ? devTool.capture : suggesting ? (c) => setDraft(c) : undefined}
          devMarkers={dev ? devMarkers : suggesting && draft ? [draft] : undefined}
          calibrationMarkers={dev && devTool.calib.active ? calibrationMarkers : undefined}
          focus={focus}
          overlays={overlays}
          showRegions={showRegions}
          showPlaces={showPlaces}
          placeFocus={placeFocus}
        />
        {dev && (
          <span className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-neon">
            {devTool.calib.active ? "Kalibrasyon" : "Veri girişi"}
          </span>
        )}
        {!dev && !suggesting && !play && (
          <button
            type="button"
            className="btn absolute bottom-[5.5rem] left-3 z-[500] bg-panel/90"
            onClick={() => {
              select(null);
              setPlay(true);
            }}
          >
            ▶ {t("ui.play.enter")}
          </button>
        )}
        {play && (
          <PlayBar
            percent={ready ? summary.percent : 0}
            categories={CATEGORIES.filter((c) => (summary.byCategory[c.id]?.total ?? 0) > (summary.byCategory[c.id]?.done ?? 0))}
            onNext={nextUnfound}
            onExit={() => setPlay(false)}
          />
        )}
        {!dev && !suggesting && !play && (
          <button
            type="button"
            className="btn btn-primary absolute bottom-9 left-3 z-[500]"
            onClick={() => {
              select(null);
              setSuggesting(true);
            }}
          >
            + {t("ui.suggest.open")}
          </button>
        )}
        {suggesting && (
          <SuggestPanel
            coord={draft}
            categories={CATEGORIES}
            onClose={() => {
              setSuggesting(false);
              setDraft(null);
            }}
            onSent={() => setDraft(null)}
          />
        )}
        {selectedPin && !suggesting && (
          <PinCard
            key={selectedPin.id}
            pin={selectedPin}
            category={CATEGORY_MAP[selectedPin.categoryId]}
            done={isDone(selectedPin.id)}
            onToggle={() => toggle(selectedPin.id)}
            onClose={() => select(null)}
          />
        )}
        <details className="absolute left-3 top-3 z-[500] rounded-2xl border border-line-strong bg-panel/90 px-3 py-2 text-xs backdrop-blur-md">
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
        hidden={play}
        className="order-2 max-h-[46dvh] w-full shrink-0 space-y-4 overflow-y-auto border-t border-line bg-panel p-4 md:order-1 md:max-h-none md:w-[360px] md:border-r md:border-t-0"
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
          {UNPLACED_COUNT > 0 && (
            <Link href={href("/checklists/100-percent-completion")} className="mt-2 block text-xs font-bold text-sun underline">
              {t("ui.map.unplaced", { count: UNPLACED_COUNT })}
            </Link>
          )}
        </section>

        <InstallButton />

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
              {results.length === 0 && placeResults.length === 0 && <li className="text-sm text-muted">{t("ui.search.empty")}</li>}
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
              {placeResults.map(({ place }) => (
                <li key={place.id}>
                  <button type="button" className="row min-h-[40px] text-sm" onClick={() => focusPlace(place)}>
                    <span className="dot !h-3 !w-3 border-2 border-ink bg-transparent" />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate">{place.name}</span>
                      <span className="block truncate text-[11px] text-muted">{[place.district, place.area].filter(Boolean).join(", ")}</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("ui.search.place")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label={t("ui.map.layers.title")}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t("ui.map.layers.title")}</h2>
          <div className="space-y-1.5">
            <button type="button" aria-pressed={showRegions} onClick={() => setShowRegions((v) => !v)} className={`row w-full ${showRegions ? "" : "row-off"}`}>
              <span className="dot" style={{ background: "linear-gradient(135deg,#FF6A55,#9B7BFF,#2EE6D0)" }} />
              <span className="flex-1 text-left">{t("ui.map.layers.regions")}</span>
              <span className="text-sm tabular-nums text-muted">{overlays?.regions.length ?? ""}</span>
            </button>
            <button type="button" aria-pressed={showPlaces} onClick={() => setShowPlaces((v) => !v)} className={`row w-full ${showPlaces ? "" : "row-off"}`}>
              <span className="dot border-2 border-[#0B1422]" style={{ background: "#fff4ec" }} />
              <span className="flex-1 text-left">{t("ui.map.layers.places")}</span>
              <span className="text-sm tabular-nums text-muted">{overlays?.places.length ?? ""}</span>
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">{t("ui.map.layers.note")}</p>
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

        <footer className="text-[11px] leading-snug text-muted">{t("ui.footer.disclaimer")}</footer>
      </aside>
      </div>
      </PageTransition>
    </div>
  );
}
