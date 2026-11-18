import MissablesView, { missablesMetadata } from "@/views/MissablesView";

export const metadata = missablesMetadata("tr");

export default function Page() {
  return <MissablesView locale="tr" />;
}
