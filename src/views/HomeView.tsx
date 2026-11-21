import type { Metadata } from "next";
import Link from "next/link";
import { dateFmt, NewsList, RoadTimeline } from "@/components/editorial";
import Art from "@/components/ui/Art";
import LaunchCountdown from "@/components/ui/LaunchCountdown";
import type { ArtName } from "@/config/art";
import PageShell from "@/components/ui/PageShell";
import { SITE } from "@/config/site";
import SubscribeForm from "@/features/subscribe/SubscribeForm";
import { CATEGORIES } from "@/data/categories";
import { NEWS, TIMELINE } from "@/data/editorial";
import { PINS, SAMPLE_MODE } from "@/data/pins";
import type { Pin } from "@/domain";
import { CATEGORY_COLORS } from "@/features/map/tokens";
import { alternates, localePath, tFor, type Locale, type Translate } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";

const LATEST = 6;

const EXPLORE = [
  { key: "map", path: "/map", live: true },
  { key: "checklists", path: "/checklists", live: true },
  { key: "missables", path: "/guides/missables", live: true, art: "card-missions" },
  { key: "vehicles", live: false },
  { key: "weapons", live: false },
  { key: "money", live: false },
  { key: "online", live: false },
  { key: "radio", live: false },
] as const;

export function homeMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return {
    title: { absolute: t("ui.meta.title", { name: SITE.name }) },
    description: t("ui.meta.description"),
    alternates: alternates(locale, "/"),
  };
}

function latestPins(): Pin[] {
  return [...PINS].sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.id.localeCompare(a.id)).slice(0, LATEST);
}

