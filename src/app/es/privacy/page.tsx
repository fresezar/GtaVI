import PrivacyView, { privacyMetadata } from "@/views/PrivacyView";

export const metadata = privacyMetadata("es");

export default function Page() {
  return <PrivacyView locale="es" />;
}
