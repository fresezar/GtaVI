import { GuideView, guideMetadata, guideStaticParams } from "@/views/GuidesView";

export const dynamicParams = false;
export const generateStaticParams = guideStaticParams;
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  return guideMetadata("es", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <GuideView locale="es" slug={(await params).slug} />;
}
