import { GuidesIndexView, guidesIndexMetadata } from "@/views/GuidesView";

export const metadata = guidesIndexMetadata("en");

export default function Page() {
  return <GuidesIndexView locale="en" />;
}
