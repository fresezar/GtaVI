import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import ViceBand from "@/components/ui/ViceBand";
import { CATEGORY_BY_ID } from "@/data/categories";
import { COMMUNITY_STATS, LATEST_PINS } from "@/data/community";
import { fileNumber } from "@/data/pins";
import { CATEGORY_COLORS } from "@/features/map/tokens";
import { alternates, localePath, tFor, type Locale } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";

const SHOW = 80;

/** Literal class map: Tailwind can't see `badge-${status}` built at runtime. */
const BADGE: Record<string, string> = {
  verified: "badge badge-verified",
  unverified: "badge badge-unverified",
  disputed: "badge badge-disputed",
  deprecated: "badge",
};

export function findsMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return { title: t("ui.finds.title"), description: t("ui.finds.lead"), alternates: alternates(locale, "/finds") };
}

/** Community feed: the newest pins, each as a numbered case file with who found it. */
export default function FindsView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  const href = (p: string) => localePath(locale, p);
  const caps = (s: string) => s.toLocaleUpperCase(locale);
  const items = LATEST_PINS.slice(0, SHOW);

  return (
    <PageShell locale={locale} path="/finds">
      <ViceBand eyebrow={t("ui.nav.community")} title={t("ui.finds.title")} lead={t("ui.finds.lead")}>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`${href("/map")}?suggest=1`} className="btn btn-primary">{t("ui.finds.cta")}</Link>
          <span className="font-display text-[15px] tracking-[0.12em] text-white/85">
            {t("ui.finds.stats", { pins: COMMUNITY_STATS.pins, verified: COMMUNITY_STATS.verified })}
          </span>
        </div>
      </ViceBand>

      <ol className="divide-y divide-line border border-line bg-surface backdrop-blur-md">
        {items.map((pin) => {
          const c = CATEGORY_BY_ID.get(pin.categoryId);
          return (
            <li key={pin.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-surface-2">
              <span className="dot !h-3.5 !w-3.5" style={{ background: c ? CATEGORY_COLORS[c.colorToken] : "#888" }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="file-no text-muted">
                  <span lang="en">SIX STAR</span> · {caps(t("ui.file.label"))} <b className="text-accent">#{fileNumber(pin.id)}</b>
                </p>
                <Link href={href(`/pins/${pin.slug}`)} className="block truncate font-display text-[21px] normal-case leading-tight hover:text-accent">
                  {t(pinKey(pin.id, "title"))}
                </Link>
                <p className="truncate text-xs text-muted">
                  {c && t(categoryKey(c.id))}
                  {pin.region && ` · ${pin.region}`}
                  {pin.credit && ` · ${t("ui.pin.foundBy", { name: pin.credit.name })}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={BADGE[pin.status] ?? "badge"}>{t(`ui.pin.status.${pin.status}`)}</span>
                {pin.coord && (
                  <Link href={`${href("/map")}?pin=${pin.id}`} className="font-display text-[13px] tracking-[0.12em] text-muted hover:text-ink">
                    {t("ui.pin.showOnMap")} →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {LATEST_PINS.length > SHOW && <p className="mt-3 text-sm text-muted">{t("ui.finds.more", { count: LATEST_PINS.length - SHOW })}</p>}
    </PageShell>
  );
}
