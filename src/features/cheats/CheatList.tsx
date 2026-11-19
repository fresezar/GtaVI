"use client";

import { useEffect, useMemo, useState } from "react";
import { CHEATS, CHEAT_KINDS, type CheatKind, type Dir } from "@/data/cheats";
import { SITE } from "@/config/site";
import { useLocale, useT } from "@/i18n/client";
import { copyText } from "@/lib/clipboard";

type Platform = "ps5" | "xbox";
const PLATFORM_KEY = "sixstar.cheats.platform";
const BUTTONS: Record<Platform, { hold: string; press: string; label: string }> = {
  ps5: { hold: "L1", press: "R1", label: "PS5" },
  xbox: { hold: "LB", press: "RB", label: "Xbox" },
};
/** Arrow drawn inside a D-pad key. */
const ROTATE: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };

function Key({ dir, label }: { dir: Dir; label: string }) {
  return (
    <kbd title={label} className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-line-strong bg-surface-2 text-ink">
      <svg viewBox="0 0 24 24" width="14" height="14" style={{ transform: `rotate(${ROTATE[dir]}deg)` }} aria-hidden="true">
        <path d="M12 4l7 9h-4.5v7h-5v-7H5z" fill="currentColor" />
      </svg>
    </kbd>
  );
}

/** Cheat list with console switch, search, kind filter and copy. Platform choice is remembered in this browser. */
export default function CheatList() {
  const t = useT();
  const locale = useLocale();
  const lang = locale === "tr" ? "tr" : "en";
  const [platform, setPlatform] = useState<Platform>("ps5");
  const [kind, setKind] = useState<CheatKind | "all">("all");
  const [query, setQuery] = useState("");
  const [knownOnly, setKnownOnly] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLATFORM_KEY);
      if (saved === "ps5" || saved === "xbox") setPlatform(saved);
    } catch {
      /* storage blocked */
    }
  }, []);
  const pick = (p: Platform) => {
    setPlatform(p);
    try {
      localStorage.setItem(PLATFORM_KEY, p);
    } catch {
      /* not remembered */
    }
  };

  const dirName = (d: Dir) => t(`ui.cheats.dir.${d}`);
  const q = query.trim().toLocaleLowerCase(locale);
  const list = useMemo(
    () =>
      CHEATS.filter(
        (c) =>
          (kind === "all" || c.kind === kind) &&
          (!knownOnly || c.code) &&
          (!q || `${c.name} ${c.effect[lang]} ${c.unlock?.[lang] ?? ""}`.toLocaleLowerCase(locale).includes(q)),
      ),
    [kind, knownOnly, q, lang, locale],
  );
  const b = BUTTONS[platform];

  const copy = async (id: string, name: string, code: Dir[]) => {
    const ok = await copyText(`${name} (${b.label}): ${code.map(dirName).join(" ")}`);
    if (ok !== false) {
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? "" : c)), 1600);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <aside className="lg:order-2">
        <section className="card !p-5 lg:sticky lg:top-28" aria-labelledby="how-title">
          <h2 id="how-title" className="section-title">{t("ui.cheats.how.title")}</h2>
          <div className="mt-3 flex gap-1" role="group" aria-label={t("ui.cheats.platform")}>
            {(["ps5", "xbox"] as const).map((p) => (
              <button key={p} type="button" className="tab" aria-pressed={platform === p} onClick={() => pick(p)}>
                {BUTTONS[p].label}
              </button>
            ))}
          </div>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">
            {[
              t("ui.cheats.how.1"),
              t("ui.cheats.how.2"),
              t("ui.cheats.how.3", { trophies: t(`ui.cheats.trophies.${platform}`) }),
              t("ui.cheats.how.4", { hold: b.hold, press: b.press }),
            ].map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="file-no pt-0.5 text-accent">0{i + 1}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted">{t("ui.cheats.storyOnly")}</p>
        </section>
      </aside>

      <section className="lg:order-1" aria-label={t("ui.cheats.title")}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ui.cheats.search")}
            aria-label={t("ui.cheats.search")}
            className="min-h-[40px] w-full flex-1 border border-line-strong bg-panel/70 px-3 text-sm sm:w-auto"
          />
          <label className="flex min-h-[40px] items-center gap-2 text-sm">
            <input type="checkbox" checked={knownOnly} onChange={(e) => setKnownOnly(e.target.checked)} />
            {t("ui.cheats.knownOnly")}
          </label>
        </div>
        <div className="no-scrollbar mt-3 flex gap-1 overflow-x-auto" role="group" aria-label={t("ui.cheats.kindLabel")}>
          {(["all", ...CHEAT_KINDS] as const).map((k) => (
            <button key={k} type="button" className="tab shrink-0" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {t(`ui.cheats.kind.${k}`)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted" aria-live="polite">{t("ui.cheats.count", { count: list.length })}</p>

        {list.length === 0 ? (
          <p className="card mt-3 text-sm text-muted">{t("ui.cheats.empty")}</p>
        ) : (
          <ul className="glass mt-3 divide-y divide-line">
            {list.map((c) => (
              <li key={c.id} id={c.slug} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl leading-tight normal-case" lang="en">{c.name}</h3>
                  <p className="mt-0.5 text-sm text-muted">{c.effect[lang]}</p>
                  <p className="mt-1 text-xs">
                    <span className="font-bold">{t("ui.cheats.unlock")}:</span> {c.unlock ? c.unlock[lang] : t("ui.cheats.afterStory")}
                  </p>
                </div>
                {c.code ? (
                  <div className="flex flex-wrap items-center gap-2 sm:max-w-[60%] sm:justify-end">
                    <span className="flex flex-wrap gap-1" role="img" aria-label={`${b.label}: ${c.code.map(dirName).join(", ")}`}>
                      {c.code.map((d, i) => (
                        <Key key={i} dir={d} label={dirName(d)} />
                      ))}
                    </span>
                    <button type="button" className="btn !min-h-[32px] !px-3 !py-1 text-xs" onClick={() => void copy(c.id, c.name, c.code!)}>
                      {copied === c.id ? t("ui.cheats.copied") : t("ui.cheats.copy")}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted sm:text-right">
                    {t("ui.cheats.noCode")}
                    {SITE.links.discord && (
                      <>
                        {" · "}
                        <a href={SITE.links.discord} target="_blank" rel="noopener" className="font-bold underline">{t("ui.cheats.sendCode")}</a>
                      </>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
