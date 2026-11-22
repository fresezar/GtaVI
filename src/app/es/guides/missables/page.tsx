import MissablesView, { missablesMetadata } from "@/views/MissablesView";

export const metadata = missablesMetadata("es");

export default function Page() {
  return <MissablesView locale="es" />;
}
