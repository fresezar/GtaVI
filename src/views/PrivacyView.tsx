import type { Metadata } from "next";
import PageBanner from "@/components/ui/PageBanner";
import PageShell from "@/components/ui/PageShell";
import { LICENSE_URL, PRIVACY, PRIVACY_UPDATED } from "@/data/privacy";
import { alternates, LOCALE_TAG, type Locale } from "@/i18n/server";

export function privacyMetadata(locale: Locale): Metadata {
  const doc = PRIVACY[locale];
  return { title: doc.title, description: doc.lead, alternates: alternates(locale, "/privacy") };
}

/** Privacy notice + data sources and credits (CC BY attribution lives here and on the map). */
export default function PrivacyView({ locale }: { locale: Locale }) {
  const doc = PRIVACY[locale];
  const date = new Date(`${PRIVACY_UPDATED}T12:00:00Z`).toLocaleDateString(LOCALE_TAG[locale], { year: "numeric", month: "long", day: "numeric" });
  return (
    <PageShell locale={locale} path="/privacy" width="max-w-3xl">
      <PageBanner eyebrow="Six Star" title={doc.title} lead={doc.lead} />
      <p className="-mt-4 mb-6 text-xs text-muted">{doc.updated.replace("{date}", date)}</p>
      <div className="space-y-4">
        {doc.blocks.map((b) => (
          <section key={b.h} className="card !p-5">
            <h2 className="section-title">{b.h}</h2>
            {b.p?.map((para, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-muted">{para}</p>
            ))}
            {b.list && (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                {b.list.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="dot mt-1.5 !h-2 !w-2 shrink-0 bg-accent" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <section id="credits" className="card scroll-mt-24 !p-5">
          <h2 className="section-title">{doc.creditsTitle}</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed">
            {doc.credits.map((c) => (
              <li key={c.name}>
                <a href={c.url} target="_blank" rel="noopener" className="font-bold underline">{c.name}</a>
                <span className="text-muted"> · {c.what}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            CC BY 4.0:{" "}
            <a href={LICENSE_URL} target="_blank" rel="noopener" className="underline">{LICENSE_URL}</a>
          </p>
        </section>
      </div>
    </PageShell>
  );
}
