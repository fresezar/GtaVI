import Link from "next/link";
import { SITE } from "@/config/site";
import { localePath, tFor, type Locale } from "@/i18n";

const NAV = [
  { path: "/map", key: "ui.nav.map" },
  { path: "/checklists", key: "ui.nav.checklists" },
  { path: "/#latest", key: "ui.nav.latest" },
  { path: "/#road", key: "ui.nav.road" },
] as const;

/**
 * Sticky glass bar. On phones the links become a swipeable row under the brand (no page overflow).
 * `path` is the current page's English path, used by the language switch.
 */
export default function SiteHeader({ locale, path, compact = false }: { locale: Locale; path: string; compact?: boolean }) {
  const t = tFor(locale);
  const other: Locale = locale === "en" ? "tr" : "en";
  const href = (p: string) => (p.startsWith("/#") ? `${localePath(locale, "/")}${p.slice(1)}` : localePath(locale, p));
  const lang = (
    <Link
      href={localePath(other, path)}
      hrefLang={other}
      lang={other}
      className="rounded-full border border-line-strong px-2.5 py-1.5 text-xs font-extrabold tracking-wider text-muted transition hover:text-ink"
      title={t("ui.lang.other")}
    >
      {t("ui.lang.otherShort")}
    </Link>
  );

  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-[#120b1e]/80 backdrop-blur-md">
      <div className={`mx-auto flex items-center justify-between gap-3 px-4 ${compact ? "h-14 max-w-none" : "h-16 max-w-6xl"}`}>
        <Link href={localePath(locale, "/")} className="flex items-baseline gap-2">
          <span className="neon font-display text-2xl leading-none sm:text-3xl">{SITE.name}</span>
          <span className="hidden text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted sm:inline">
            {locale === "tr" ? "Resmî değil" : "Unofficial"}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.path} href={href(n.path)} className="rounded-full px-3 py-2 text-sm font-bold text-muted transition hover:text-ink">
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {lang}
          <Link href={localePath(locale, "/map")} className="btn btn-primary min-h-[38px] px-4">
            {t("ui.nav.openMap")} →
          </Link>
        </div>
      </div>
      {!compact && (
        <nav className="border-t border-line md:hidden" aria-label="Main">
          <div className="scroll-x mx-0 px-4 py-2">
            {NAV.map((n) => (
              <Link key={n.path} href={href(n.path)} className="btn min-h-[34px] shrink-0 px-3 text-xs">
                {t(n.key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
