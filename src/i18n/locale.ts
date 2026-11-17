export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** BCP 47 tags for dates/numbers and <html lang>. */
export const LOCALE_TAG: Record<Locale, string> = { en: "en-US", tr: "tr-TR" };

/**
 * English lives at the root (/map), Turkish under /tr (/tr/map).
 * `path` is the English path, always starting with "/".
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Static export serves directories, so canonical URLs end with "/" (query strings untouched). */
function slashed(path: string): string {
  const [p, q] = path.split("?");
  const withSlash = p.endsWith("/") ? p : `${p}/`;
  return q ? `${withSlash}?${q}` : withSlash;
}

/** Metadata `alternates` for a page: canonical in its own language + hreflang pairs. */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: slashed(localePath(locale, path)),
    languages: {
      en: slashed(localePath("en", path)),
      tr: slashed(localePath("tr", path)),
      "x-default": slashed(localePath("en", path)),
    },
  };
}
