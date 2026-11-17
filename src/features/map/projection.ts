import L from "leaflet";
import type { Coord, MapDef } from "@/domain";

const CRS = L.CRS.Simple;

export interface MapProjection {
  /** Zoom level at which 1 map unit == 1 source pixel. */
  nativeZoom: number;
  maxZoom: number;
  bounds: L.LatLngBounds;
  toLatLng(c: Coord): L.LatLng;
  /** Normalized coordinate (0..1). May fall outside 0..1 when clicking beyond the image. */
  toCoord(ll: L.LatLng): [number, number];
}

/** One pipeline for image and tile maps: normalized -> source pixels -> CRS.Simple lat/lng. */
export function createProjection(def: MapDef): MapProjection {
  const { width, height } = def.imageSize;
  const isTiles = def.source.kind === "tiles";
  const nativeZoom =
    def.source.kind === "tiles"
      ? def.source.maxNativeZoom
      : Math.max(0, Math.ceil(Math.log2(Math.max(width, height) / 256)));

  const toLatLng = (c: Coord) => CRS.pointToLatLng(L.point(c[0] * width, c[1] * height), nativeZoom);
  const toCoord = (ll: L.LatLng): [number, number] => {
    const p = CRS.latLngToPoint(ll, nativeZoom);
    return [p.x / width, p.y / height];
  };
  const bounds = L.latLngBounds(toLatLng([0, 1]), toLatLng([1, 0]));

  return { nativeZoom, maxZoom: nativeZoom + (isTiles ? 2 : 2), bounds, toLatLng, toCoord };
}
