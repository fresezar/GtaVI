"use client";

import { useEffect, useState } from "react";
import type { Category, Pin } from "@/domain";
import { fileNumber } from "@/data/pins";
import { partnerOf, partnerUrl } from "@/data/partners";
import { useHref, useLocale, useT } from "@/i18n/client";
import { categoryKey, pinKey } from "@/i18n/keys";
import { copyText } from "@/lib/clipboard";
import { formatTimestamp, parseSource } from "@/lib/source";
import Freshness from "@/components/ui/Freshness";
import { CATEGORY_COLORS } from "./tokens";

interface Props {
  pin: Pin;
  category: Category | undefined;
  done: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/** Stamp colour per status: ink on the cream case file. */
const STAMP: Record<Pin["status"], string> = {
  verified: "text-[#0B7A55]",
  unverified: "text-[#B76E00]",
  disputed: "text-[#B23A2A]",
  deprecated: "text-[#6B5E4D]",
};

/**
 * The player-facing pin view, styled as a numbered case file ("Six Star File #0142").
 * Desktop: floating card on the right. Phone: bottom sheet. The pin's own page stays for search and sharing.
 */
export default function PinCard({ pin, category, done, onToggle, onClose }: Props) {
  const t = useT();
  const locale = useLocale();
  const caps = (s: string) => s.toLocaleUpperCase(locale);
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
  const via = partnerOf(pin.tags);
  const viaUrl = via && partnerUrl(via);
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
      className="fixed inset-x-0 bottom-0 z-[1100] max-h-[56dvh] overflow-y-auto border-t-[6px] border-accent bg-paper text-paper-ink shadow-sticker md:absolute md:inset-x-auto md:bottom-auto md:right-3 md:top-3 md:z-[600] md:max-h-[calc(100%-1.5rem)] md:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-dashed border-[#B9A993] px-4 py-2.5">
        <span className="file-no">
          <span lang="en">SIX STAR</span> · {caps(t("ui.file.label"))} <b className="text-[#B23A2A]">#{fileNumber(pin.id)}</b>
        </span>
        <button type="button" onClick={onClose} className="px-1 text-xl leading-none" aria-label={t("ui.card.close")}>
          ×
        </button>
      </div>

      <div className="space-y-3 p-4">
        <span className={`stamp ${STAMP[pin.status]}`}>{done ? t("ui.pin.stamp.found") : t(`ui.pin.status.${pin.status}`)}</span>
        <h2 className="font-display text-[28px] normal-case leading-none">{title}</h2>
        <Freshness date={pin.updatedAt ?? pin.addedAt} label={pin.updatedAt ? "ui.fresh.updated" : "ui.fresh.added"} className="text-xs text-[#5a4f42]" />

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
          {pin.region && (
            <>
              <dt className="file-no pt-0.5 text-[#6B5E4D]">{caps(t("ui.pin.region"))}</dt>
              <dd>{pin.region}</dd>
            </>
          )}
          {category && (
            <>
              <dt className="file-no pt-0.5 text-[#6B5E4D]">{caps(t("ui.pin.category"))}</dt>
              <dd className="flex items-center gap-2">
                <span className="dot !h-2.5 !w-2.5" style={{ background: CATEGORY_COLORS[category.colorToken] }} />
                {t(categoryKey(category.id))}
              </dd>
            </>
          )}
          {pin.credit && (
            <>
              <dt className="file-no pt-0.5 text-[#6B5E4D]">{caps(t("ui.pin.foundByLabel"))}</dt>
              <dd>
                {creditUrl ? (
                  <a href={creditUrl} target="_blank" rel="noopener" className="font-bold underline">{pin.credit.name}</a>
                ) : (
                  <b>{pin.credit.name}</b>
                )}
              </dd>
            </>
          )}
          {via && (
            <>
              <dt className="file-no pt-0.5 text-[#6B5E4D]">{caps(t("ui.pin.viaLabel"))}</dt>
              <dd>
                {viaUrl ? (
                  <a href={viaUrl} target="_blank" rel="noopener" className="font-bold underline">{via.name}</a>
                ) : (
                  <b>{via.name}</b>
                )}
              </dd>
            </>
          )}
        </dl>

        {/* Media: a YouTube thumbnail that turns into the player on tap (no third-party load until asked). */}
        {source?.kind === "youtube" && (
          <div className="aspect-video overflow-hidden bg-black">
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
                <img src={`https://i.ytimg.com/vi/${source.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-85 transition group-hover:opacity-100" loading="lazy" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center bg-accent text-2xl text-white">▶</span>
                </span>
                {source.start > 0 && (
                  <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 text-xs font-bold text-white">{formatTimestamp(source.start)}</span>
                )}
              </button>
            )}
          </div>
        )}
        {source?.kind !== "youtube" && image && <img src={image.url} alt={image.alt ?? ""} className="w-full object-cover" loading="lazy" />}

        {description && pin.spoilerLevel === "none" && <p className="text-sm leading-relaxed">{description}</p>}
        {description && pin.spoilerLevel !== "none" && (
          <details className="text-sm">
            <summary className="cursor-pointer font-bold text-[#B23A2A]">{t("ui.pin.spoiler")}</summary>
            <p className="mt-2 leading-relaxed">{description}</p>
          </details>
        )}

        {source?.kind === "twitch" && (
          <a href={source.url} target="_blank" rel="noopener" className="block text-xs font-bold underline">
            {source.start ? t("ui.pin.watchAt", { platform: "Twitch", time: formatTimestamp(source.start) }) : t("ui.pin.watch", { platform: "Twitch" })}
          </a>
        )}
        {source?.kind === "link" && (
          <a href={source.url} target="_blank" rel="noopener ugc" className="block text-xs font-bold underline">
            {t("ui.pin.source")}: {source.host}
          </a>
        )}

        {hint && <p className="border border-dashed border-[#B9A993] p-2 text-xs text-[#5a4f42]">{hint}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" onClick={onToggle} className={`btn-paper ${done ? "" : "btn-paper-primary"}`} aria-pressed={done}>
            {done ? `✓ ${t("ui.pin.markUndone")}` : t("ui.pin.markDone")}
          </button>
          <button type="button" onClick={share} className="btn-paper">{t("ui.card.share")}</button>
          {/* Live community pins have no static page until they are baked into the site. */}
          {!pin.tags?.includes("live") && <a href={pageHref} className="ml-auto text-xs font-bold underline">{t("ui.pin.openPage")} →</a>}
        </div>
        <p className="h-4 text-xs font-bold" role="status" aria-live="polite">{note}</p>
      </div>
    </section>
  );
}
