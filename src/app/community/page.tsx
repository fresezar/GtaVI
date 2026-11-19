import CommunityView, { communityMetadata } from "@/views/CommunityView";

export const metadata = communityMetadata("en");

export default function Page() {
  return <CommunityView locale="en" />;
}
