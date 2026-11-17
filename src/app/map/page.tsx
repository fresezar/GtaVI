import type { Metadata } from "next";
import MapLoader from "@/features/map/MapLoader";

export const metadata: Metadata = { title: "Interactive map" };

export default function MapPage() {
  return <MapLoader />;
}
