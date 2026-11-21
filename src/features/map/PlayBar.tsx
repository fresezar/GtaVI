"use client";

import { useEffect, useState } from "react";
import type { Category, CategoryId } from "@/domain";
import { useT } from "@/i18n/client";
import { categoryKey } from "@/i18n/keys";
import { CATEGORY_COLORS } from "./tokens";

type WakeLock = { release(): Promise<void> };
type WakeNavigator = Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLock> } };

/**
 * Play mode bar: the phone sits next to the TV. Big "next" button jumps to the next spot you have not found
 * in the chosen category (the pin card then offers "Mark as found"). Keeps the screen awake while open.
 */
export default function PlayBar({
  percent,
  categories,
  onNext,
  onExit,
}: {
  percent: number;
  /** Categories that still have unfound pins. */
  categories: readonly Category[];
  onNext: (id: CategoryId) => void;
  onExit: () => void;
}) {
  const t = useT();
  const [pick, setPick] = useState<CategoryId | "">(categories[0]?.id ?? "");
  const [awake, setAwake] = useState(false);
  const current = categories.find((c) => c.id === pick) ?? categories[0];

  // Screen wake lock (Chrome, Edge, Safari 16.4+). Released by the browser when the tab hides: ask again on return.
  useEffect(() => {
    const nav = navigator as WakeNavigator;
    if (!nav.wakeLock) return;
    let lock: WakeLock | null = null;
    let alive = true;
    const ask = () => {
      if (document.visibilityState !== "visible") return;
      nav.wakeLock!.request("screen").then(
        (l) => {
          if (!alive) return void l.release();
          lock = l;
          setAwake(true);
        },
        () => setAwake(false),
      );
    };
    ask();
    document.addEventListener("visibilitychange", ask);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", ask);
      void lock?.release();
    };
  }, []);

  return (
    <div className="glass absolute inset-x-2 bottom-7 z-[600] p-3 md:inset-x-auto md:left-1/2 md:w-[460px] md:-translate-x-1/2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-3xl leading-none tabular-nums">{percent}%</p>
        <p className="flex-1 text-[11px] leading-tight text-muted">{awake ? t("ui.play.awake") : t("ui.play.hint")}</p>
        <button type="button" className="btn !min-h-[40px]" onClick={onExit}>
          {t("ui.play.exit")}
        </button>
      </div>
      {current ? (
        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="play-category">{t("ui.play.category")}</label>
          <select
            id="play-category"
            value={current.id}
            onChange={(e) => setPick(e.target.value as CategoryId)}
            className="min-h-[52px] min-w-0 flex-1 border border-line-strong bg-panel px-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{t(categoryKey(c.id))}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary min-h-[52px] shrink-0 px-5 text-base"
            onClick={() => onNext(current.id)}
            style={{ boxShadow: `inset 0 -3px 0 ${CATEGORY_COLORS[current.colorToken]}` }}
          >
            {t("ui.play.next")} →
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm font-bold">{t("ui.play.allDone")}</p>
      )}
    </div>
  );
}
