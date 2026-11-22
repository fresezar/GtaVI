import type { Metadata } from "next";
import Link from "next/link";
import PageBanner from "@/components/ui/PageBanner";
import PageShell from "@/components/ui/PageShell";
import { MISSABLES } from "@/data/missables";
import { PIN_BY_ID, pinPath } from "@/data/pins";
import type { VerificationStatus } from "@/domain";
import { alternates, localePath, tFor, type Locale } from "@/i18n/server";

const PATH = "/guides/missables";
/** Where the "no replay" claim comes from (several reviews, IGN among them). */
const WHY_SOURCE = "https://thepcenthusiast.com/gta-6-reviews-metascore-critic-reactions/";
/** Full class names written out so Tailwind keeps them (it only sees literal strings). */
const BADGE: Record<VerificationStatus, string> = {
  verified: "badge-verified",
  unverified: "badge-unverified",
  disputed: "badge-disputed",
  deprecated: "badge-disputed",
};

export function missablesMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return { title: { absolute: t("ui.missables.metaTitle") }, description: t("ui.missables.lead"), alternates: alternates(locale, PATH) };
}

/** Spoiler-free titles in story order; details behind a tap when the entry carries a spoiler. */
export default function MissablesView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  return (
    <PageShell locale={locale} path={PATH} width="max-w-3xl">
      <PageBanner art="banner-missables" title={t("ui.missables.title")} lead={t("ui.missables.lead")} />

      <section className="card !p-5" aria-labelledby="why-title">
        <h2 id="why-title" className="font-bold">{t("ui.missables.whyTitle")}</h2>
        <p className="mt-2 text-sm">{t("ui.missables.why")}</p>
        <p className="mt-2 text-sm text-muted">{t("ui.missables.rules")}</p>
        <a href={WHY_SOURCE} target="_blank" rel="noopener" className="mt-3 inline-block text-xs font-bold text-muted underline hover:text-ink">
          {t("ui.source")}: {t("ui.missables.whySource")}
        </a>
      </section>

      <section className="mt-8" aria-label={t("ui.missables.title")}>
        {MISSABLES.length === 0 ? (
          <p className="card text-sm text-muted">{t("ui.missables.empty")}</p>
        ) : (
          <>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{t("ui.missables.count", { count: MISSABLES.length })}</p>
            <ol className="space-y-2">
              {MISSABLES.map((m, i) => {
                const body = t(`missable.${m.id}.body`);
                const pin = m.pinId ? PIN_BY_ID.get(m.pinId) : undefined;
                return (
                  <li key={m.id} id={m.id} className="card scroll-mt-24 !p-4">
                    <div className="flex items-start gap-3">
                      <span className="font-display text-2xl leading-none text-accent">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold leading-snug">{t(`missable.${m.id}.title`)}</p>
                          <span className={`badge ${BADGE[m.status]}`}>{t(`ui.pin.status.${m.status}`)}</span>
                        </div>
                        {m.spoilerLevel === "none" ? (
                          <p className="mt-1 text-sm">{body}</p>
                        ) : (
                          <details className="mt-1 text-sm">
                            <summary className="cursor-pointer font-bold text-accent">{t("ui.pin.spoiler")}</summary>
                            <p className="mt-1">{body}</p>
                          </details>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                          <a href={m.sourceUrl} target="_blank" rel="noopener" className="text-muted underline hover:text-ink">
                            {t("ui.source")}: {m.sourceName}
                          </a>
                          {pin && (
                            <Link prefetch={false} href={localePath(locale, pinPath(pin))} className="text-accent2 underline">
                              {t("ui.missables.pin")} →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </PageShell>
  );
}
