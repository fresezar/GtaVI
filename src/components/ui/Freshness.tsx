"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/i18n/client";

/**
 * "Updated 3 hours ago" stamp: shows the page is looked after. `date` = ISO timestamp or YYYY-MM-DD
 * (day precision: today / yesterday / N days ago). `label` = an i18n key with {when}.
 * Relative text is computed in the browser (static pages would freeze it at build time).
 */
export default function Freshness({ date, label = "ui.fresh.updated", className = "" }: { date: string; label?: string; className?: string }) {
  const t = useT();
  const locale = useLocale();
  const [when, setWhen] = useState("");

  useEffect(() => {
    const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const then = new Date(dayOnly ? `${date}T00:00:00` : date).getTime();
    if (Number.isNaN(then)) return;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const update = () => {
      const sec = (Date.now() - then) / 1000;
      if (dayOnly) {
        const days = Math.max(0, Math.floor(sec / 86_400));
        setWhen(rtf.format(-days, "day"));
      } else if (sec < 3600) setWhen(rtf.format(-Math.max(1, Math.round(sec / 60)), "minute"));
      else if (sec < 86_400) setWhen(rtf.format(-Math.round(sec / 3600), "hour"));
      else setWhen(rtf.format(-Math.round(sec / 86_400), "day"));
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [date, locale]);

  if (!when) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="dot !h-2 !w-2 animate-pulse bg-accent-2" aria-hidden="true" />
      {t(label, { when })}
    </span>
  );
}
