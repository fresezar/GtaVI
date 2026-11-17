import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import { CATEGORIES } from "@/data/categories";
import { CHECKLISTS } from "@/data/checklists";
import { PINS } from "@/data/pins";
import type { Pin } from "@/domain";
import { CATEGORY_COLORS } from "@/features/map/tokens";
import { t } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";
import { formatTimestamp, parseSource, type SourceInfo } from "@/lib/source";

export const dynamicParams = false;

export function generateStaticParams() {
  return PINS.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

const find = (slug: string) => PINS.find((p) => p.slug === slug);
const NEARBY = 5;

function text(pin: Pin) {
  const title = t(pinKey(pin.id, "title"));
  const descKey = pinKey(pin.id, "description");
  const desc = t(descKey);
  return { title, description: desc !== descKey && desc ? desc : "" };
}

function nearby(pin: Pin): Pin[] {
  return PINS.filter((p) => p.id !== pin.id && p.mapId === pin.mapId)
    .map((p) => ({ p, d: Math.hypot(p.coord[0] - pin.coord[0], p.coord[1] - pin.coord[1]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, NEARBY)
    .map((x) => x.p);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const pin = find((await params).slug);
  if (!pin) return { title: "Not found" };
  const { title, description } = text(pin);
  const category = t(categoryKey(pin.categoryId));
  return {
    title: `${title} · ${category}`,
    // Spoiler text never goes into search snippets.
    description: pin.spoilerLevel === "none" && description ? description : t("ui.pin.metaDescription", { title, category }),
    alternates: { canonical: `/pins/${pin.slug}/` },
  };
}

function SourceBlock({ source }: { source: SourceInfo }) {
  if (source.kind === "youtube") {
    const start = source.start ? `?start=${source.start}` : "";
    return (
      <div className="mt-5">
        <div className="aspect-video overflow-hidden rounded-xl border border-line-strong bg-bg">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${source.videoId}${start}`}
            title="Source video"
            loading="lazy"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <a href={source.url} target="_blank" rel="noopener" className="mt-2 inline-block text-sm font-bold underline">
          {source.start
            ? t("ui.pin.watchAt", { platform: "YouTube", time: formatTimestamp(source.start) })
            : t("ui.pin.watch", { platform: "YouTube" })}
        </a>
      </div>
    );
  }
  if (source.kind === "twitch") {
    return (
      <a href={source.url} target="_blank" rel="noopener" className="btn mt-5">
        {source.start
          ? t("ui.pin.watchAt", { platform: "Twitch", time: formatTimestamp(source.start) })
          : t("ui.pin.watch", { platform: "Twitch" })}
      </a>
    );
  }
  return (
    <p className="mt-5 text-sm">
      {t("ui.pin.source")}:{" "}
      <a href={source.url} target="_blank" rel="noopener ugc" className="font-bold underline">{source.host}</a>
    </p>
  );
}

export default async function PinPage({ params }: Params) {
  const pin = find((await params).slug);
  if (!pin) notFound();
  const category = CATEGORIES.find((c) => c.id === pin.categoryId);
  const { title, description } = text(pin);
  const source = parseSource(pin.provenance?.sourceUrl);
  const creditUrl = pin.credit?.url && /^https?:\/\//.test(pin.credit.url) ? pin.credit.url : undefined;
  const categoryChecklist = category ? CHECKLISTS.find((c) => c.slug === category.slug) : undefined;
  const hint =
    pin.status === "unverified" ? t("ui.pin.status.unverifiedHint") : pin.status === "disputed" ? t("ui.pin.status.disputedHint") : "";

  return (
    <PageShell width="max-w-2xl">
        <Link href="/map" className="text-sm font-bold text-muted underline hover:text-ink">{t("ui.pin.backToMap")}</Link>

        <article className="card mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <span className="chip" style={{ ["--dot" as string]: CATEGORY_COLORS[category.colorToken] }}>
                {t(categoryKey(category.id))}
              </span>
            )}
            <span className={`badge badge-${pin.status}`}>{t(`ui.pin.status.${pin.status}`)}</span>
          </div>

          <h1 className="mt-3 font-display text-4xl leading-tight">{title}</h1>

          {description && pin.spoilerLevel === "none" && <p className="mt-3">{description}</p>}
          {description && pin.spoilerLevel !== "none" && (
            <details className="mt-3">
              <summary className="cursor-pointer font-bold text-accent">{t("ui.pin.spoiler")}</summary>
              <p className="mt-2">{description}</p>
            </details>
          )}

          {source && <SourceBlock source={source} />}

          {pin.credit && (
            <p className="mt-4 text-sm">
              {creditUrl ? (
                <a href={creditUrl} target="_blank" rel="noopener" className="font-bold underline">
                  {t("ui.pin.foundBy", { name: pin.credit.name })}
                </a>
              ) : (
                <span className="font-bold">{t("ui.pin.foundBy", { name: pin.credit.name })}</span>
              )}
            </p>
          )}

          {hint && <p className="mt-3 rounded-xl border border-dashed border-line-strong p-2 text-xs text-muted">{hint}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/map?pin=${pin.id}`} className="btn btn-primary">{t("ui.pin.showOnMap")}</Link>
            {categoryChecklist && category && (
              <Link href={`/checklists/${categoryChecklist.slug}`} className="btn">
                {t("ui.pin.allInCategory", { category: t(categoryKey(category.id)) })}
              </Link>
            )}
          </div>
        </article>

        {nearby(pin).length > 0 && (
          <section className="mt-8" aria-label={t("ui.pin.nearby")}>
            <h2 className="font-display text-2xl">{t("ui.pin.nearby")}</h2>
            <ul className="mt-3 space-y-1.5">
              {nearby(pin).map((p) => {
                const c = CATEGORIES.find((x) => x.id === p.categoryId);
                return (
                  <li key={p.id}>
                    <Link href={`/pins/${p.slug}`} className="row">
                      <span className="dot" style={{ background: c ? CATEGORY_COLORS[c.colorToken] : undefined }} />
                      <span className="flex-1">{t(pinKey(p.id, "title"))}</span>
                      <span className="text-xs text-muted">{c ? t(categoryKey(c.id)) : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

    </PageShell>
  );
}
