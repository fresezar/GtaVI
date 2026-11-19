"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category, CategoryId, Coord, MapDef, PinId, PlacedPin as Pin } from "@/domain";
import type { Translate } from "@/i18n";
import { createProjection, type MapProjection } from "./projection";
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
}

export type MapFocus = NonNullable<Props["focus"]>;

/** Screen-space clustering: below this many zoom levels under native, nearby pins merge into a counted bubble. */
const CLUSTER_BELOW = 1;
const CLUSTER_CELL_PX = 56;

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

export default function MapView({ def, pins, categories, isDone, onSelect, selectedId, t, onMapClick, devMarkers, calibrationMarkers, focus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const projRef = useRef<MapProjection | null>(null);
  const pinGroupRef = useRef<L.LayerGroup | null>(null);
  const devGroupRef = useRef<L.LayerGroup | null>(null);
  const rendererRef = useRef<L.Canvas | null>(null);
  const markersRef = useRef(new Map<PinId, L.CircleMarker>());
  const focusedRef = useRef<number | null>(null);
  const renderRef = useRef<() => void>(() => {});

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
      if (def.attribution.url && /^https?:\/\//.test(def.attribution.url)) {
        const a = el("a", undefined, text);
        a.href = def.attribution.url;
        a.target = "_blank";
        a.rel = "noopener";
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

    // Re-cluster after every zoom/pan (cheap: a grid pass over the pins in view).
    map.on("zoomend moveend", () => renderRef.current());

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
        const size = Math.round(28 + Math.min(20, Math.log2(members.length) * 5));
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
      const marker = L.circleMarker(latlng, {
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
