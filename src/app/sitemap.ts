import type { MetadataRoute } from "next";
import { CHECKLISTS } from "@/data/checklists";
import { GUIDES } from "@/data/guides";
import { ACTIVE_PARTNERS } from "@/data/partners";
import { PINS } from "@/data/pins";
import { SITE } from "@/config/site";
import { LOCALES, localePath } from "@/i18n";

export const dynamic = "force-static";

// Trailing slash matches the static export (trailingSlash: true), so crawlers hit 200s, not redirects.
const abs = (path: string) => `${SITE.baseUrl}${path === "/" ? "" : path}/`;

/** Every page in every language, each entry listing its language alternates (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/map",
    "/checklists",
    "/finds",
    "/community",
    "/news",
    "/guides",
    "/guides/missables",
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    ...CHECKLISTS.filter((c) => c.status !== "deprecated").map((c) => `/checklists/${c.slug}`),
    ...PINS.map((p) => `/pins/${p.slug}`),
    ...ACTIVE_PARTNERS.map((p) => `/p/${p.slug}`),
  ];
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(LOCALES.map((l) => [l, abs(localePath(l, path))]));
    return LOCALES.map((l) => ({ url: abs(localePath(l, path)), alternates: { languages } }));
  });
}
