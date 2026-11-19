import L from "leaflet";
import type { Coord, MapDef } from "@/domain";
import { applyAffine, fitAffine, IDENTITY, invertAffine, type Affine } from "@/lib/affine";

const CRS = L.CRS.Simple;

export interface MapProjection {
  /** Zoom level at which 1 map unit == 1 source pixel. */
  nativeZoom: number;
  maxZoom: number;
  bounds: L.LatLngBounds;
  /** `def.view` (the land) or the whole image: fit, pan limit and tile requests use this. */
  viewBounds: L.LatLngBounds;
  /** Pin (frame) coordinate -> map position. Applies calibration when the map has one. */
  toLatLng(c: Coord): L.LatLng;
  /** Map position -> pin (frame) coordinate. What new pins are saved with. */
  toCoord(ll: L.LatLng): [number, number];
  /** Map position -> raw position on this image (0..1 inside the image). Used for bounds and calibration. */
  toImageCoord(ll: L.LatLng): [number, number];
  imageToLatLng(c: readonly [number, number]): L.LatLng;
}

export function frameToImageTransform(def: MapDef): Affine {
  const points = def.calibration?.points ?? [];
  if (points.length < 3) return IDENTITY;
  return fitAffine(points.map((p) => ({ from: p.frame, to: p.image })));
}

/** One pipeline for image and tile maps: frame -> (calibration) -> image 0..1 -> source pixels -> CRS.Simple. */
export function createProjection(def: MapDef): MapProjection {
  const { width, height } = def.imageSize;
  const isTiles = def.source.kind === "tiles";
  const nativeZoom =
    def.source.kind === "tiles"
      ? def.source.maxNativeZoom
      : Math.max(0, Math.ceil(Math.log2(Math.max(width, height) / 256)));

  const fwd = frameToImageTransform(def);
  const inv = invertAffine(fwd);

  const imageToLatLng = (c: readonly [number, number]) => CRS.pointToLatLng(L.point(c[0] * width, c[1] * height), nativeZoom);
  const toImageCoord = (ll: L.LatLng): [number, number] => {
    const p = CRS.latLngToPoint(ll, nativeZoom);
    return [p.x / width, p.y / height];
  };
  const toLatLng = (c: Coord) => imageToLatLng(applyAffine(fwd, c));
  const toCoord = (ll: L.LatLng) => applyAffine(inv, toImageCoord(ll));
  const bounds = L.latLngBounds(imageToLatLng([0, 1]), imageToLatLng([1, 0]));
  const viewBounds = def.view
    ? L.latLngBounds(imageToLatLng([def.view.min[0], def.view.max[1]]), imageToLatLng([def.view.max[0], def.view.min[1]]))
    : bounds;

  return { nativeZoom, maxZoom: nativeZoom + (isTiles ? 2 : 2), bounds, viewBounds, toLatLng, toCoord, toImageCoord, imageToLatLng };
}
