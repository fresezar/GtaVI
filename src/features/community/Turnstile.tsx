"use client";

import { useEffect, useRef } from "react";

/** Minimal typing for the Turnstile global (https://developers.cloudflare.com/turnstile/). */
interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    s.onerror = () => {
      loading = null;
      reject(new Error("turnstile blocked"));
    };
    document.head.append(s);
  });
  return loading;
}

/**
 * Cloudflare Turnstile widget (bot check). Loads Cloudflare's script only when rendered, i.e. only when
 * a site key is configured and the suggest form is open. Reports the token (or "" when it expires).
 */
export default function Turnstile({ siteKey, locale, onToken }: { siteKey: string; locale: string; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    let id: string | null = null;
    let alive = true;
    loadTurnstile()
      .then((ts) => {
        if (!alive || !box.current) return;
        id = ts.render(box.current, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          language: locale,
          callback: (token: string) => cb.current(token),
          "expired-callback": () => cb.current(""),
          "error-callback": () => cb.current(""),
        });
      })
      .catch(() => cb.current(""));
    return () => {
      alive = false;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [siteKey, locale]);

  return <div ref={box} className="min-h-[65px]" />;
}
