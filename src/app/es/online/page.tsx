import OnlineView, { onlineMetadata } from "@/views/OnlineView";

export const metadata = onlineMetadata("es");

export default function Page() {
  return <OnlineView locale="es" />;
}
