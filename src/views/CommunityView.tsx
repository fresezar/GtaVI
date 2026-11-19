import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import ViceBand from "@/components/ui/ViceBand";
import { SITE } from "@/config/site";
import { COMMUNITY_STATS, CONTRIBUTORS, RANKS, rankFor } from "@/data/community";
import { alternates, localePath, tFor, type Locale } from "@/i18n";

const STAR = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.9 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7z";

function Stars({ lit, size = 16 }: { lit: number; size?: number }) {
  return (
    <span className="inline-flex gap-[2px]" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size}>
          <path d={STAR} fill={i < lit ? "#FF6A55" : "none"} stroke={i < lit ? "#FF6A55" : "currentColor"} strokeOpacity={i < lit ? 1 : 0.4} strokeWidth="1.6" />
        </svg>
      ))}
    </span>
  );
}

export function communityMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return { title: t("ui.community.title"), description: t("ui.community.lead"), alternates: alternates(locale, "/community") };
}

/** How to contribute, who found the most, and the star ranks. Accounts arrive in phase 2. */
export default function CommunityView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  const href = (p: string) => localePath(locale, p);
  const players = CONTRIBUTORS.filter((c) => !c.isSource);
  const sources = CONTRIBUTORS.filter((c) => c.isSource);

  return (
    <PageShell locale={locale} path="/community">
      <ViceBand eyebrow={t("ui.nav.community")} title={t("ui.community.title")} lead={t("ui.community.lead")}>
        <dl className="flex flex-wrap gap-6">
          {[
            [COMMUNITY_STATS.pins, t("ui.community.stat.pins")],
            [COMMUNITY_STATS.verified, t("ui.community.stat.verified")],
            [COMMUNITY_STATS.players, t("ui.community.stat.players")],
          ].map(([n, label]) => (
            <div key={String(label)}>
              <dt className="font-display text-[12px] tracking-[0.2em] text-white/70">{label}</dt>
              <dd className="font-display text-4xl leading-none tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
      </ViceBand>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-8">
          <section id="contribute" className="card !p-5" aria-labelledby="contribute-title">
            <p className="eyebrow">{t("ui.community.contribute.eyebrow")}</p>
            <h2 id="contribute-title" className="section-title mt-1">{t("ui.community.contribute.title")}</h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              {(["find", "suggest", "verify"] as const).map((step, i) => (
                <li key={step} className="border border-line bg-surface-2 p-4">
                  <span className="file-no text-accent">0{i + 1}</span>
                  <h3 className="mt-1 font-display text-xl leading-tight">{t(`ui.community.step.${step}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t(`ui.community.step.${step}.body`)}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={`${href("/map")}?suggest=1`} className="btn btn-primary">{t("ui.community.cta")}</Link>
              <span className="text-sm text-muted">{t("ui.community.ctaNote")}</span>
            </div>
          </section>

          <section aria-labelledby="board-title">
            <p className="eyebrow">{t("ui.community.board.eyebrow")}</p>
            <h2 id="board-title" className="section-title mt-1">{t("ui.community.board.title")}</h2>
            {players.length === 0 ? (
              <p className="card mt-4 text-sm leading-relaxed text-muted">{t("ui.community.board.empty")}</p>
            ) : (
              <ol className="mt-4 divide-y divide-line border border-line bg-surface">
                {players.slice(0, 50).map((c, i) => (
                  <li key={c.name} className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3 ${i === 0 ? "row-selected" : ""}`}>
                    <span className="font-display text-xl tabular-nums">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-xl normal-case">{c.name}</span>
                      <Stars lit={rankFor(c.finds)} size={13} />
                    </span>
                    <span className="text-right text-sm tabular-nums">{t("ui.community.board.finds", { count: c.finds })}</span>
                  </li>
                ))}
              </ol>
            )}
            {sources.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {t("ui.community.board.sources")}{" "}
                {sources.map((s, i) => (
                  <span key={s.name}>
                    {i > 0 && ", "}
                    {s.url ? <a href={s.url} target="_blank" rel="noopener" className="font-bold underline">{s.name}</a> : <b>{s.name}</b>}
                    {` (${s.finds})`}
                  </span>
                ))}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <section className="card !p-5" aria-labelledby="ranks-title">
            <p className="eyebrow">{t("ui.community.ranks.eyebrow")}</p>
            <h2 id="ranks-title" className="section-title mt-1">{t("ui.community.ranks.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("ui.community.ranks.lead")}</p>
            <ol className="mt-4 space-y-1">
              {RANKS.map((r) => (
                <li key={r.stars} className={`flex items-center gap-3 border border-line px-3 py-2.5 ${r.stars === 6 ? "row-selected" : "bg-surface-2"}`}>
                  <Stars lit={r.stars} size={14} />
                  <span lang={r.stars === 6 ? "en" : undefined} className="flex-1 font-display text-lg leading-none">{t(`ui.rank.${r.stars}`)}</span>
                  <span className="text-xs tabular-nums">{t("ui.community.ranks.min", { count: r.min })}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">{t("ui.community.ranks.soon")}</p>
          </section>

          <section className="card !p-5" aria-labelledby="discord-title">
            <h2 id="discord-title" lang="en" className="section-title">{t("ui.community.discord.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("ui.community.discord.body")}</p>
            {SITE.links.discord ? (
              <a href={SITE.links.discord} target="_blank" rel="noopener" className="btn mt-4">{t("ui.community.discord.join")}</a>
            ) : (
              <p className="mt-3 font-display text-[14px] tracking-[0.14em] text-sun">{t("ui.community.discord.soon")}</p>
            )}
          </section>

          <section className="card !p-5" aria-labelledby="rules-title">
            <h2 id="rules-title" className="section-title">{t("ui.community.rules.title")}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              {(["proof", "own", "spoilers", "respect"] as const).map((k) => (
                <li key={k} className="flex gap-2">
                  <span className="dot mt-1.5 !h-2 !w-2 bg-accent" aria-hidden="true" />
                  {t(`ui.community.rules.${k}`)}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
