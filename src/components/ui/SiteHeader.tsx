import Link from "next/link";
import { SITE } from "@/config/site";
import { t } from "@/i18n";

const NAV = [
  { href: "/map", key: "ui.nav.map" },
  { href: "/checklists", key: "ui.nav.checklists" },
  { href: "/#latest", key: "ui.nav.latest" },
  { href: "/#road", key: "ui.nav.road" },
] as const;

/** Sticky glass bar. On phones the links become a swipeable row under the brand (no page overflow). */
export default function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-[#120b1e]/80 backdrop-blur-md">
      <div className={`mx-auto flex items-center justify-between gap-3 px-4 ${compact ? "h-14 max-w-none" : "h-16 max-w-6xl"}`}>
        <Link href="/" className="flex items-baseline gap-2">
          <span className="neon font-display text-2xl leading-none sm:text-3xl">{SITE.name}</span>
          <span className="hidden text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted sm:inline">Unofficial</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-bold text-muted transition hover:text-ink">
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <Link href="/map" className="btn btn-primary min-h-[38px] px-4">
          {t("ui.nav.openMap")} →
        </Link>
      </div>
      {!compact && (
        <nav className="border-t border-line md:hidden" aria-label="Main">
          <div className="scroll-x mx-0 px-4 py-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="btn min-h-[34px] shrink-0 px-3 text-xs">
                {t(n.key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
