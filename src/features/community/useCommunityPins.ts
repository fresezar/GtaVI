"use client";

import { useEffect, useState } from "react";
import type { CategoryId, PinId, PlacedPin } from "@/domain";
import { PIN_BY_ID } from "@/data/pins";
import { VIA_PREFIX } from "@/data/partners";
import { registerText } from "@/i18n";
import { pinKey } from "@/i18n/keys";

/** Tag on pins that come live from the API (approved, not baked into the static site yet: no own page). */
export const LIVE_TAG = "live";

interface ApiPin {
  id: string;
  categoryId: string;
  title: string;
  coord: [number, number];
  proofUrl: string;
  name: string | null;
  approvedAt: string | null;
  via?: string | null;
}

/**
 * Approved community suggestions from /api/community/pins, shaped as pins. Pins already copied into
 * content/pins.json are skipped (the static copy wins). Fails quietly: the map works without them.
 */
export function useCommunityPins(): readonly PlacedPin[] {
  const [pins, setPins] = useState<readonly PlacedPin[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/community/pins")
      .then((r) => (r.ok ? (r.json() as Promise<{ pins: ApiPin[] }>) : { pins: [] }))
      .then(({ pins: rows }) => {
        if (!alive) return;
        const live = rows
          .filter((r) => /^pin_[0-9A-Z]{26}$/.test(r.id) && !PIN_BY_ID.has(r.id as PinId))
          .map(
            (r): PlacedPin => ({
              id: r.id as PinId,
              slug: r.id.toLowerCase(),
              mapId: "map_main",
              categoryId: r.categoryId as CategoryId,
              coord: r.coord,
              source: "community",
              ...(r.name ? { credit: { name: r.name } } : {}),
              status: "unverified",
              spoilerLevel: "none",
              provenance: { sourceUrl: r.proofUrl, confidence: "medium", extractedBy: "human" },
              addedAt: (r.approvedAt ?? new Date().toISOString()).slice(0, 10),
              dataVersion: 1,
              tags: [LIVE_TAG, ...(r.via ? [`${VIA_PREFIX}${r.via}`] : [])],
            }),
          );
        registerText(Object.fromEntries(rows.map((r) => [pinKey(r.id as PinId, "title"), r.title])));
        setPins(live);
      })
      .catch(() => {
        /* offline or API down: static pins only */
      });
    return () => {
      alive = false;
    };
  }, []);
  return pins;
}
