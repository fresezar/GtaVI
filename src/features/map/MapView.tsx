"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category, CategoryId, Coord, MapDef, PinId, PlacedPin as Pin } from "@/domain";
import type { Translate } from "@/i18n";
import { createProjection, type MapProjection } from "./projection";
import type { MapOverlays } from "./overlays";
import { CATEGORY_COLORS, PIN_OUTLINE } from "./tokens";

interface Props {
  def: MapDef;
  /** Already filtered by category / hide-completed. */
  pins: readonly Pin[];
  categories: Readonly<Record<CategoryId, Category>>;
  isDone: (ref: string) => boolean;
  /** Pin tapped (id) or empty map tapped (null). The card itself is rendered by the parent. */
  onSelect: (id: PinId | null) => void;
  selectedId: PinId | null;
  /** Translator for the page's language (map controls are built outside React). */
  t: Translate;
  /** Present only in dev mode. `coord` = pin frame coordinate, `image` = raw position on this image. */
  onMapClick?: (coord: [number, number], image: [number, number]) => void;
  /** Captured pins, in frame coordinates. */
  devMarkers?: readonly (readonly [number, number])[];
  /** Calibration clicks, in image coordinates. */
  calibrationMarkers?: readonly (readonly [number, number])[];
  /** Change `nonce` to re-focus the same pin (e.g. picking it twice from search). */
  focus?: { id: PinId; nonce: number } | null;
  /** Regions, district labels and named places (GTADB). Drawn under the pins; never part of progress. */
  overlays?: MapOverlays | null;
  showRegions?: boolean;
  showPlaces?: boolean;
  /** Change `nonce` to fly to a named place and open its label. */
  placeFocus?: { id: string; nonce: number } | null;
}

export type MapFocus = NonNullable<Props["focus"]>;

/**
 * Pins are drawn as diamonds (map "blips"), not circles. A CircleMarker subclass whose canvas path is a
 * rhombus; hit-testing stays the circle's (radius), which matches the diamond closely enough.
 * Uses Leaflet 1.9 canvas internals (_drawing, _empty, _fillStroke) the same way its own _updateCircle does.
 */
type CanvasInternals = { _drawing: boolean; _ctx: CanvasRenderingContext2D; _fillStroke(ctx: CanvasRenderingContext2D, layer: unknown): void };
type MarkerInternals = { _point: L.Point; _radius: number; _empty(): boolean; _renderer: CanvasInternals & { _updateCircle(l: unknown): void } };
const DiamondMarker = L.CircleMarker.extend({
  _updatePath(this: MarkerInternals) {
    const r = this._renderer;
    if (!(r instanceof L.Canvas)) return r._updateCircle(this);
    if (!r._drawing || this._empty()) return;
    const { x, y } = this._point;
    const d = Math.max(Math.round(this._radius * 1.25), 1);
    const ctx = r._ctx;
    ctx.beginPath();
    ctx.moveTo(x, y - d);
    ctx.lineTo(x + d, y);
    ctx.lineTo(x, y + d);
    ctx.lineTo(x - d, y);
    ctx.closePath();
    r._fillStroke(ctx, this);
  },
}) as unknown as new (latlng: L.LatLngExpression, options?: L.CircleMarkerOptions) => L.CircleMarker;

/** Screen-space clustering: below this many zoom levels under native, nearby pins merge into a counted bubble. */
const CLUSTER_BELOW = 1;
const CLUSTER_CELL_PX = 72;

function markerStyle(pin: Pin, category: Category | undefined, done: boolean, selected: boolean): L.CircleMarkerOptions {
  const color = category ? CATEGORY_COLORS[category.colorToken] : "#888888";
  return {
    radius: selected ? 12 : 8,
    color: selected ? "#ffffff" : done ? color : PIN_OUTLINE,
    weight: selected ? 4 : done ? 3 : 2,
    fillColor: color,
    fillOpacity: done && !selected ? 0.22 : 1,
    dashArray: pin.status === "verified" || selected ? undefined : "2 3",
  };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent only: no HTML injection
  return node;
}

