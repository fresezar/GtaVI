import raw from "@content/partners.json";

/**
 * Distribution partners: GTA accounts that send their followers to Six Star (docs/partners/outreach.md).
 * Source of truth: content/partners.json. Add a row, deploy, and /p/<slug> exists.
 *   status "invited" = page works but is hidden from search and from the Community page
 *   status "active"  = they posted; listed under "Founding partners"
 * Logo (optional): public/partners/<slug>.png, square. Without it the page shows initials.
 */
export interface Partner {
  slug: string;
  name: string;
  platform: "instagram" | "tiktok" | "youtube" | "x" | "twitch" | "other";
  /** Their profile; empty = name without link. */
  url: string;
  followers?: string;
  status: "invited" | "active";
  since: string;
  logo?: string;
}

export const PARTNERS = raw as Partner[];
export const PARTNER_BY_SLUG = new Map(PARTNERS.map((p) => [p.slug, p]));
export const ACTIVE_PARTNERS = PARTNERS.filter((p) => p.status === "active");

/** Pin tag that records the partner page a find came through: "via:<slug>". */
export const VIA_PREFIX = "via:";
export const partnerOf = (tags: readonly string[] | undefined): Partner | undefined => {
  const tag = tags?.find((t) => t.startsWith(VIA_PREFIX));
  return tag ? PARTNER_BY_SLUG.get(tag.slice(VIA_PREFIX.length)) : undefined;
};

export const partnerUrl = (p: Partner) => (/^https:\/\//.test(p.url) ? p.url : undefined);
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Browser memory of the partner page a visitor came from (30 days), read by the suggest form. */
export const REF_KEY = "sixstar.ref";
const REF_DAYS = 30;

export function rememberRef(slug: string) {
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ slug, at: Date.now() }));
  } catch {
    /* storage blocked */
  }
}

export function currentRef(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("ref") ?? "";
    if (PARTNER_BY_SLUG.has(fromUrl)) {
      rememberRef(fromUrl);
      return fromUrl;
    }
    const saved = JSON.parse(localStorage.getItem(REF_KEY) ?? "null") as { slug?: string; at?: number } | null;
    if (saved?.slug && PARTNER_BY_SLUG.has(saved.slug) && Date.now() - (saved.at ?? 0) < REF_DAYS * 86_400_000) return saved.slug;
  } catch {
    /* storage blocked or bad JSON */
  }
  return "";
}
