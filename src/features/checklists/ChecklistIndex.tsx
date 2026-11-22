"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/useProgress";
import { SITE } from "@/config/site";
import { useHref } from "@/i18n/client";

/** A checklist as the index needs it: title and the progress refs of its items (all weight 1). */
export interface ChecklistCard {
  id: string;
  slug: string;
  title: string;
  refs: string[];
}

export default function ChecklistIndex({ lists }: { lists: ChecklistCard[] }) {
  const href = useHref();
  const { ready, progress } = useProgress(SITE.gameId);
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {lists.map((c) => {
        const done = c.refs.filter((r) => progress[r]?.done === true).length;
        const percent = ready && c.refs.length ? Math.floor((done / c.refs.length) * 100) : 0;
        return (
          <li key={c.id}>
            <Link href={href(`/checklists/${c.slug}`)} className="card block transition hover:-translate-y-0.5">
              <h2 className="font-display text-2xl leading-tight">{c.title}</h2>
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
