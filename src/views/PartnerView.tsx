import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import ViceBand from "@/components/ui/ViceBand";
import { SITE } from "@/config/site";
import { PARTNERS, PARTNER_BY_SLUG, VIA_PREFIX, initials, partnerUrl, type Partner } from "@/data/partners";
import { PINS, pinPath } from "@/data/pins";
import PartnerFinds, { type StaticFind } from "@/features/partners/PartnerFinds";
import RefCapture from "@/features/partners/RefCapture";
import { alternates, localePath, tFor, type Locale } from "@/i18n/server";
import { pinKey } from "@/i18n/keys";

/** Static export needs at least one path: with no partners yet, one placeholder that renders the 404 page. */
export const partnerStaticParams = () => (PARTNERS.length ? PARTNERS.map((p) => ({ slug: p.slug })) : [{ slug: "none" }]);

export function partnerMetadata(locale: Locale, slug: string): Metadata {
  const p = PARTNER_BY_SLUG.get(slug);
  if (!p) return {};
  const t = tFor(locale);
  return {
    title: t("ui.partner.meta.title", { name: p.name }),
    description: t("ui.partner.lead", { name: p.name }),
    alternates: alternates(locale, `/p/${slug}`),
    // Invited partners get a working page to preview; it stays out of search until they post.
    ...(p.status === "active" ? {} : { robots: { index: false, follow: false } }),
  };
}

/** Partner logo (public/partners/<logo>) or their initials in a ring. */
export function PartnerBadge({ partner, size = 64 }: { partner: Partner; size?: number }) {
  if (partner.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/partners/${partner.logo}`}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border-2 border-white/80 object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="grid shrink-0 place-items-center rounded-full border-2 border-white/80 bg-black/30 font-display leading-none"
    >
      {initials(partner.name)}
    </span>
  );
}

/** /p/<slug>: a partner's own landing page. Followers arrive from the partner's post and add their finds. */
export default function PartnerView({ locale, slug }: { locale: Locale; slug: string }) {
  const p = PARTNER_BY_SLUG.get(slug);
  if (!p) notFound();
  const t = tFor(locale);
  const href = (path: string) => localePath(locale, path);
  const profile = partnerUrl(p);
  const baked: StaticFind[] = PINS.filter((pin) => pin.tags?.includes(`${VIA_PREFIX}${slug}`)).map((pin) => ({
    id: pin.id,
    path: pinPath(pin),
    title: t(pinKey(pin.id, "title")),
    by: pin.credit?.name,
  }));

  return (
    <PageShell locale={locale} path={`/p/${slug}`}>
      <RefCapture slug={slug} />
      <ViceBand eyebrow={t("ui.partner.eyebrow")} title={t("ui.partner.title")} lead={t("ui.partner.lead", { name: p.name })}>
        <span className="flex items-center gap-3">
          <PartnerBadge partner={p} size={56} />
          <span className="font-display text-2xl leading-none normal-case">
            {p.name} <span className="text-white/70">×</span> <span lang="en">Six Star</span>
          </span>
        </span>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href={`${href("/map")}?suggest=1&ref=${slug}`} className="btn btn-primary">
            {t("ui.partner.cta")}
          </Link>
          <Link href={`${href("/map")}?ref=${slug}`} className="btn">
            {t("ui.partner.map")}
          </Link>
          <span className="text-sm text-white/80">{t("ui.partner.ctaNote")}</span>
        </div>
      </ViceBand>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-8">
          <section className="card !p-5" aria-labelledby="how-title">
            <p className="eyebrow">{t("ui.community.contribute.eyebrow")}</p>
            <h2 id="how-title" className="section-title mt-1">
              {t("ui.community.contribute.title")}
            </h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              {(["find", "suggest", "verify"] as const).map((step, i) => (
                <li key={step} className="border border-line bg-surface-2 p-4">
                  <span className="file-no text-accent">0{i + 1}</span>
                  <h3 className="mt-1 font-display text-xl leading-tight">{t(`ui.community.step.${step}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t(`ui.community.step.${step}.body`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="finds-title">
            <h2 id="finds-title" className="section-title">
              {t("ui.partner.finds.title")}
            </h2>
            <PartnerFinds slug={slug} name={p.name} baked={baked} />
          </section>
        </div>

        <aside className="space-y-8">
          <section className="card !p-5" aria-labelledby="weekly-title">
            <h2 id="weekly-title" className="section-title">
              {t("ui.partner.weekly.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("ui.partner.weekly.body", { name: p.name })}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile && (
                <a href={profile} target="_blank" rel="noopener" className="btn btn-primary">
                  {t("ui.partner.follow")}
                </a>
              )}
              {SITE.links.youtube && (
                <a href={SITE.links.youtube} target="_blank" rel="noopener" className="btn">
                  {t("ui.community.youtube")}
                </a>
              )}
              {SITE.links.discord && (
                <a href={SITE.links.discord} target="_blank" rel="noopener" className="btn">
                  {t("ui.community.discord.join")}
                </a>
              )}
            </div>
          </section>

          <section className="card !p-5" aria-labelledby="rules-title">
            <h2 id="rules-title" className="section-title">
              {t("ui.community.rules.title")}
            </h2>
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
