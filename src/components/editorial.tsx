import type { EditorialKind, NewsItem, TimelineEvent } from "@/domain";
import { LOCALE_TAG, localePath, type Locale, type Translate } from "@/i18n/server";

/** Shared by the home hub and the news page: same badges and source lines everywhere. */

export const dateFmt = (locale: Locale) => (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(LOCALE_TAG[locale], { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

/** Full class names written out: Tailwind only keeps classes it sees as literal strings. */
const BADGE_CLASS: Record<EditorialKind, string> = {
  confirmed: "badge-confirmed",
  reported: "badge-reported",
  rumor: "badge-rumor",
  launch: "badge-launch",
};

export function Badge({ kind, t }: { kind: EditorialKind; t: Translate }) {
  return <span className={`badge ${BADGE_CLASS[kind]}`}>{t(`ui.badge.${kind}`)}</span>;
}

export function NewsList({ items, locale, t }: { items: readonly NewsItem[]; locale: Locale; t: Translate }) {
  const fmt = dateFmt(locale);
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id} id={n.id} className="card scroll-mt-24 !p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
            <time dateTime={n.date}>{fmt(n.date)}</time>
            <Badge kind={n.kind} t={t} />
          </div>
          <p className="mt-1 font-bold leading-snug">{t(`news.${n.id}.title`)}</p>
          <p className="mt-1 text-sm text-muted">{t(`news.${n.id}.summary`)}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
            <a href={n.sourceUrl} target="_blank" rel="noopener" className="text-muted underline hover:text-ink">
              {t("ui.source")}: {n.sourceName}
            </a>
            {n.internalHref && (
              <a href={n.internalHref.startsWith("/") ? localePath(locale, n.internalHref) : n.internalHref} className="text-accent2 underline">
                {t("ui.news.related")} →
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RoadTimeline({ events, locale, t }: { events: readonly TimelineEvent[]; locale: Locale; t: Translate }) {
  const fmt = dateFmt(locale);
  return (
    <ol className="space-y-5 border-l border-line-strong pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${e.kind === "launch" ? "bg-accent shadow-neon" : "bg-accent2"}`}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
            <time dateTime={e.date}>{fmt(e.date)}</time>
            <Badge kind={e.kind} t={t} />
          </div>
          <p className={`mt-1 font-bold leading-snug ${e.kind === "launch" ? "neon text-lg" : ""}`}>{t(`timeline.${e.id}.title`)}</p>
          <p className="mt-1 text-sm text-muted">{t(`timeline.${e.id}.body`)}</p>
          <a href={e.sourceUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-xs font-bold text-muted underline hover:text-ink">
            {t("ui.source")}: {e.sourceName}
          </a>
        </li>
      ))}
    </ol>
  );
}
