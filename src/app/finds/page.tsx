import FindsView, { findsMetadata } from "@/views/FindsView";

export const metadata = findsMetadata("en");

export default function Page() {
  return <FindsView locale="en" />;
}
