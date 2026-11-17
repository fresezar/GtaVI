import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export const dynamic = "force-static";

/** Closed until the final domain is attached (SITE.indexable). */
export default function robots(): MetadataRoute.Robots {
  if (!SITE.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE.baseUrl}/sitemap.xml` };
}
