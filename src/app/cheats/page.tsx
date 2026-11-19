import CheatsView, { cheatsMetadata } from "@/views/CheatsView";

export const metadata = cheatsMetadata("en");

export default function Page() {
  return <CheatsView locale="en" />;
}
