import type { Metadata } from "next";
import { NewsList, RoadTimeline } from "@/components/editorial";
import PageShell from "@/components/ui/PageShell";
import { NEWS, TIMELINE } from "@/data/editorial";
import { alternates, tFor, type Locale } from "@/i18n";

export function newsMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return { title: t("ui.news.title"), description: t("ui.news.lead"), alternates: alternates(locale, "/news") };
}

/** News archive (newest first) plus the confirmed road-to-launch timeline. */
export default function NewsView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  return (
    <PageShell locale={locale} path="/news">
      <h1 className="font-display text-4xl sm:text-5xl">{t("ui.news.title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("ui.news.lead")}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label={t("ui.news.title")}>
          {NEWS.length ? (
            <NewsList items={NEWS} locale={locale} t={t} />
          ) : (
            <p className="card text-sm text-muted">{t("ui.news.empty")}</p>
          )}
        </section>
        <section className="card !p-5" aria-labelledby="road-title">
          <h2 id="road-title" className="section-title">{t("ui.home.road")}</h2>
          <p className="mt-1 text-sm text-muted">{t("ui.home.roadLead")}</p>
          <div className="mt-5">
            <RoadTimeline events={TIMELINE} locale={locale} t={t} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
