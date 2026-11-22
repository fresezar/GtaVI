"use client";

import { useCommunityPins } from "@/features/community/useCommunityPins";
import { VIA_PREFIX } from "@/data/partners";
import { useHref, useT } from "@/i18n/client";
import { pinKey } from "@/i18n/keys";

export interface StaticFind {
  id: string;
  /** English path: the pin page or its spot on the map (pinPath). */
  path: string;
  title: string;
  by?: string;
}

/** Finds that came through one partner: baked pins (from the server) plus approved live ones. */
export default function PartnerFinds({ slug, name, baked }: { slug: string; name: string; baked: StaticFind[] }) {
  const t = useT();
  const href = useHref();
  const live = useCommunityPins().filter((p) => p.tags?.includes(`${VIA_PREFIX}${slug}`));
  const rows = [
    ...live.map((p) => ({ id: p.id, title: t(pinKey(p.id, "title")), by: p.credit?.name, to: `${href("/map")}?pin=${p.id}` })),
    ...baked.map((p) => ({ id: p.id, title: p.title, by: p.by, to: href(p.path) })),
  ];

  if (rows.length === 0) return <p className="card mt-4 text-sm leading-relaxed text-muted">{t("ui.partner.finds.empty", { name })}</p>;
  return (
    <ol className="glass mt-4 divide-y divide-line">
      {rows.slice(0, 30).map((r) => (
        <li key={r.id}>
          <a href={r.to} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg normal-case">{r.title}</span>
              {r.by && (
                <span className="block truncate text-xs text-muted">
                  {t("ui.pin.foundByLabel")}: {r.by}
                </span>
              )}
            </span>
            <span aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
