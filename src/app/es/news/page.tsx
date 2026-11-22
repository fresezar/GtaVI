import NewsView, { newsMetadata } from "@/views/NewsView";

export const metadata = newsMetadata("es");

export default function Page() {
  return <NewsView locale="es" />;
}
