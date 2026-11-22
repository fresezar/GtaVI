import CheatsView, { cheatsMetadata } from "@/views/CheatsView";

export const metadata = cheatsMetadata("es");

export default function Page() {
  return <CheatsView locale="es" />;
}
