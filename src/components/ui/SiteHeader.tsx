import Link from "next/link";
import { SITE } from "@/config/site";
import { t } from "@/i18n";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-5">
      <Link href="/" className="font-display text-3xl leading-none">{SITE.name}</Link>
      <nav className="flex items-center gap-2" aria-label="Main">
        <Link href="/map" className="btn">{t("ui.nav.map")}</Link>
        <Link href="/checklists" className="btn">{t("ui.nav.checklists")}</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
