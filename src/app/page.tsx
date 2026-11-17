import Link from "next/link";
import LaunchCountdown from "@/components/ui/LaunchCountdown";
import PageShell from "@/components/ui/PageShell";
import { CATEGORIES } from "@/data/categories";
import { NEWS, TIMELINE } from "@/data/editorial";
import { PINS, SAMPLE_MODE } from "@/data/pins";
import type { EditorialKind, Pin } from "@/domain";
import { CATEGORY_COLORS } from "@/features/map/tokens";
import { t } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";

const LATEST = 6;

const EXPLORE = [
  { key: "map", href: "/map", live: true },
  { key: "checklists", href: "/checklists", live: true },
  { key: "vehicles", live: false },
  { key: "weapons", live: false },
  { key: "missions", live: false },
  { key: "money", live: false },
  { key: "online", live: false },
  { key: "radio", live: false },
] as const;

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

function Badge({ kind }: { kind: EditorialKind }) {
  return <span className={`badge badge-${kind}`}>{t(`ui.badge.${kind}`)}</span>;
}

function latestPins(): Pin[] {
  return [...PINS].sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.id.localeCompare(a.id)).slice(0, LATEST);
}

function Stats() {
  const finders = new Set(PINS.map((p) => p.credit?.name).filter(Boolean)).size;
  const items = [
    { value: PINS.length, key: "ui.home.stats.pins" },
    { value: PINS.filter((p) => p.status === "verified").length, key: "ui.home.stats.verified" },
    { value: finders, key: "ui.home.stats.finders" },
    { value: CATEGORIES.length, key: "ui.home.stats.categories" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2">
      {items.map((s) => (
        <div key={s.key} className="rounded-2xl border border-line bg-surface-2 px-3 py-2">
          <dt className="text-[10px] font-extrabold uppercase tracking-widest text-muted">{t(s.key)}</dt>
          <dd className="font-display text-2xl leading-tight">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LatestFinds() {
  return (
    <section id="latest" className="scroll-mt-24" aria-labelledby="latest-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="latest-title" className="section-title">{t("ui.home.latest")}</h2>
          <p className="mt-1 text-sm text-muted">{t("ui.home.latestLead")}</p>
        </div>
        <Link href="/map" className="text-sm font-bold text-accent2 underline">{t("ui.home.allFinds")} →</Link>
      </div>
      {SAMPLE_MODE && <p className="mt-3 inline-block rounded-full bg-sun/15 px-3 py-1 text-xs font-bold text-sun">{t("ui.home.sample")}</p>}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {latestPins().map((pin) => {
          const c = CATEGORIES.find((x) => x.id === pin.categoryId);
          return (
            <li key={pin.id}>
              <Link href={`/pins/${pin.slug}`} className="card flex h-full flex-col gap-2 !p-3 transition hover:border-line-strong">
                <div className="flex items-center justify-between gap-2">
                  <span className="chip" style={{ ["--dot" as string]: c ? CATEGORY_COLORS[c.colorToken] : undefined }}>
                    {c ? t(categoryKey(c.id)) : ""}
                  </span>
                  <span className={`badge badge-${pin.status}`}>{t(`ui.pin.status.${pin.status}`)}</span>
                </div>
                <p className="font-bold leading-snug">{t(pinKey(pin.id, "title"))}</p>
                <p className="mt-auto text-xs text-muted">
                  {fmtDate(pin.addedAt)}
                  {pin.credit ? ` · ${t("ui.pin.foundBy", { name: pin.credit.name })}` : ""}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Road() {
  return (
    <section id="road" className="card scroll-mt-24 !p-5" aria-labelledby="road-title">
      <h2 id="road-title" className="section-title">{t("ui.home.road")}</h2>
      <p className="mt-1 text-sm text-muted">{t("ui.home.roadLead")}</p>
      <ol className="mt-5 space-y-5 border-l border-line-strong pl-5">
        {TIMELINE.map((e) => (
          <li key={e.id} className="relative">
            <span
              className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${e.kind === "launch" ? "bg-accent shadow-neon" : "bg-accent2"}`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
              <time dateTime={e.date}>{fmtDate(e.date)}</time>
              <Badge kind={e.kind} />
            </div>
            <p className={`mt-1 font-bold leading-snug ${e.kind === "launch" ? "neon text-lg" : ""}`}>{t(`timeline.${e.id}.title`)}</p>
            <p className="mt-1 text-sm text-muted">{t(`timeline.${e.id}.body`)}</p>
            <a href={e.sourceUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-xs font-bold text-muted underline hover:text-ink">
              {t("ui.source")}: {e.sourceName}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function News() {
  if (NEWS.length === 0) return null;
  return (
    <section aria-labelledby="news-title">
      <h2 id="news-title" className="section-title">{t("ui.home.news")}</h2>
      <ul className="mt-4 space-y-2">
        {NEWS.slice(0, 8).map((n) => (
          <li key={n.id} className="card !p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
              <time dateTime={n.date}>{fmtDate(n.date)}</time>
              <Badge kind={n.kind} />
            </div>
            <p className="mt-1 font-bold">{t(`news.${n.id}.title`)}</p>
            <p className="mt-1 text-sm text-muted">{t(`news.${n.id}.summary`)}</p>
            <a href={n.sourceUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-xs font-bold text-muted underline">
              {t("ui.source")}: {n.sourceName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Explore() {
  return (
    <section aria-labelledby="explore-title">
      <h2 id="explore-title" className="section-title">{t("ui.home.explore")}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {EXPLORE.map((e) => {
          const body = (
            <>
              <span className={`badge ${e.live ? "badge-verified" : "bg-surface-2 text-muted"}`}>{t(e.live ? "ui.home.live" : "ui.home.soon")}</span>
              <p className="mt-2 font-display text-lg leading-tight">{t(`ui.explore.${e.key}`)}</p>
              <p className="mt-1 text-xs leading-snug text-muted">{t(`ui.explore.${e.key}.desc`)}</p>
            </>
          );
          return (
            <li key={e.key}>
              {"href" in e ? (
                <Link href={e.href} className="card block h-full !p-3 transition hover:-translate-y-0.5 hover:border-accent">{body}</Link>
              ) : (
                <div className="card h-full !p-3 opacity-70">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Home() {
  return (
    <PageShell>
      <section className="grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="sticker">{t("ui.home.eyebrow")}</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
            {t("ui.home.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink sm:text-lg">{t("ui.home.lead")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/map" className="btn btn-primary min-h-[48px] px-6 text-base">{t("ui.nav.openMap")} →</Link>
            <Link href="/checklists" className="btn min-h-[48px] px-6 text-base">{t("ui.home.ctaChecklists")}</Link>
          </div>
        </div>
        <div className="card space-y-4 !p-5">
          <LaunchCountdown />
          <Stats />
        </div>
      </section>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <LatestFinds />
          <News />
        </div>
        <Road />
      </div>

      <div className="mt-14">
        <Explore />
      </div>

      <section className="card mt-10 !p-5" aria-labelledby="join-title">
        <h2 id="join-title" className="section-title">{t("ui.home.community")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("ui.home.communityLead")}</p>
      </section>
    </PageShell>
  );
}
