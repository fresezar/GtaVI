"use client";

import { useEffect, useState } from "react";
import type { Category, Pin } from "@/domain";
import { useHref, useT } from "@/i18n/client";
import { categoryKey, pinKey } from "@/i18n/keys";
import { copyText } from "@/lib/clipboard";
import { formatTimestamp, parseSource } from "@/lib/source";
import { CATEGORY_COLORS } from "./tokens";

interface Props {
  pin: Pin;
  category: Category | undefined;
  done: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * The player-facing pin view: opens on the map when a pin is tapped.
 * Desktop: floating card on the right. Phone: bottom sheet. The pin's own page stays for search and sharing.
 */
export default function PinCard({ pin, category, done, onToggle, onClose }: Props) {
  const t = useT();
  const href = useHref();
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => setPlaying(false), [pin.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = t(pinKey(pin.id, "title"));
  const descKey = pinKey(pin.id, "description");
  const desc = t(descKey);
  const description = desc !== descKey ? desc : "";
  const source = parseSource(pin.provenance?.sourceUrl);
  const image = pin.media?.find((m) => m.kind === "image" && /^https?:\/\//.test(m.url));
  const creditUrl = pin.credit?.url && /^https?:\/\//.test(pin.credit.url) ? pin.credit.url : undefined;
  const pageHref = href(`/pins/${pin.slug}`);
  const hint =
    pin.status === "unverified" ? t("ui.pin.status.unverifiedHint") : pin.status === "disputed" ? t("ui.pin.status.disputedHint") : "";

  const share = async () => {
    const url = `${window.location.origin}${href("/map")}?pin=${pin.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled: fall back to copy */
      }
    }
    setNote((await copyText(url)) ? t("ui.card.copied") : url);
    window.setTimeout(() => setNote(""), 2200);
  };

  return (
    <section
      aria-label={title}
      className="fixed inset-x-0 bottom-0 z-[1100] max-h-[52dvh] overflow-y-auto md:absolute md:z-[600] rounded-t-3xl border-t border-line-strong bg-[#1a1030]/95 p-4 shadow-sticker backdrop-blur-md md:inset-x-auto md:bottom-auto md:right-3 md:top-14 md:max-h-[calc(100%-4.5rem)] md:w-[380px] md:rounded-3xl md:border"
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong md:hidden" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <span className="chip" style={{ ["--dot" as string]: CATEGORY_COLORS[category.colorToken] }}>
              {t(categoryKey(category.id))}
            </span>
          )}
          <span className={`badge badge-${pin.status}`}>{t(`ui.pin.status.${pin.status}`)}</span>
        </div>
        <button type="button" onClick={onClose} className="btn btn-icon min-h-[36px] w-9 text-base" aria-label={t("ui.card.close")}>
          ×
        </button>
      </div>

      <h2 className="mt-3 font-display text-2xl leading-tight">{title}</h2>

      {/* Media: a YouTube thumbnail that turns into the player on tap (no third-party load until asked). */}
      {source?.kind === "youtube" && (
        <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-line-strong bg-black">
          {playing ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${source.videoId}?autoplay=1${source.start ? `&start=${source.start}` : ""}`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button type="button" onClick={() => setPlaying(true)} className="group relative block h-full w-full" aria-label={t("ui.card.play")}>
              <img src={`https://i.ytimg.com/vi/${source.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" loading="lazy" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-2xl text-white shadow-neon">▶</span>
              </span>
              {source.start > 0 && (
                <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-bold text-white">
                  {formatTimestamp(source.start)}
                </span>
              )}
            </button>
          )}
        </div>
      )}
      {source?.kind !== "youtube" && image && (
        <img src={image.url} alt={image.alt ?? ""} className="mt-3 w-full rounded-2xl border border-line-strong object-cover" loading="lazy" />
      )}

      {description && pin.spoilerLevel === "none" && <p className="mt-3 text-sm leading-relaxed">{description}</p>}
      {description && pin.spoilerLevel !== "none" && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-bold text-accent">{t("ui.pin.spoiler")}</summary>
          <p className="mt-2 leading-relaxed">{description}</p>
        </details>
      )}

      <div className="mt-3 space-y-1 text-xs text-muted">
        {pin.credit &&
          (creditUrl ? (
            <a href={creditUrl} target="_blank" rel="noopener" className="block font-bold text-ink underline">
              {t("ui.pin.foundBy", { name: pin.credit.name })}
            </a>
          ) : (
            <p className="font-bold text-ink">{t("ui.pin.foundBy", { name: pin.credit.name })}</p>
          ))}
        {source?.kind === "twitch" && (
          <a href={source.url} target="_blank" rel="noopener" className="block font-bold underline">
            {source.start ? t("ui.pin.watchAt", { platform: "Twitch", time: formatTimestamp(source.start) }) : t("ui.pin.watch", { platform: "Twitch" })}
          </a>
        )}
        {source?.kind === "link" && (
          <a href={source.url} target="_blank" rel="noopener ugc" className="block font-bold underline">
            {t("ui.pin.source")}: {source.host}
          </a>
        )}
      </div>

      {hint && <p className="mt-3 rounded-xl border border-dashed border-line-strong p-2 text-xs text-muted">{hint}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onToggle} className={`btn ${done ? "" : "btn-primary"}`} aria-pressed={done}>
          {done ? `✓ ${t("ui.pin.markUndone")}` : t("ui.pin.markDone")}
        </button>
        <button type="button" onClick={share} className="btn">{t("ui.card.share")}</button>
        <a href={pageHref} className="ml-auto text-xs font-bold text-accent2 underline">{t("ui.pin.openPage")} →</a>
      </div>
      <p className="mt-2 h-4 text-xs font-bold text-accent2" role="status" aria-live="polite">{note}</p>
    </section>
  );
}
