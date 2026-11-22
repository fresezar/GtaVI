import MapPageView, { mapMetadata } from "@/views/MapPageView";

export const metadata = mapMetadata("es");

export default function Page() {
  return <MapPageView locale="es" />;
}
