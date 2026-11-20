"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/domain";
import { useLocale, useT } from "@/i18n/client";
import { categoryKey } from "@/i18n/keys";
import { SITE } from "@/config/site";
import { PARTNER_BY_SLUG, currentRef } from "@/data/partners";
import Turnstile from "./Turnstile";
import { shrinkImage } from "./shrinkImage";

const NAME_KEY = "sixstar.suggest.name";
type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; code: string };

/**
 * "Suggest a pin" form, styled as a new case file. The spot comes from a tap on the map (coord).
 * Sends to /api/suggest; a moderator approves it and it goes live with the sender's name.
 */
export default function SuggestPanel({
  coord,
  categories,
  onClose,
  onSent,
}: {
  coord: readonly [number, number] | null;
  categories: readonly Category[];
  onClose: () => void;
  onSent: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const caps = (s: string) => s.toLocaleUpperCase(locale);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: hidden from people
  const [captcha, setCaptcha] = useState(""); // Turnstile token (only when SITE.turnstileSiteKey is set)
  const needsCaptcha = Boolean(SITE.turnstileSiteKey);
  const [attempt, setAttempt] = useState(0); // remounts the widget after a failed send (tokens are single-use)
  const [state, setState] = useState<State>({ kind: "idle" });
  // Screenshot proof (only when SITE.proofUploads): shrunk in the browser, sent with the form.
  const uploads = SITE.proofUploads;
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [ref, setRef] = useState(""); // partner page the visitor came from (/p/<slug>), if any
  const partner = PARTNER_BY_SLUG.get(ref);

  useEffect(() => {
    setRef(currentRef());
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* storage blocked: start empty */
    }
  }, []);

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);
  const pickImage = async (file: File | undefined) => {
    setImage(null);
    setPreview("");
    if (!file) return;
    setImageBusy(true);
    try {
      const small = await shrinkImage(file);
      setImage(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setState({ kind: "error", code: "image" });
    } finally {
      setImageBusy(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coord) return setState({ kind: "error", code: "position" });
    setState({ kind: "sending" });
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      /* not remembered */
    }
    if (!proofUrl.trim() && !image) return setState({ kind: "error", code: "proof" });
    try {
      const fields = { categoryId, title, proofUrl, note, name, website, locale, x: coord[0], y: coord[1], turnstile: captcha, ref };
      let init: RequestInit;
      if (image) {
        const form = new FormData();
        for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
        form.append("image", image, "proof.jpg");
        init = { method: "POST", body: form };
      } else {
        init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fields) };
      }
      const r = await fetch("/api/suggest", init);
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (r.ok && data.ok) {
        setState({ kind: "sent" });
        setTitle("");
        setProofUrl("");
        setNote("");
        setCaptcha("");
        setImage(null);
        setPreview("");
        onSent();
      } else {
        setCaptcha(""); // a token is single-use: the widget re-issues one
        setAttempt((a) => a + 1);
        setState({ kind: "error", code: data.error ?? "server_error" });
      }
    } catch {
      setState({ kind: "error", code: "network" });
    }
  };

  return (
    <section
      aria-label={t("ui.suggest.title")}
      className="fixed inset-x-0 bottom-0 z-[1100] max-h-[64dvh] overflow-y-auto border-t-[6px] border-accent bg-paper text-paper-ink shadow-sticker md:absolute md:inset-x-auto md:bottom-auto md:right-3 md:top-3 md:z-[600] md:max-h-[calc(100%-1.5rem)] md:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-dashed border-[#B9A993] px-4 py-2.5">
        <span className="file-no">
          <span lang="en">SIX STAR</span> · {caps(t("ui.suggest.newFile"))}
        </span>
        <button type="button" onClick={onClose} className="px-1 text-xl leading-none" aria-label={t("ui.card.close")}>
          ×
        </button>
      </div>

      {state.kind === "sent" ? (
        <div className="space-y-3 p-4">
          <span className="stamp text-[#0B7A55]">{t("ui.suggest.sentStamp")}</span>
          <h2 className="font-display text-[26px] leading-none">{t("ui.suggest.sentTitle")}</h2>
          <p className="text-sm leading-relaxed">{t("ui.suggest.sentBody")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className="btn-paper btn-paper-primary" onClick={() => setState({ kind: "idle" })}>
              {t("ui.suggest.another")}
            </button>
            <button type="button" className="btn-paper" onClick={onClose}>{t("ui.card.close")}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3 p-4">
          <h2 className="font-display text-[26px] leading-none">{t("ui.suggest.title")}</h2>
          <p className={`border p-2 text-xs ${coord ? "border-[#0B7A55] text-[#0B7A55]" : "border-dashed border-[#B76E00] text-[#8a5300]"}`}>
            {coord ? t("ui.suggest.spotSet") : t("ui.suggest.tapMap")}
          </p>

          <label className="block text-xs font-bold">
            {t("ui.suggest.category")}
            <select
              id="sg-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block min-h-[40px] w-full border border-[#B9A993] bg-white px-2 text-sm font-normal"
            >
              <option value="">{t("ui.suggest.pickCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{t(categoryKey(c.id))}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold">
            {t("ui.suggest.titleLabel")}
            <input
              id="sg-title"
              required
              minLength={3}
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("ui.suggest.titlePlaceholder")}
              className="mt-1 block min-h-[40px] w-full border border-[#B9A993] bg-white px-2 text-sm font-normal"
            />
          </label>

          {uploads && (
            <div className="text-xs font-bold">
              <label htmlFor="sg-image">{t("ui.suggest.screenshot")}</label>
              <input
                id="sg-image"
                type="file"
                accept="image/*"
                onChange={(e) => void pickImage(e.target.files?.[0])}
                className="mt-1 block w-full text-sm font-normal file:mr-3 file:border file:border-[#B9A993] file:bg-white file:px-3 file:py-2 file:font-bold"
              />
              {imageBusy && <span className="mt-1 block font-normal text-[#5a4f42]">{t("ui.suggest.imageWorking")}</span>}
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="mt-2 max-h-40 w-auto border border-[#B9A993]" />
              )}
              <span className="mt-1 block font-normal text-[#5a4f42]">{t("ui.suggest.screenshotHint")}</span>
            </div>
          )}

          <label className="block text-xs font-bold">
            {uploads ? t("ui.suggest.proofOptional") : t("ui.suggest.proof")}
            <input
              id="sg-proof"
              required={!uploads || !image}
              type="url"
              maxLength={500}
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://"
              className="mt-1 block min-h-[40px] w-full border border-[#B9A993] bg-white px-2 text-sm font-normal"
            />
            <span className="mt-1 block font-normal text-[#5a4f42]">{t("ui.suggest.proofHint")}</span>
          </label>

          <label className="block text-xs font-bold">
            {t("ui.suggest.note")}
            <textarea
              id="sg-note"
              maxLength={500}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("ui.suggest.notePlaceholder")}
              className="mt-1 block w-full border border-[#B9A993] bg-white px-2 py-1.5 text-sm font-normal"
            />
          </label>

          <label className="block text-xs font-bold">
            {t("ui.suggest.name")}
            <input
              id="sg-name"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="@"
              className="mt-1 block min-h-[40px] w-full border border-[#B9A993] bg-white px-2 text-sm font-normal"
            />
            <span className="mt-1 block font-normal text-[#5a4f42]">{t("ui.suggest.nameHint")}</span>
          </label>

          {/* Honeypot: off-screen, skipped by keyboard and screen readers. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          {partner && (
            <p className="text-xs text-[#5a4f42]">{t("ui.suggest.via", { name: partner.name })}</p>
          )}

          {needsCaptcha && <Turnstile key={attempt} siteKey={SITE.turnstileSiteKey} locale={locale} onToken={setCaptcha} />}

          {state.kind === "error" && (
            <p className="border border-[#B23A2A] p-2 text-xs text-[#B23A2A]" role="alert">
              {t(`ui.suggest.error.${["category", "title", "proof", "position", "rate_limited", "captcha", "image"].includes(state.code) ? state.code : "server"}`)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="submit" className="btn-paper btn-paper-primary" disabled={state.kind === "sending" || imageBusy || !coord || (needsCaptcha && !captcha)}>
              {state.kind === "sending" ? t("ui.suggest.sending") : t("ui.suggest.send")}
            </button>
            <button type="button" className="btn-paper" onClick={onClose}>{t("ui.suggest.cancel")}</button>
          </div>
          <p className="text-[11px] leading-snug text-[#5a4f42]">{t("ui.suggest.privacy")}</p>
        </form>
      )}
    </section>
  );
}
