import MissablesView, { missablesMetadata } from "@/views/MissablesView";

export const metadata = missablesMetadata("en");

export default function Page() {
  return <MissablesView locale="en" />;
}
