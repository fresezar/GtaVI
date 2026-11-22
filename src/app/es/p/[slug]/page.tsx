import PartnerView, { partnerMetadata, partnerStaticParams } from "@/views/PartnerView";

export const dynamicParams = false;
export const generateStaticParams = partnerStaticParams;
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  return partnerMetadata("es", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <PartnerView locale="es" slug={(await params).slug} />;
}
