"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Checklist } from "@/domain";
import { useProgress } from "@/hooks/useProgress";
import { SITE } from "@/config/site";
import { t } from "@/i18n";
import { checklistItemKey, checklistKey, checklistSectionKey } from "@/i18n/keys";
import { checklistRef, computeChecklistProgress } from "@/lib/progress";

export default function ChecklistView({ checklist }: { checklist: Checklist }) {
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
        <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-line bg-bg" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-accent2 transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          {t("ui.checklist.hideDone")}
        </label>
      </section>

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
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-line bg-bg text-sm font-black" aria-hidden="true">
                        {done ? "✓" : ""}
                      </span>
                      <span className={`flex-1 text-left ${done ? "line-through" : ""}`}>{t(checklistItemKey(item.id))}</span>
                    </button>
                    {item.linkedPinId && (
                      <Link href={`/map?pin=${item.linkedPinId}`} className="btn shrink-0">{t("ui.checklist.onMap")}</Link>
                    )}
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
