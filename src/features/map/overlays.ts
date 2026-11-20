"use client";

import { useEffect, useState } from "react";
import type { Coord } from "@/domain";

/**
 * Map overlays built by scripts/build-places.mjs from GTADB (CC BY 4.0): coloured regions with borders,
 * district labels and named places. Static files in public/data, fetched when the map opens.
 * Places are context, not collectibles: they never count toward progress or checklists.
 */
export interface Region {
  id: string;
  name: string;
  color: string;
  label: Coord;
  rings: Coord[][];
}
export interface District {
  name: string;
  area: string;
  label: Coord;
}
export interface Place {
  id: string;
  name: string;
  district: string;
  area: string;
  coord: Coord;
  type: string;
  unconfirmed: boolean;
}
export interface MapOverlays {
  regions: Region[];
  districts: District[];
  places: Place[];
}

/** Fetches the overlay files once; null until both arrive (the map works without them). */
export function useMapOverlays(): MapOverlays | null {
  const [data, setData] = useState<MapOverlays | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/data/regions.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/data/places.json").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([reg, places]: [{ regions: Region[]; districts: District[] } | null, Place[] | null]) => {
        if (alive && reg && places) setData({ regions: reg.regions, districts: reg.districts, places });
      })
      .catch(() => {
        /* offline: plain map */
      });
    return () => {
      alive = false;
    };
  }, []);
  return data;
}
