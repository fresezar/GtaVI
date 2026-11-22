"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SITE } from "@/config/site";
import { CATEGORIES } from "@/data/categories";
import { usePins } from "@/features/pins/pinData";
import { useProgress } from "@/hooks/useProgress";
import { localePath, tFor, type Locale } from "@/i18n";
import { computeProgress } from "@/lib/progress";

const STAR = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.9 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7z";

/** Our signature gauge: completion shown as wanted-level stars. Six stars = 100%. Links to the checklists. */
export function WantedStars({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  const { ready, progress } = useProgress(SITE.gameId);
  const { pins } = usePins();
  const pct = useMemo(() => computeProgress(pins, CATEGORIES, progress).percent, [pins, progress]);
  const lit = ready ? Math.min(6, Math.floor(pct / (100 / 6))) : 0;
  return (
    <Link
      href={localePath(locale, "/checklists")}
      className="flex items-center gap-2 px-1 py-1 text-ink transition hover:opacity-80"
      title={t("ui.stars.title", { percent: ready ? pct : 0 })}
      aria-label={t("ui.stars.title", { percent: ready ? pct : 0 })}
    >
      <span className="flex gap-[2px]" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" className="h-[15px] w-[15px] sm:h-[17px] sm:w-[17px]">
            <path d={STAR} fill={i < lit ? "#FF6A55" : "none"} stroke={i < lit ? "#FF6A55" : "currentColor"} strokeOpacity={i < lit ? 1 : 0.45} strokeWidth="1.6" />
          </svg>
        ))}
      </span>
      <span className="font-display text-[17px] tabular-nums sm:text-lg">%{ready ? pct : 0}</span>
    </Link>
  );
}

type Theme = "dark" | "vice";

/** Dark (default) or Vice. The choice is saved on this device; layout.tsx applies it before paint. */
export function ThemeToggle({ locale }: { locale: Locale }) {
  const t = tFor(locale);
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "vice" ? "vice" : "dark");
  }, []);
  const next: Theme = theme === "vice" ? "dark" : "vice";
  const flip = () => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
    setTheme(next);
  };
  return (
    <button
      type="button"
      onClick={flip}
      className="flex items-center gap-2 border border-line-strong px-2 py-1.5 font-display text-[13px] tracking-[0.14em] text-muted transition hover:text-ink"
      title={t(next === "vice" ? "ui.theme.toVice" : "ui.theme.toDark")}
      aria-label={t(next === "vice" ? "ui.theme.toVice" : "ui.theme.toDark")}
    >
      <span
        aria-hidden="true"
        className="h-3.5 w-3.5"
        style={{ background: next === "vice" ? "linear-gradient(135deg,#7a3a8c,#c06a95)" : "#0B1422", outline: "1px solid currentColor" }}
      />
      <span className="hidden sm:inline" lang={next === "vice" ? "en" : undefined}>{next === "vice" ? "Vice" : t("ui.theme.dark")}</span>
    </button>
  );
}
