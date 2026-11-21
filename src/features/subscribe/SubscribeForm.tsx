"use client";

import { useState } from "react";
import { SITE } from "@/config/site";
import Turnstile from "@/features/community/Turnstile";
import { useLocale, useT } from "@/i18n/client";

export type Topic = "online" | "weekly";
type State = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; code: string };
const ERRORS = ["email", "topics", "captcha", "rate_limited"];

/**
 * E-mail sign-up: "tell me when GTA 6 Online launches" and/or the weekly digest. Posts to /api/subscribe.
 * The bot check (Turnstile) loads only once someone starts typing, so pages carry no extra script until then.
 */
export default function SubscribeForm({
  topics = ["online"],
  source,
  compact = false,
}: {
  topics?: Topic[];
  /** Page the form sits on (stored with the sign-up). */
  source: string;
  compact?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<Set<Topic>>(new Set(topics));
  const [website, setWebsite] = useState(""); // honeypot
  const [engaged, setEngaged] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ kind: "idle" });
  const needsCaptcha = Boolean(SITE.turnstileSiteKey);

  const toggle = (topic: Topic) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked.size) return setState({ kind: "error", code: "topics" });
    setState({ kind: "sending" });
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, topics: [...picked], locale, source, website, turnstile: captcha }),
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (r.ok && data.ok) return setState({ kind: "done" });
      setCaptcha("");
      setAttempt((a) => a + 1);
      setState({ kind: "error", code: data.error ?? "server" });
    } catch {
      setState({ kind: "error", code: "server" });
    }
  };

  if (state.kind === "done") {
    return (
      <p className="border border-accent-2/60 bg-accent-2/10 p-3 text-sm" role="status">
        <b>{t("ui.subscribe.doneTitle")}</b> {t("ui.subscribe.doneBody")}
      </p>
    );
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <div className={`flex gap-2 ${compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row"}`}>
        <label className="sr-only" htmlFor={`sub-${source}`}>{t("ui.subscribe.email")}</label>
        <input
          id={`sub-${source}`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          value={email}
          onFocus={() => setEngaged(true)}
          onChange={(e) => {
            setEngaged(true);
            setEmail(e.target.value);
          }}
          placeholder={t("ui.subscribe.placeholder")}
          className="min-h-[44px] w-full flex-1 border border-line-strong bg-panel/70 px-3 text-sm"
        />
        <button
          type="submit"
          className="btn btn-primary min-h-[44px] shrink-0"
          disabled={state.kind === "sending" || (needsCaptcha && engaged && !captcha)}
        >
          {state.kind === "sending" ? t("ui.subscribe.sending") : t("ui.subscribe.cta")}
        </button>
      </div>

      {!compact && (
        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <legend className="sr-only">{t("ui.subscribe.topics")}</legend>
          {(["online", "weekly"] as const).map((topic) => (
            <label key={topic} className="flex items-center gap-2">
              <input type="checkbox" checked={picked.has(topic)} onChange={() => toggle(topic)} />
              {t(`ui.subscribe.topic.${topic}`)}
            </label>
          ))}
        </fieldset>
      )}

      {/* Honeypot: off-screen, skipped by keyboard and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {needsCaptcha && engaged && <Turnstile key={attempt} siteKey={SITE.turnstileSiteKey} locale={locale} onToken={setCaptcha} />}

      {state.kind === "error" && (
        <p className="text-xs font-bold text-accent" role="alert">
          {t(`ui.subscribe.error.${ERRORS.includes(state.code) ? state.code : "server"}`)}
        </p>
      )}
      <p className="text-[11px] leading-snug text-muted">{t("ui.subscribe.privacy")}</p>
    </form>
  );
}
