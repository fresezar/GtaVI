import NewsView, { newsMetadata } from "@/views/NewsView";

export const metadata = newsMetadata("tr");

export default function Page() {
  return <NewsView locale="tr" />;
}
