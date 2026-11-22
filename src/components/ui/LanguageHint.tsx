"use client";

import { useEffect, useState } from "react";

const KEY = "sixstar.langHint";
type Offer = "tr" | "es";

/** The offer is written in the reader's own language, since that is the language they prefer. */
const TEXT: Record<Offer, { has: string; go: string; close: string }> = {
  tr: { has: "Bu sayfanın Türkçesi var.", go: "Türkçe'ye geç", close: "Kapat" },
  es: { has: "Esta página está en español.", go: "Ver en español", close: "Cerrar" },
};

/**
 * English page, Turkish or Spanish browser: a slim bar offering that version. Dismissal is remembered in this
 * browser. Renders nothing for everyone else.
 */
export default function LanguageHint({ hrefs }: { hrefs: Record<Offer, string> }) {
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      /* storage blocked: still offer */
    }
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      if (/^tr\b/i.test(l)) return setOffer("tr");
      if (/^es\b/i.test(l)) return setOffer("es");
      if (/^en\b/i.test(l)) return; // English comes first for this reader: no offer
    }
  }, []);

  if (!offer) return null;
  const dismiss = () => {
    setOffer(null);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* not remembered */
    }
  };
  const text = TEXT[offer];
  return (
    <div lang={offer} className="flex items-center justify-center gap-3 border-t border-line bg-accent/15 px-4 py-1.5 text-xs">
      <span>{text.has}</span>
      <a href={hrefs[offer]} className="font-bold underline" onClick={dismiss}>
        {text.go}
      </a>
      <button type="button" onClick={dismiss} aria-label={text.close} className="px-1 text-base leading-none text-muted hover:text-ink">
        ×
      </button>
    </div>
  );
}
