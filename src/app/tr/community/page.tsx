import CommunityView, { communityMetadata } from "@/views/CommunityView";

export const metadata = communityMetadata("tr");

export default function Page() {
  return <CommunityView locale="tr" />;
}
