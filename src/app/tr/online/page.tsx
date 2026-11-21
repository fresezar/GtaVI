import OnlineView, { onlineMetadata } from "@/views/OnlineView";

export const metadata = onlineMetadata("tr");

export default function Page() {
  return <OnlineView locale="tr" />;
}
