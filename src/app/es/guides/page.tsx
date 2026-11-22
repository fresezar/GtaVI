import { GuidesIndexView, guidesIndexMetadata } from "@/views/GuidesView";

export const metadata = guidesIndexMetadata("es");

export default function Page() {
  return <GuidesIndexView locale="es" />;
}
