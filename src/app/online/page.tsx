import OnlineView, { onlineMetadata } from "@/views/OnlineView";

export const metadata = onlineMetadata("en");

export default function Page() {
  return <OnlineView locale="en" />;
}
