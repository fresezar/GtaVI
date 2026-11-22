import type { Metadata } from "next";
import SiteHeader from "@/components/ui/SiteHeader";
import MapLoader from "@/features/map/MapLoader";
import { alternates, tFor, type Locale } from "@/i18n/server";

export function mapMetadata(locale: Locale): Metadata {
  return { title: tFor(locale)("ui.meta.map"), alternates: alternates(locale, "/map") };
}

export default function MapPageView({ locale }: { locale: Locale }) {
  // Header rendered here (not inside the client-only map) so it is on screen at once and the tab
  // indicator can slide into "Map" during the navigation.
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader locale={locale} path="/map" />
      <MapLoader locale={locale} />
    </div>
  );
}
