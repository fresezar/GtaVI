import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt } from "@/components/editorial";
import PageBanner from "@/components/ui/PageBanner";
import PageShell from "@/components/ui/PageShell";
import { ART, type ArtName } from "@/config/art";
import { GUIDE_BY_SLUG, GUIDES } from "@/data/guides";
import { MISSABLES } from "@/data/missables";
import type { Guide, VerificationStatus } from "@/domain";
import { alternates, localePath, tFor, type Locale } from "@/i18n/server";

const DEFAULT_ART: ArtName = "banner-guides";
const artOf = (g: Guide): ArtName => (g.art && g.art in ART ? (g.art as ArtName) : DEFAULT_ART);

/** Full class names written out so Tailwind keeps them (it only sees literal strings). */
const BADGE: Record<VerificationStatus, string> = {
  verified: "badge-verified",
  unverified: "badge-unverified",
  disputed: "badge-disputed",
  deprecated: "badge-disputed",
};

/** Button labels for internal links listed in a guide's `related`. */
const RELATED_LABEL: Record<string, string> = {
  "/map": "ui.nav.map",
  "/checklists": "ui.nav.checklists",
  "/checklists/100-percent-completion": "ui.nav.checklists",
  "/guides/missables": "ui.nav.missables",
  "/news": "ui.nav.news",
};

/** Plain-text body: blank line = paragraph, "- " lines = bullet list. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n").map((l) => l.trim());
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="mt-3 list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={i} className="mt-3">{lines.join(" ")}</p>;
      })}
    </>
  );
}

// ---- index ----

export function guidesIndexMetadata(locale: Locale): Metadata {
  const t = tFor(locale);
  return { title: t("ui.guides.title"), description: t("ui.guides.lead"), alternates: alternates(locale, "/guides") };
}

export function GuidesIndexView({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  const href = (p: string) => localePath(locale, p);
  const cards = [
    { key: "missables", path: "/guides/missables", title: t("ui.missables.title"), lead: t("ui.missables.lead"), count: MISSABLES.length },
    ...GUIDES.map((g) => ({ key: g.id, path: `/guides/${g.slug}`, title: t(`guide.${g.id}.title`), lead: t(`guide.${g.id}.lead`), count: undefined })),
  ];
  return (
    <PageShell locale={locale} path="/guides">
      <PageBanner art={DEFAULT_ART} title={t("ui.guides.title")} lead={t("ui.guides.lead")} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.key}>
            <Link href={href(c.path)} className="card block h-full !p-5 transition hover:-translate-y-0.5 hover:border-accent">
              <p className="font-display text-xl leading-tight">{c.title}</p>
              <p className="mt-2 text-sm text-muted">{c.lead}</p>
              {c.count !== undefined && <p className="mt-3 text-xs font-bold text-accent2">{t("ui.missables.count", { count: c.count })}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

// ---- single guide ----

export const guideStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export function guideMetadata(locale: Locale, slug: string): Metadata {
  const g = GUIDE_BY_SLUG.get(slug);
  if (!g) return {};
  const t = tFor(locale);
  return {
    title: t(`guide.${g.id}.title`),
    description: t(`guide.${g.id}.lead`),
    alternates: alternates(locale, `/guides/${g.slug}`),
  };
}

export function GuideView({ locale, slug }: { locale: Locale; slug: string }) {
  const g = GUIDE_BY_SLUG.get(slug);
  if (!g) notFound();
  const t = tFor(locale);
  const fmt = dateFmt(locale);
  const k = (s: string) => `guide.${g.id}.${s}`;
  return (
    <PageShell locale={locale} path={`/guides/${g.slug}`} width="max-w-3xl">
      <PageBanner art={artOf(g)} title={t(k("title"))} lead={t(k("lead"))} />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
        <span className={`badge ${BADGE[g.status]}`}>{t(`ui.pin.status.${g.status}`)}</span>
        <span>{t("ui.guides.updated", { date: fmt((g.updatedAt ?? g.addedAt).slice(0, 10)) })}</span>
      </div>

      {g.sections.length > 1 && (
        <nav aria-label={t("ui.guides.contents")} className="card mb-8 !p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{t("ui.guides.contents")}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {g.sections.map((s) => (
              <li key={s}><a href={`#${s}`} className="underline hover:text-accent">{t(k(`s.${s}.title`))}</a></li>
            ))}
          </ol>
        </nav>
      )}

      <article className="space-y-8 leading-relaxed">
        {g.sections.map((s) => (
          <section key={s} id={s} className="scroll-mt-24">
            <h2 className="section-title">{t(k(`s.${s}.title`))}</h2>
            {g.spoilerLevel === "none" ? (
              <Body text={t(k(`s.${s}.body`))} />
            ) : (
              <details className="mt-2">
                <summary className="cursor-pointer font-bold text-accent">{t("ui.pin.spoiler")}</summary>
                <Body text={t(k(`s.${s}.body`))} />
              </details>
            )}
          </section>
        ))}
      </article>

      {g.related && g.related.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {g.related.map((r) => (
            <Link key={r} href={localePath(locale, r)} className="btn">{t(RELATED_LABEL[r] ?? "ui.guides.title")} →</Link>
          ))}
        </div>
      )}

      <footer className="card mt-10 !p-4 text-xs text-muted">
        <p className="font-bold uppercase tracking-wider">{t("ui.guides.sources")}</p>
        <ul className="mt-2 space-y-1">
          {g.sources.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">{s.name}</a></li>
          ))}
        </ul>
        <p className="mt-3">{t("ui.guides.sourcesNote")}</p>
      </footer>
    </PageShell>
  );
}
