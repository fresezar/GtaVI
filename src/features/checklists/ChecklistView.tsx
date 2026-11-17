"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isPlaced, type Checklist } from "@/domain";
import { PIN_BY_ID } from "@/data/pins";
import { useProgress } from "@/hooks/useProgress";
import { SITE } from "@/config/site";
import { useHref, useT } from "@/i18n/client";
import { checklistItemKey, checklistKey, checklistSectionKey, pinKey } from "@/i18n/keys";
import { checklistRef, computeChecklistProgress } from "@/lib/progress";
import type { ChecklistItem } from "@/domain";

export default function ChecklistView({ checklist }: { checklist: Checklist }) {
  const t = useT();
  const href = useHref();
  /** Pin-linked items reuse the pin's title, so text is written once. */
  const itemLabel = (item: ChecklistItem) => t(item.linkedPinId ? pinKey(item.linkedPinId, "title") : checklistItemKey(item.id));
  const { ready, progress, isDone, toggle } = useProgress(SITE.gameId);
  const [hideDone, setHideDone] = useState(false);
  const summary = useMemo(() => computeChecklistProgress(checklist, progress), [checklist, progress]);
  const percent = ready ? summary.percent : 0;

  return (
    <div className="space-y-5">
      <section className="card" aria-label="Progress">
        <h1 className="font-display text-3xl leading-tight">{t(checklistKey(checklist.id))}</h1>
        <div className="mt-3 flex items-end justify-between">
          <p className="font-display text-5xl leading-none">{percent}%</p>
          <p className="pb-1 text-sm font-bold uppercase tracking-wider">{t("ui.progress.complete")}</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-sun transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          {t("ui.checklist.hideDone")}
        </label>
      </section>

      {checklist.sections.length === 0 && <p className="card text-sm text-muted">{t("ui.checklist.empty")}</p>}

      {checklist.sections.map((section) => {
        const pair = summary.bySection[section.id] ?? { done: 0, total: 0 };
        const items = section.items.filter((i) => !(hideDone && isDone(checklistRef(i))));
        return (
          <section key={section.id} aria-label={t(checklistSectionKey(checklist.id, section.id))}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-display text-xl">{t(checklistSectionKey(checklist.id, section.id))}</h2>
              <span className="text-sm tabular-nums text-muted">{pair.done}/{pair.total}</span>
            </div>
            <ul className="space-y-1.5">
              {items.map((item) => {
                const ref = checklistRef(item);
                const done = isDone(ref);
                return (
                  <li key={item.id} className="flex items-stretch gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      onClick={() => toggle(ref)}
                      disabled={!ready}
                      className={`row flex-1 ${done ? "row-off" : ""}`}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line-strong bg-[#140c22] text-sm font-black text-accent2" aria-hidden="true">
                        {done ? "✓" : ""}
                      </span>
                      <span className={`flex-1 text-left ${done ? "line-through" : ""}`}>{itemLabel(item)}</span>
                    </button>
                    {item.linkedPinId && (() => {
                      const pin = PIN_BY_ID.get(item.linkedPinId);
                      if (!pin) return null;
                      // Not on the map yet: the pin page still has the clip and the credit.
                      return isPlaced(pin) ? (
                        <Link href={`${href("/map")}?pin=${pin.id}`} className="btn shrink-0">{t("ui.checklist.onMap")}</Link>
                      ) : (
                        <Link href={href(`/pins/${pin.slug}`)} className="btn shrink-0 border-dashed">{t("ui.checklist.details")}</Link>
                      );
                    })()}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
