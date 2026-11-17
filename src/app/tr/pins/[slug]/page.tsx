import PinView, { pinMetadata, pinStaticParams } from "@/views/PinView";

export const dynamicParams = false;
export const generateStaticParams = pinStaticParams;
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  return pinMetadata("tr", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <PinView locale="tr" slug={(await params).slug} />;
}
