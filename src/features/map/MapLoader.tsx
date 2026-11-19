"use client";

import dynamic from "next/dynamic";
import { t, type Locale } from "@/i18n";
import { LocaleProvider } from "@/i18n/client";

/** Leaflet touches `window`, so the map is client-only. */
const MapExplorer = dynamic(() => import("./MapExplorer"), {
  ssr: false,
  loading: () => <div className="grid flex-1 place-items-center font-display text-xl">…</div>,
});

export default function MapLoader({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <noscript>
        <p className="p-6">{t("ui.map.loading", undefined, locale)}</p>
      </noscript>
      <MapExplorer />
    </LocaleProvider>
  );
}
