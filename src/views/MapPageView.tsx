import type { Metadata } from "next";
import MapLoader from "@/features/map/MapLoader";
import { alternates, tFor, type Locale } from "@/i18n";

export function mapMetadata(locale: Locale): Metadata {
  return { title: tFor(locale)("ui.meta.map"), alternates: alternates(locale, "/map") };
}

export default function MapPageView({ locale }: { locale: Locale }) {
  return <MapLoader locale={locale} />;
}
