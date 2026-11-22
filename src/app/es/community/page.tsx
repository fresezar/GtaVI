import CommunityView, { communityMetadata } from "@/views/CommunityView";

export const metadata = communityMetadata("es");

export default function Page() {
  return <CommunityView locale="es" />;
}
