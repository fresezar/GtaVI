import Link from "next/link";
import { SITE } from "@/config/site";
import { localePath, tFor, type Locale } from "@/i18n";
import { ThemeToggle, WantedStars } from "./HeaderWidgets";

/** Community-first sections. Progress lives behind the stars (top right), not in a tab. */
const TABS = [
  { path: "/map", key: "ui.nav.map" },
  { path: "/finds", key: "ui.nav.finds" },
  { path: "/guides", key: "ui.nav.guides" },
  { path: "/community", key: "ui.nav.community" },
  { path: "/news", key: "ui.nav.news" },
] as const;

/**
 * Menu-style bar: brand + stars + theme + language, then a strip of tabs (active = white block,
 * as in the game menu). On phones the strip scrolls sideways. `path` = this page's English path.
 */
export default function SiteHeader({ locale, path }: { locale: Locale; path: string; compact?: boolean }) {
  const t = tFor(locale);
  const other: Locale = locale === "en" ? "tr" : "en";
  const active = (p: string) => path === p || path.startsWith(`${p}/`);

  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-panel/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 pb-1 pt-2">
        <Link href={localePath(locale, "/")} className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, tiny fixed-size image */}
          <img src="/brand/logo-128.png" alt="" width={36} height={36} className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <span className="leading-none">
            <span lang="en" className="block font-display text-[22px] tracking-[0.06em] sm:text-[26px]">{SITE.name}</span>
            <span className="hidden font-display text-[10px] font-semibold tracking-[0.28em] text-muted sm:block">
              {t("ui.brand.tagline")}
            </span>
          </span>
        </Link>
        <div className="flex-1" />
        <WantedStars locale={locale} />
        <ThemeToggle locale={locale} />
        <Link
          href={localePath(other, path)}
          hrefLang={other}
          lang={other}
          className="border border-line-strong px-2 py-1.5 font-display text-[13px] tracking-[0.14em] text-muted transition hover:text-ink"
          title={t("ui.lang.other")}
        >
          {t("ui.lang.otherShort")}
        </Link>
      </div>
      <nav aria-label="Main" className="no-scrollbar overflow-x-auto px-2">
        <ul className="flex gap-1 py-1">
          {TABS.map((tab) => (
            <li key={tab.path}>
              <Link href={localePath(locale, tab.path)} className="tab" aria-current={active(tab.path) ? "page" : undefined}>
                {t(tab.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
