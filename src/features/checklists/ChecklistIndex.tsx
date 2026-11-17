"use client";

import Link from "next/link";
import { CHECKLISTS } from "@/data/checklists";
import { useProgress } from "@/hooks/useProgress";
import { SITE } from "@/config/site";
import { t } from "@/i18n";
import { checklistKey } from "@/i18n/keys";
import { computeChecklistProgress } from "@/lib/progress";

export default function ChecklistIndex() {
  const { ready, progress } = useProgress(SITE.gameId);
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {CHECKLISTS.map((c) => {
        const s = computeChecklistProgress(c, progress);
        const percent = ready ? s.percent : 0;
        return (
          <li key={c.id}>
            <Link href={`/checklists/${c.slug}`} className="card block transition hover:-translate-y-0.5">
              <h2 className="font-display text-2xl leading-tight">{t(checklistKey(c.id))}</h2>
              <p className="mt-3 font-display text-4xl leading-none">{percent}%</p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-sun" style={{ width: `${percent}%` }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
