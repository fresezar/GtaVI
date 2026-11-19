import FindsView, { findsMetadata } from "@/views/FindsView";

export const metadata = findsMetadata("tr");

export default function Page() {
  return <FindsView locale="tr" />;
}
