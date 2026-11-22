import FindsView, { findsMetadata } from "@/views/FindsView";

export const metadata = findsMetadata("es");

export default function Page() {
  return <FindsView locale="es" />;
}
