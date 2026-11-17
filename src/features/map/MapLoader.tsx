"use client";

import dynamic from "next/dynamic";
import { t } from "@/i18n";

/** Leaflet touches `window`, so the map is client-only. */
const MapExplorer = dynamic(() => import("./MapExplorer"), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center font-display text-xl">{t("ui.map.loading")}</div>,
});

export default function MapLoader() {
  return <MapExplorer />;
}
