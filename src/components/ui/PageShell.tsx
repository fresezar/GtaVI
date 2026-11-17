import type { Locale } from "@/i18n";
import { LocaleProvider } from "@/i18n/client";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * Every content page: neon backdrop, sticky header, footer, locale context.
 * `path` = this page's English path (drives the language switch). The map page has its own layout.
 */
export default function PageShell({
  locale,
  path,
  children,
  width = "max-w-6xl",
}: {
  locale: Locale;
  path: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <Backdrop />
        <SiteHeader locale={locale} path={path} />
        <main className={`mx-auto w-full flex-1 ${width} px-4 py-8 sm:py-10`}>{children}</main>
        <SiteFooter locale={locale} />
      </div>
    </LocaleProvider>
  );
}
