"use client";

import { useEffect, useState } from "react";
import { LOCALE_TAG, tFor, type Locale } from "@/i18n";

/**
 * Header status line: a live dot, the pin count and how fresh the data is ("updated 2 h ago").
 * Values come from the build (server); only the relative time is computed here. Phones show the dot only.
 */
export default function SystemStatus({ pins, updated, locale }: { pins: number; updated: string; locale: Locale }) {
  // Locale comes as a prop: on the map page the header sits outside the page-level LocaleProvider.
  const t = tFor(locale);
  const [when, setWhen] = useState("");

  useEffect(() => {
    const then = new Date(/^\d{4}-\d{2}-\d{2}$/.test(updated) ? `${updated}T00:00:00` : updated).getTime();
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const tick = () => {
      const days = Math.floor((Date.now() - then) / 86_400_000);
      setWhen(rtf.format(-Math.max(0, days), "day"));
    };
    tick();
    const id = window.setInterval(tick, 3_600_000);
    return () => window.clearInterval(id);
  }, [updated, locale]);

  const count = pins.toLocaleString(LOCALE_TAG[locale]);
  return (
    <div
      className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted"
      title={when ? t("ui.status.updated", { when }) : undefined}
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="hidden text-ink/80 md:inline">{t("ui.status.live")}</span>
      <span className="hidden text-line-strong lg:inline" aria-hidden="true">/</span>
      <span className="hidden lg:inline">{t("ui.status.pins", { count })}</span>
      {when && (
        <>
          <span className="hidden text-line-strong xl:inline" aria-hidden="true">/</span>
          <span className="hidden xl:inline">{t("ui.status.updated", { when })}</span>
        </>
      )}
    </div>
  );
}
