import type { MetadataRoute } from "next";
import { CHECKLISTS } from "@/data/checklists";
import { PINS } from "@/data/pins";
import { SITE } from "@/config/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/map", "/checklists", ...CHECKLISTS.map((c) => `/checklists/${c.slug}`)].map((p) => ({ url: `${SITE.baseUrl}${p}` }));
  const pins = PINS.filter((p) => p.status !== "deprecated").map((p) => ({ url: `${SITE.baseUrl}/pins/${p.slug}` }));
  return [...pages, ...pins];
}
