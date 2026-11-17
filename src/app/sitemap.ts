import type { MetadataRoute } from "next";
import { CHECKLISTS } from "@/data/checklists";
import { PINS } from "@/data/pins";
import { SITE } from "@/config/site";

export const dynamic = "force-static";

// Trailing slash matches the static export (trailingSlash: true), so crawlers hit 200s, not redirects.
const url = (path: string) => ({ url: `${SITE.baseUrl}${path}/` });

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/map", "/checklists", ...CHECKLISTS.map((c) => `/checklists/${c.slug}`)].map(url);
  const pins = PINS.filter((p) => p.status !== "deprecated").map((p) => url(`/pins/${p.slug}`));
  return [...pages, ...pins];
}