/**
 * Hide labels that would overlap one already shown. Elements come in priority order (largest region first);
 * hidden ones get "is-hidden" (CSS), and a hovered region's name always shows (".is-hot").
 */
function declutter(labels: readonly HTMLElement[], pad = 4) {
  const kept: DOMRect[] = [];
  for (const el of labels) {
    if (!el.isConnected) continue;
    el.classList.remove("is-hidden");
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const hit = kept.some((k) => r.left < k.right + pad && r.right > k.left - pad && r.top < k.bottom + pad && r.bottom > k.top - pad);
    if (hit) el.classList.add("is-hidden");
    else kept.push(r);
  }
}

/** Zoom bands under native zoom: regions only (far), + districts and place dots (mid), + place names (near). */
const MID_BELOW = 2.5;
const NEAR_BELOW = 1;
const MAX_PLACE_LABELS = 220;

export default function MapView({
  def,
  pins,
  categories,
  isDone,
  onSelect,
  selectedId,
  t,
  onMapClick,
  devMarkers,
  calibrationMarkers,
  focus,
  overlays,
  showRegions = true,
  showPlaces = true,
  placeFocus,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const projRef = useRef<MapProjection | null>(null);
  const pinGroupRef = useRef<L.LayerGroup | null>(null);
  const devGroupRef = useRef<L.LayerGroup | null>(null);
  const rendererRef = useRef<L.Canvas | null>(null);
  const markersRef = useRef(new Map<PinId, L.CircleMarker>());
  const focusedRef = useRef<number | null>(null);
  const renderRef = useRef<() => void>(() => {});
  const overlayRef = useRef<() => void>(() => {});
  const placeMarkersRef = useRef(new Map<string, L.CircleMarker>());

  // Latest callbacks/state for event handlers without re-binding.
  const live = useRef({ isDone, onSelect, onMapClick, categories, selectedId });
  useEffect(() => {
    live.current = { isDone, onSelect, onMapClick, categories, selectedId };
  });

  // 1) Create the map once per map definition.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const proj = createProjection(def);
    projRef.current = proj;

    const map = L.map(container, {
      crs: L.CRS.Simple,
      minZoom: -10,
      maxZoom: proj.maxZoom,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      maxBoundsViscosity: 0.85,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    if (def.attribution) {
      // Built with DOM nodes (textContent), never an HTML string: attribution text is data.
      const credit = L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);
      const box = document.createElement("span");
      const text = t("ui.map.attribution", { name: def.attribution.name });
      // An https link opens the source; a site path ("/privacy/#credits") opens our credits page.
      if (def.attribution.url && /^(https:\/\/|\/)/.test(def.attribution.url)) {
        const a = el("a", undefined, text);
        a.href = def.attribution.url;
        if (def.attribution.url.startsWith("https://")) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        box.append(a);
      } else box.textContent = text;
      credit.getContainer()?.append(box);
    }

    if (def.source.kind === "image") {
      L.imageOverlay(def.source.url, proj.bounds).addTo(map);
    } else {
      L.tileLayer(def.source.urlTemplate, {
        tileSize: def.source.tileSize,
        minNativeZoom: def.source.minNativeZoom,
        maxNativeZoom: def.source.maxNativeZoom,
        maxZoom: proj.maxZoom,
        noWrap: true,
        bounds: proj.viewBounds,
      }).addTo(map);
    }
    if (def.background) container.style.background = def.background;

    map.invalidateSize();
    const fit = map.getBoundsZoom(proj.viewBounds, false);
    // Start one tick in: at the bare fit zoom the far-out tiles read as empty sea. Don't let the
    // user zoom back out past the fit, so the blank over-zoom is never shown.
    map.setMinZoom(fit);
    map.setView(proj.viewBounds.getCenter(), fit + 1);
    map.setMaxBounds(proj.viewBounds.pad(0.2));

    rendererRef.current = L.canvas({ padding: 0.5, tolerance: 8 });
    pinGroupRef.current = L.layerGroup().addTo(map);
    // Text labels sit above the pins' canvas and never catch the pointer.
    // Above the cluster bubbles (markerPane 600) so region names stay readable; clicks pass through.
    const labelPane = map.createPane("labels");
    labelPane.style.zIndex = "650";
    labelPane.style.pointerEvents = "none";
    devGroupRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const handler = live.current.onMapClick;
      if (!handler) {
        live.current.onSelect(null); // tapping empty map closes the card
        return;
      }
      const image = proj.toImageCoord(e.latlng);
      if (image[0] < 0 || image[0] > 1 || image[1] < 0 || image[1] > 1) return; // clicked outside the artwork
      handler(proj.toCoord(e.latlng), image);
    });

    // After every zoom/pan: overlays first, then pins (re-added last, so they stay on top in the shared canvas).
    const band = () => {
      const z = map.getZoom();
      container.dataset.band = z < proj.nativeZoom - MID_BELOW ? "far" : z < proj.nativeZoom - NEAR_BELOW ? "mid" : "near";
    };
    band();
    map.on("zoomend moveend", () => {
      band();
      overlayRef.current();
      renderRef.current();
    });

    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      projRef.current = null;
      markers.clear();
    };
  }, [def]);

  // 2) Rebuild markers when the visible pin set changes, then place them (clustered or not).
  useEffect(() => {
    const map = mapRef.current;
    const proj = projRef.current;
    const group = pinGroupRef.current;
    const renderer = rendererRef.current;
    if (!map || !proj || !group || !renderer) return;

    renderRef.current = () => {
      group.clearLayers();
      const markers = markersRef.current;
      const zoom = map.getZoom();
      if (zoom >= proj.nativeZoom - CLUSTER_BELOW) {
        markers.forEach((m) => group.addLayer(m));
        return;
      }
      const view = map.getBounds().pad(0.3);
      const buckets = new Map<string, L.CircleMarker[]>();
      markers.forEach((m) => {
        if (!view.contains(m.getLatLng())) return;
        const p = map.project(m.getLatLng(), zoom);
        const key = `${Math.floor(p.x / CLUSTER_CELL_PX)}:${Math.floor(p.y / CLUSTER_CELL_PX)}`;
        const list = buckets.get(key);
        if (list) list.push(m);
        else buckets.set(key, [m]);
      });
      buckets.forEach((members) => {
        if (members.length === 1) {
          group.addLayer(members[0]);
          return;
        }
        const lls = members.map((m) => m.getLatLng());
        const pts = lls.map((ll) => map.project(ll, zoom));
        const center = map.unproject(
          L.point(pts.reduce((s, p) => s + p.x, 0) / pts.length, pts.reduce((s, p) => s + p.y, 0) / pts.length),
          zoom,
        );
        const size = Math.round(20 + Math.min(14, Math.log2(members.length) * 3.2));
        L.marker(center, {
          icon: L.divIcon({
            className: "",
            // Only a number goes into this HTML: no user text.
            html: `<div class="atlas-cluster" style="width:${size}px;height:${size}px">${members.length}</div>`,
            iconSize: [size, size],
          }),
          title: `${members.length} pins: zoom in`,
          keyboard: true,
        })
          .on("click", () => map.fitBounds(L.latLngBounds(lls), { padding: [48, 48], maxZoom: proj.nativeZoom - CLUSTER_BELOW }))
          .addTo(group);
      });
    };

    group.clearLayers();
    markersRef.current.clear();
    for (const pin of pins) {
      const category = live.current.categories[pin.categoryId];
      const latlng = proj.toLatLng(pin.coord);
      const marker = new DiamondMarker(latlng, {
        ...markerStyle(pin, category, live.current.isDone(pin.id), live.current.selectedId === pin.id),
        renderer,
        bubblingMouseEvents: false,
      });
      marker.on("click", () => live.current.onSelect(pin.id));
      markersRef.current.set(pin.id, marker);
    }
    renderRef.current();
  }, [pins, def]);

  // 3) Cheap restyle when only progress or the selection changes.
  useEffect(() => {
    const byId = new Map(pins.map((p) => [p.id, p] as const));
    markersRef.current.forEach((marker, id) => {
      const pin = byId.get(id);
      if (!pin) return;
      marker.setStyle(markerStyle(pin, live.current.categories[pin.categoryId], isDone(pin.id), id === selectedId));
      if (id === selectedId) marker.bringToFront();
    });
  }, [isDone, pins, selectedId]);

  // 4) Focus a pin: deep link /map?pin=<id> or a search pick. Waits until the marker exists.
  useEffect(() => {
    const map = mapRef.current;
    const proj = projRef.current;
    if (!map || !proj || !focus || focusedRef.current === focus.nonce) return;
    const marker = markersRef.current.get(focus.id);
    if (!marker) return;
    focusedRef.current = focus.nonce;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), proj.nativeZoom - 1));
    marker.fire("click");
  }, [focus, pins]);

  // 6) Overlays: coloured regions (hover lights the border), region and district names, named places.
  useEffect(() => {
    const map = mapRef.current;
    const proj = projRef.current;
    const renderer = rendererRef.current;
    if (!map || !proj || !renderer || !overlays) return;
    const n = proj.nativeZoom;
    const regionGroup = L.layerGroup();
    const regionLabels = L.layerGroup();
    const districtLabels = L.layerGroup();
    const placeGroup = L.layerGroup();
    const placeLabels = L.layerGroup();
    const placeMarkers = placeMarkersRef.current;
    // Label elements in priority order for decluttering: regions (largest first), then districts, then places.
    const regionEls: HTMLElement[] = [];
    const districtEls: HTMLElement[] = [];
    let placeEls: HTMLElement[] = [];
    let raf = 0;
    const label = (latlng: L.LatLng, node: HTMLElement) =>
      L.marker(latlng, { pane: "labels", interactive: false, keyboard: false, icon: L.divIcon({ className: "map-label-anchor", html: node, iconSize: [0, 0] }) });

    // Fill strength by zoom: strong far out (the colours tell regions apart), faint up close (the map shows through).
    let fill = 0.16;
    const polys: { poly: L.Polygon; hot: boolean }[] = [];
    for (const r of overlays.regions) {
      const base = (): L.PathOptions => ({ renderer, color: r.color, weight: 1.5, opacity: 0.75, fillColor: r.color, fillOpacity: fill });
      const poly = L.polygon(
        r.rings.map((ring) => ring.map((c) => proj.toLatLng(c))),
        base(),
      );
      const entry = { poly, hot: false };
      polys.push(entry);
      const name = el("span", "map-label map-label-region", r.name);
      name.style.setProperty("--region", r.color);
      poly.on("mouseover", () => {
        entry.hot = true;
        poly.setStyle({ weight: 3.5, opacity: 1, fillOpacity: fill + 0.14 });
        name.classList.add("is-hot");
      });
      poly.on("mouseout", () => {
        entry.hot = false;
        poly.setStyle(base());
        name.classList.remove("is-hot");
      });
      // Far out, a tap on a region zooms into it (not while picking a spot for a suggestion).
      poly.on("click", () => {
        if (!live.current.onMapClick && map.getZoom() < n - MID_BELOW) map.fitBounds(poly.getBounds(), { padding: [32, 32] });
      });
      regionGroup.addLayer(poly);
      regionLabels.addLayer(label(proj.toLatLng(r.label), name));
      regionEls.push(name);
    }
    for (const d of overlays.districts) {
      const node = el("span", "map-label map-label-district", d.name);
      districtLabels.addLayer(label(proj.toLatLng(d.label), node));
      districtEls.push(node);
    }

    placeMarkers.clear();
    for (const p of overlays.places) {
      const tip = el("span", "place-tip-body");
      tip.append(el("b", undefined, p.name));
      const where = [p.district, p.area].filter((x) => x && x !== p.name).join(", ");
      if (where) tip.append(el("span", undefined, where));
      if (p.unconfirmed) tip.append(el("em", undefined, t("ui.map.place.unconfirmed")));
      const m = L.circleMarker(proj.toLatLng(p.coord), {
        renderer,
        radius: 3.5,
        color: "#0B1422",
        weight: 1.5,
        fillColor: p.unconfirmed ? "#9aa6b6" : "#fff4ec",
        fillOpacity: 0.95,
      }).bindTooltip(tip, { direction: "top", offset: [0, -4], className: "place-tip" });
      placeGroup.addLayer(m);
      placeMarkers.set(p.id, m);
    }

    const show = (g: L.LayerGroup, on: boolean) => {
      if (on && !map.hasLayer(g)) g.addTo(map);
      if (!on && map.hasLayer(g)) map.removeLayer(g);
    };
    overlayRef.current = () => {
      const z = map.getZoom();
      const nextFill = z < n - MID_BELOW ? 0.16 : z < n - NEAR_BELOW ? 0.1 : 0.05;
      if (nextFill !== fill) {
        fill = nextFill;
        for (const p of polys) if (!p.hot) p.poly.setStyle({ fillOpacity: fill });
      }
      show(regionGroup, showRegions);
      show(regionLabels, showRegions);
      show(districtLabels, showRegions && z >= n - MID_BELOW);
      show(placeGroup, showPlaces && z >= n - MID_BELOW);
      placeLabels.clearLayers();
      placeEls = [];
      if (showPlaces && z >= n - NEAR_BELOW) {
        const view = map.getBounds().pad(0.15);
        let count = 0;
        for (const p of overlays.places) {
          const ll = proj.toLatLng(p.coord);
          if (!view.contains(ll)) continue;
          const node = el("span", "map-label map-label-place", p.name);
          placeLabels.addLayer(label(ll, node));
          placeEls.push(node);
          if (++count >= MAX_PLACE_LABELS) break;
        }
      }
      show(placeLabels, showPlaces && z >= n - NEAR_BELOW);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => declutter([...regionEls, ...districtEls, ...placeEls]));
    };
    overlayRef.current();
    renderRef.current(); // pins back on top of the newly drawn overlays

    return () => {
      overlayRef.current = () => {};
      cancelAnimationFrame(raf);
      for (const g of [regionGroup, regionLabels, districtLabels, placeGroup, placeLabels]) map.removeLayer(g);
      placeMarkers.clear();
    };
  }, [overlays, def, showRegions, showPlaces, t]);

  // 7) Fly to a named place (search pick) and open its label.
  useEffect(() => {
    const map = mapRef.current;
    const proj = projRef.current;
    if (!map || !proj || !placeFocus) return;
    const marker = placeMarkersRef.current.get(placeFocus.id);
    if (!marker) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), proj.nativeZoom - NEAR_BELOW));
    const id = window.setTimeout(() => map.hasLayer(marker) && marker.openTooltip(), 450);
    return () => window.clearTimeout(id);
  }, [placeFocus, overlays]);

  // 5) Dev-mode markers (this session's captured points).
  useEffect(() => {
    const proj = projRef.current;
    const group = devGroupRef.current;
    if (!proj || !group) return;
    group.clearLayers();
    (devMarkers ?? []).forEach((c, i, all) => {
      L.circleMarker(proj.toLatLng(c), {
        radius: i === all.length - 1 ? 10 : 6,
        color: "#FF6A55",
        weight: 2,
        dashArray: "3 3",
        fillColor: "#FF6A55",
        fillOpacity: 0.15,
        interactive: false,
      }).addTo(group);
    });
    (calibrationMarkers ?? []).forEach((c, i) => {
      L.circleMarker(proj.imageToLatLng(c), {
        radius: 9,
        color: "#19B5A5",
        weight: 3,
        fillColor: "#19B5A5",
        fillOpacity: 0.25,
        interactive: false,
      })
        .bindTooltip(String(i + 1), { permanent: true, direction: "top" })
        .addTo(group);
    });
  }, [devMarkers, calibrationMarkers, def]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      data-dev={onMapClick ? "true" : "false"}
      role="application"
      aria-label="Interactive map"
    />
  );
}
