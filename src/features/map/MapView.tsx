"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category, CategoryId, Coord, MapDef, Pin, PinId } from "@/domain";
import { t } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";
import { createProjection, type MapProjection } from "./projection";
import { CATEGORY_COLORS, PIN_OUTLINE } from "./tokens";

interface Props {
  def: MapDef;
  /** Already filtered by category / hide-completed. */
  pins: readonly Pin[];
  categories: Readonly<Record<CategoryId, Category>>;
  isDone: (ref: string) => boolean;
  onToggle: (ref: string) => void;
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

function markerStyle(pin: Pin, category: Category | undefined, done: boolean): L.CircleMarkerOptions {
  const color = category ? CATEGORY_COLORS[category.colorToken] : "#888888";
  return {
    radius: 8,
    color: done ? color : PIN_OUTLINE,
    weight: done ? 3 : 2,
    fillColor: color,
    fillOpacity: done ? 0.22 : 1,
    dashArray: pin.status === "verified" ? undefined : "2 3",
  };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent only: no HTML injection
  return node;
}

function buildPopup(
  pin: Pin,
  category: Category | undefined,
  isDone: (ref: string) => boolean,
  onToggle: (ref: string) => void,
): HTMLElement {
  const root = el("div", "atlas-pop");
  const chip = el("span", "chip", category ? t(categoryKey(category.id)) : "");
  if (category) chip.style.setProperty("--dot", CATEGORY_COLORS[category.colorToken]);
  const status = el("span", `status status-${pin.status}`, t(`ui.pin.status.${pin.status}`));
  const head = el("div", "atlas-pop-head");
  head.append(chip, status);

  root.append(head, el("h3", "atlas-pop-title", t(pinKey(pin.id, "title"))));

  const descKey = pinKey(pin.id, "description");
  const desc = t(descKey);
  if (desc !== descKey && desc) {
    if (pin.spoilerLevel === "none") {
      root.append(el("p", "atlas-pop-desc", desc));
    } else {
      const details = el("details", "atlas-pop-spoiler");
      details.append(el("summary", undefined, t("ui.pin.spoiler")), el("p", "atlas-pop-desc", desc));
      root.append(details);
    }
  }
  if (pin.credit) root.append(el("p", "atlas-pop-credit", t("ui.pin.foundBy", { name: pin.credit.name })));

  let done = isDone(pin.id);
  const btn = el("button", "btn btn-primary", done ? t("ui.pin.markUndone") : t("ui.pin.markDone"));
  btn.type = "button";
  btn.addEventListener("click", () => {
    onToggle(pin.id);
    done = !done;
    btn.textContent = done ? t("ui.pin.markUndone") : t("ui.pin.markDone");
  });
  const link = el("a", "atlas-pop-link", t("ui.pin.openPage"));
  link.href = `/pins/${pin.slug}`;
  const actions = el("div", "atlas-pop-actions");
  actions.append(btn, link);
  root.append(actions);
  return root;
}

export default function MapView({ def, pins, categories, isDone, onToggle, onMapClick, devMarkers, calibrationMarkers, focus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const projRef = useRef<MapProjection | null>(null);
  const pinGroupRef = useRef<L.LayerGroup | null>(null);
  const devGroupRef = useRef<L.LayerGroup | null>(null);
  const rendererRef = useRef<L.Canvas | null>(null);
  const markersRef = useRef(new Map<PinId, L.CircleMarker>());
  const focusedRef = useRef<number | null>(null);

  // Latest callbacks/state for event handlers without re-binding.
  const live = useRef({ isDone, onToggle, onMapClick, categories });
  useEffect(() => {
    live.current = { isDone, onToggle, onMapClick, categories };
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
        bounds: proj.bounds,
      }).addTo(map);
    }

    map.invalidateSize();
    map.fitBounds(proj.bounds);
    const fit = map.getBoundsZoom(proj.bounds, false);
    map.setMinZoom(fit - 1);
    map.setMaxBounds(proj.bounds.pad(0.3));

    rendererRef.current = L.canvas({ padding: 0.5, tolerance: 8 });
    pinGroupRef.current = L.layerGroup().addTo(map);
    devGroupRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const handler = live.current.onMapClick;
      if (!handler) return;
      const image = proj.toImageCoord(e.latlng);
      if (image[0] < 0 || image[0] > 1 || image[1] < 0 || image[1] > 1) return; // clicked outside the artwork
      handler(proj.toCoord(e.latlng), image);
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

  // 2) Rebuild markers when the visible pin set changes.
  useEffect(() => {
    const map = mapRef.current;
    const proj = projRef.current;
    const group = pinGroupRef.current;
    const renderer = rendererRef.current;
    if (!map || !proj || !group || !renderer) return;

    group.clearLayers();
    markersRef.current.clear();
    for (const pin of pins) {
      const category = live.current.categories[pin.categoryId];
      const latlng = proj.toLatLng(pin.coord);
      const marker = L.circleMarker(latlng, {
        ...markerStyle(pin, category, live.current.isDone(pin.id)),
        renderer,
        bubblingMouseEvents: false,
      });
      marker.on("click", () => {
        L.popup({ className: "atlas-popup", maxWidth: 260, autoPanPadding: [24, 24] })
          .setLatLng(latlng)
          .setContent(buildPopup(pin, category, live.current.isDone, live.current.onToggle))
          .openOn(map);
      });
      marker.addTo(group);
      markersRef.current.set(pin.id, marker);
    }
  }, [pins, def]);

  // 3) Cheap restyle when only progress changes.
  useEffect(() => {
    const byId = new Map(pins.map((p) => [p.id, p] as const));
    markersRef.current.forEach((marker, id) => {
      const pin = byId.get(id);
      if (pin) marker.setStyle(markerStyle(pin, live.current.categories[pin.categoryId], isDone(pin.id)));
    });
  }, [isDone, pins]);

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
