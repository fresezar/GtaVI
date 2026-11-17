"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { useT } from "@/i18n/client";

type State = { kind: "before"; d: number; h: number; m: number; s: number } | { kind: "after"; day: number };

const DAY = 86_400_000;

/** Local midnight of launch day in the visitor's own timezone. */
function launchTime() {
  const { year, month, day } = SITE.launch;
  return new Date(year, month - 1, day).getTime();
}

function compute(now: number): State {
  const diff = launchTime() - now;
  if (diff <= 0) return { kind: "after", day: Math.floor(-diff / DAY) + 1 };
  const total = Math.floor(diff / 1000);
  return { kind: "before", d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

function Box({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[64px] rounded-2xl border border-line-strong bg-[#140c22]/80 px-3 py-2 text-center sm:min-w-[78px]">
      <div className="font-display text-3xl leading-none tabular-nums sm:text-4xl">{value}</div>
      <div className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-muted">{label}</div>
    </div>
  );
}

/** Before launch: a ticking countdown. After: "Day N". Renders "--" until mounted so SSR and client agree. */
export default function LaunchCountdown() {
  const t = useT();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const tick = () => setState(compute(Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (state?.kind === "after") {
    return (
      <div>
        <p className="neon font-display text-5xl leading-none sm:text-6xl">{t("ui.countdown.day", { n: state.day })}</p>
        <p className="mt-2 text-sm font-bold text-muted">{t("ui.countdown.since")}</p>
      </div>
    );
  }

  const pad = (n: number | undefined) => (n === undefined ? "--" : String(n).padStart(2, "0"));
  const s = state?.kind === "before" ? state : undefined;
  return (
    <div>
      <p className="eyebrow">{t("ui.countdown.label")}</p>
      <div className="mt-2 flex gap-2" role="timer" aria-live="off">
        <Box value={pad(s?.d)} label={t("ui.countdown.days")} />
        <Box value={pad(s?.h)} label={t("ui.countdown.hours")} />
        <Box value={pad(s?.m)} label={t("ui.countdown.minutes")} />
        <Box value={pad(s?.s)} label={t("ui.countdown.seconds")} />
      </div>
    </div>
  );
}
