import MapPageView, { mapMetadata } from "@/views/MapPageView";

export const metadata = mapMetadata("en");

export default function Page() {
  return <MapPageView locale="en" />;
}
