import { checklistMetadata, ChecklistPageView, checklistStaticParams } from "@/views/ChecklistsView";

export const dynamicParams = false;
export const generateStaticParams = checklistStaticParams;
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  return checklistMetadata("tr", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <ChecklistPageView locale="tr" slug={(await params).slug} />;
}
