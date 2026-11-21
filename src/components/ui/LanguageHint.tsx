"use client";

import { useEffect, useState } from "react";

const KEY = "sixstar.langHint";

/**
 * English page, Turkish browser: a slim bar offering the Turkish version (always in Turkish, since the reader
 * prefers it). Dismissal is remembered in this browser. Renders nothing for everyone else.
 */
export default function LanguageHint({ trHref }: { trHref: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      /* storage blocked: still offer */
    }
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    if (langs.some((l) => /^tr\b/i.test(l))) setShow(true);
  }, []);

  if (!show) return null;
  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* not remembered */
    }
  };
  return (
    <div lang="tr" className="flex items-center justify-center gap-3 border-t border-line bg-accent/15 px-4 py-1.5 text-xs">
      <span>Bu sayfanın Türkçesi var.</span>
      <a href={trHref} className="font-bold underline" onClick={dismiss}>
        Türkçe&apos;ye geç
      </a>
      <button type="button" onClick={dismiss} aria-label="Kapat" className="px-1 text-base leading-none text-muted hover:text-ink">
        ×
      </button>
    </div>
  );
}
