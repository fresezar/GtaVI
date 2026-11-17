import PinView, { pinMetadata, pinStaticParams } from "@/views/PinView";

export const dynamicParams = false;
export const generateStaticParams = pinStaticParams;
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  return pinMetadata("en", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <PinView locale="en" slug={(await params).slug} />;
}
