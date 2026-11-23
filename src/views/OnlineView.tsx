import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import ViceBand from "@/components/ui/ViceBand";
import { SITE } from "@/config/site";
import { ONLINE_FEATURES, WEEKLY } from "@/data/online";
import SubscribeForm from "@/features/subscribe/SubscribeForm";
import { alternates, localePath, tFor, type Locale } from "@/i18n/server";

export function onlineMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return { title: t("ui.online.meta.title"), description: t("ui.online.lead"), alternates: alternates(locale, "/online") };
}

const KIND_COLOR = { bonus: "text-sun", discount: "text-accent2", event: "text-accent", new: "text-ink" } as const;

/** GTA 6 Online hub: honest status, the launch-day list, what we are building, and the weekly tracker once live. */
export default function OnlineView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  const latest = WEEKLY[0];
  const lang = locale;

  return (
    <PageShell locale={locale} path="/online">
      <ViceBand eyebrow="GTA 6 Online" title={t("ui.online.title")} lead={t("ui.online.lead")}>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="font-display text-[12px] tracking-[0.2em] text-white/70">{t("ui.online.status.label")}</dt>
            <dd className="font-display text-2xl leading-none">{latest ? t("ui.online.status.live") : t("ui.online.status.notYet")}</dd>
          </div>
          <div>
            <dt className="font-display text-[12px] tracking-[0.2em] text-white/70">{t("ui.online.date.label")}</dt>
            <dd className="font-display text-2xl leading-none">{t("ui.online.date.value")}</dd>
          </div>
        </dl>
      </ViceBand>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-8">
          <section className="card !p-5" aria-labelledby="notify-title">
            <p className="eyebrow">{t("ui.online.notify.eyebrow")}</p>
            <h2 id="notify-title" className="section-title mt-1">{t("ui.online.notify.title")}</h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-muted">{t("ui.online.notify.body")}</p>
            <SubscribeForm topics={["online"]} source="/online" />
          </section>

          <section aria-labelledby="ready-title">
            <p className="eyebrow">{t("ui.online.ready.eyebrow")}</p>
            <h2 id="ready-title" className="section-title mt-1">{t("ui.online.ready.title")}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {ONLINE_FEATURES.map((f, i) => (
                <li key={f.id} className="glass p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="file-no text-accent">0{i + 1}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${f.when === "launch" ? "text-accent2" : "text-sun"}`}>
                      {t(`ui.online.when.${f.when}`)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-xl leading-tight">{t(`ui.online.feature.${f.id}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t(`ui.online.feature.${f.id}.body`)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="card !p-5" aria-labelledby="weekly-title">
            <h2 id="weekly-title" className="section-title">{t("ui.online.weekly.title")}</h2>
            {latest ? (
              <>
                <p className="mt-1 text-xs text-muted">{t("ui.online.weekly.week", { date: latest.weekOf })}</p>
                <ul className="mt-3 space-y-2">
                  {latest.items.map((it, i) => (
                    <li key={i} className="border border-line bg-surface-2 px-3 py-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${KIND_COLOR[it.kind]}`}>{t(`ui.online.kind.${it.kind}`)}</span>
                      <p className="text-sm font-bold">{it.title[lang] ?? it.title.en}</p>
                      {it.detail && <p className="text-xs text-muted">{it.detail[lang] ?? it.detail.en}</p>}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-muted">
                  {t("ui.online.weekly.source")}{" "}
                  <a href={latest.sourceUrl} target="_blank" rel="noopener" className="underline">{latest.sourceName}</a>
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("ui.online.weekly.empty")}</p>
            )}
          </section>

          <section className="card !p-5" aria-labelledby="faq-title">
            <h2 id="faq-title" className="section-title">{t("ui.online.faq.title")}</h2>
            <dl className="mt-3 space-y-3 text-sm leading-relaxed">
              {(["out", "when", "now"] as const).map((q) => (
                <div key={q}>
                  <dt className="font-bold">{t(`ui.online.faq.${q}.q`)}</dt>
                  <dd className="text-muted">{t(`ui.online.faq.${q}.a`)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={localePath(locale, "/map")} className="btn">{t("ui.nav.openMap")}</Link>
              {SITE.links.discord && (
                <a href={SITE.links.discord} target="_blank" rel="noopener" className="btn">{t("ui.community.discord.join")}</a>
              )}
            </div>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
