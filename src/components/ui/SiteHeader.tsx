import Link from "next/link";
import { ViewTransition } from "react";
import { SITE } from "@/config/site";
import { localePath, tFor, type Locale } from "@/i18n";
import { ThemeToggle, WantedStars } from "./HeaderWidgets";
import LanguageHint from "./LanguageHint";

/** Community-first sections. Progress lives behind the stars (top right), not in a tab. */
const TABS = [
  { path: "/map", key: "ui.nav.map" },
  { path: "/finds", key: "ui.nav.finds" },
  { path: "/guides", key: "ui.nav.guides" },
  { path: "/cheats", key: "ui.nav.cheats" },
  { path: "/online", key: "ui.nav.online" },
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
  const activeIndex = TABS.findIndex((tab) => path === tab.path || path.startsWith(`${tab.path}/`));

  return (
    // Named so it stays put while the page content slides (globals.css, "View transitions").
    <header
      className="sticky top-0 z-[1000] border-b border-line bg-panel/60 backdrop-blur-xl backdrop-saturate-150"
      style={{ viewTransitionName: "site-header" }}
      data-site-header
    >
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
        {SITE.links.discord && (
          <a href={SITE.links.discord} target="_blank" rel="noopener" aria-label="Discord" title="Discord" className="social-btn">
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path fill="currentColor" d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.89.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42Z" />
            </svg>
          </a>
        )}
        {SITE.links.youtube && (
          <a href={SITE.links.youtube} target="_blank" rel="noopener" aria-label="YouTube" title="YouTube" className="social-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z" />
            </svg>
          </a>
        )}
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
          {TABS.map((tab, i) => {
            const on = i === activeIndex;
            // Direction of the page slide: tabs to the right move "forward", to the left "back".
            const types = on ? undefined : [activeIndex === -1 || i > activeIndex ? "nav-forward" : "nav-back"];
            return (
              <li key={tab.path}>
                <Link href={localePath(locale, tab.path)} className="tab" aria-current={on ? "page" : undefined} transitionTypes={types}>
                  {/* The white block slides from the old tab to the new one (shared view-transition name). */}
                  {on && (
                    <ViewTransition name="tab-indicator" share="tab-morph" default="none">
                      <span className="tab-fill" aria-hidden="true" />
                    </ViewTransition>
                  )}
                  <span className="tab-label" style={{ viewTransitionName: `tab-label-${tab.path.slice(1)}` }}>
                    {t(tab.key)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {locale === "en" && <LanguageHint trHref={localePath("tr", path)} />}
    </header>
  );
}
