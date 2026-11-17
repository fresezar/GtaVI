import Link from "next/link";
import { SITE } from "@/config/site";
import { t } from "@/i18n";

const SOCIAL = [
  { key: "discord", label: "Discord" },
  { key: "x", label: "X" },
  { key: "donate", label: "Support us" },
] as const;

export default function SiteFooter() {
  const social = SOCIAL.filter((s) => SITE.links[s.key]);
  return (
    <footer className="mt-16 border-t border-line bg-[#0d0716]/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="neon font-display text-2xl">{SITE.name}</p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">{SITE.disclaimer}</p>
        </div>
        <nav aria-label={t("ui.footer.links")} className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm font-bold text-muted">
          <Link href="/map" className="hover:text-ink">{t("ui.nav.map")}</Link>
          <Link href="/checklists" className="hover:text-ink">{t("ui.nav.checklists")}</Link>
          {social.map((s) => (
            <a key={s.key} href={SITE.links[s.key]} target="_blank" rel="noopener" className="hover:text-ink">
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
