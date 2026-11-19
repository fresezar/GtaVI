import type { Metadata } from "next";
import PageBanner from "@/components/ui/PageBanner";
import PageShell from "@/components/ui/PageShell";
import Freshness from "@/components/ui/Freshness";
import { CHEATS, CHEATS_CHECKED_AT, CHEAT_SOURCE } from "@/data/cheats";
import CheatList from "@/features/cheats/CheatList";
import { alternates, tFor, type Locale } from "@/i18n";

const KNOWN = CHEATS.filter((c) => c.code).length;

export function cheatsMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return {
    title: t("ui.cheats.meta.title"),
    description: t("ui.cheats.lead", { total: CHEATS.length, known: KNOWN }),
    alternates: alternates(locale, "/cheats"),
  };
}

/** Every story-mode cheat: D-pad code (when known), what it does, how to unlock it. */
export default function CheatsView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  return (
    <PageShell locale={locale} path="/cheats">
      <PageBanner eyebrow={t("ui.nav.cheats")} title={t("ui.cheats.title")} lead={t("ui.cheats.lead", { total: CHEATS.length, known: KNOWN })} />
      <p className="-mt-4 mb-6 min-h-[1rem] text-xs text-muted">
        <Freshness date={CHEATS_CHECKED_AT} label="ui.fresh.checked" />
      </p>
      <CheatList />
      <p className="mt-6 text-xs text-muted">
        {t("ui.cheats.credit")}{" "}
        <a href={CHEAT_SOURCE.url} target="_blank" rel="noopener" className="underline">{CHEAT_SOURCE.name}</a>
      </p>
    </PageShell>
  );
}