function Stats({ t }: { t: Translate }) {
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
        <div key={s.key} className="rounded-2xl border border-line bg-bg/70 px-3 py-2 backdrop-blur-md">
          <dt className="text-[10px] font-extrabold uppercase tracking-widest text-muted">{t(s.key)}</dt>
          <dd className="font-display text-2xl leading-tight">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LatestFinds({ locale, t }: { locale: Locale; t: Translate }) {
  const fmt = dateFmt(locale);
  return (
    <section id="latest" className="scroll-mt-24" aria-labelledby="latest-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="latest-title" className="section-title">{t("ui.home.latest")}</h2>
          <p className="mt-1 text-sm text-muted">{t("ui.home.latestLead")}</p>
        </div>
        <Link href={localePath(locale, "/map")} className="text-sm font-bold text-accent2 underline">{t("ui.home.allFinds")} →</Link>
      </div>
      {SAMPLE_MODE && <p className="mt-3 inline-block rounded-full bg-sun/15 px-3 py-1 text-xs font-bold text-sun">{t("ui.home.sample")}</p>}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {latestPins().map((pin) => {
          const c = CATEGORIES.find((x) => x.id === pin.categoryId);
          return (
            <li key={pin.id}>
              <Link href={localePath(locale, `/pins/${pin.slug}`)} className="card flex h-full flex-col gap-2 !p-3 transition hover:border-line-strong">
                <div className="flex items-center justify-between gap-2">
                  <span className="chip" style={{ ["--dot" as string]: c ? CATEGORY_COLORS[c.colorToken] : undefined }}>
                    {c ? t(categoryKey(c.id)) : ""}
                  </span>
                  <span className={`badge badge-${pin.status}`}>{t(`ui.pin.status.${pin.status}`)}</span>
                </div>
                <p className="font-bold leading-snug">{t(pinKey(pin.id, "title"))}</p>
                <p className="mt-auto text-xs text-muted">
                  {fmt(pin.addedAt)}
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

function Road({ locale, t }: { locale: Locale; t: Translate }) {
  return (
    <section id="road" className="card scroll-mt-24 !p-5" aria-labelledby="road-title">
      <h2 id="road-title" className="section-title">{t("ui.home.road")}</h2>
      <p className="mt-1 text-sm text-muted">{t("ui.home.roadLead")}</p>
      <div className="mt-5">
        <RoadTimeline events={TIMELINE} locale={locale} t={t} />
      </div>
    </section>
  );
}

const HOME_NEWS = 5;

function News({ locale, t }: { locale: Locale; t: Translate }) {
  if (NEWS.length === 0) return null;
  return (
    <section aria-labelledby="news-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="news-title" className="section-title">{t("ui.home.news")}</h2>
        <Link href={localePath(locale, "/news")} className="text-sm font-bold text-accent2 underline">{t("ui.news.all")} →</Link>
      </div>
      <div className="mt-4">
        <NewsList items={NEWS.slice(0, HOME_NEWS)} locale={locale} t={t} />
      </div>
    </section>
  );
}

function Explore({ locale, t }: { locale: Locale; t: Translate }) {
  return (
    <section aria-labelledby="explore-title">
      <h2 id="explore-title" className="section-title">{t("ui.home.explore")}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {EXPLORE.map((e) => {
          const body = (
            <>
              <Art name={"art" in e ? e.art : (`card-${e.key}` as ArtName)} sizes="(min-width: 1024px) 280px, 50vw" className="aspect-[16/10] w-full" />
              <div className="p-3">
                <span className={`badge ${e.live ? "badge-verified" : "bg-surface-2 text-muted"}`}>{t(e.live ? "ui.home.live" : "ui.home.soon")}</span>
                <p className="mt-2 font-display text-lg leading-tight">{t(`ui.explore.${e.key}`)}</p>
                <p className="mt-1 text-xs leading-snug text-muted">{t(`ui.explore.${e.key}.desc`)}</p>
              </div>
            </>
          );
          return (
            <li key={e.key}>
              {"path" in e ? (
                <Link href={localePath(locale, e.path)} className="card block h-full overflow-hidden !p-0 transition hover:-translate-y-0.5 hover:border-accent">{body}</Link>
              ) : (
                <div className="card h-full overflow-hidden !p-0 [&_img]:opacity-60 [&_img]:saturate-50">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function HomeView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  return (
    <PageShell locale={locale} path="/">
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="sticker">{t("ui.home.eyebrow")}</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">{t("ui.home.title")}</h1>
          <p className="mt-5 max-w-xl text-base text-ink sm:text-lg">{t("ui.home.lead")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={localePath(locale, "/map")} className="btn btn-primary min-h-[48px] px-6 text-base">{t("ui.nav.openMap")} →</Link>
            <Link href={localePath(locale, "/checklists")} className="btn min-h-[48px] px-6 text-base">{t("ui.home.ctaChecklists")}</Link>
          </div>
          <div className="mt-8">
            <LaunchCountdown />
          </div>
        </div>
        {SITE.officialArt ? (
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line-strong shadow-neon">
            <Art name="hero" sizes="(min-width: 1024px) 460px, 100vw" priority className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-3 bottom-3">
              <Stats t={t} />
            </div>
          </div>
        ) : (
          <div className="card !p-5">
            <Stats t={t} />
          </div>
        )}
      </section>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <LatestFinds locale={locale} t={t} />
          <News locale={locale} t={t} />
        </div>
        <Road locale={locale} t={t} />
      </div>

      <div className="mt-14">
        <Explore locale={locale} t={t} />
      </div>

      <section className="card mt-10 grid gap-6 !p-5 lg:grid-cols-[1fr_1.1fr]" aria-labelledby="online-title">
        <div>
          <p className="eyebrow">GTA 6 Online</p>
          <h2 id="online-title" className="section-title mt-1">{t("ui.home.online.title")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t("ui.home.online.lead")}</p>
          <Link href={localePath(locale, "/online")} className="mt-3 inline-block text-sm font-bold underline">{t("ui.home.online.more")} →</Link>
        </div>
        <SubscribeForm topics={["online", "weekly"]} source="/" />
      </section>
    </PageShell>
  );
}
