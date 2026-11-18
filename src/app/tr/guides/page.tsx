import { GuidesIndexView, guidesIndexMetadata } from "@/views/GuidesView";

export const metadata = guidesIndexMetadata("tr");

export default function Page() {
  return <GuidesIndexView locale="tr" />;
}
