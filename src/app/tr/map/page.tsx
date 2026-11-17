import MapPageView, { mapMetadata } from "@/views/MapPageView";

export const metadata = mapMetadata("tr");

export default function Page() {
  return <MapPageView locale="tr" />;
}
