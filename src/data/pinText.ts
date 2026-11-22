import pinTextEn from "@content/pin-text.en.json";
import pinTextTr from "@content/pin-text.tr.json";
import pinTextEs from "@content/pin-text.es.json";
import { PINS } from "@/data/pins";
import type { Locale } from "@/i18n/locale";
import { pinKey } from "@/i18n/keys";

type Dict = Record<string, string>;
const FILES: Record<Locale, Dict> = { en: pinTextEn as Dict, tr: pinTextTr as Dict, es: pinTextEs as Dict };

/**
 * Pin titles and descriptions for one language, English filling the gaps: { "<pin id>": [title, description?] }.
 * Served as /pin-data/text.<locale>.json; the browser adds them to its dictionary (registerText).
 */
export function pinTextFor(locale: Locale): Record<string, [string, string?]> {
  const own = FILES[locale];
  const en = FILES.en;
  const out: Record<string, [string, string?]> = {};
  for (const p of PINS) {
    const tk = pinKey(p.id, "title"), dk = pinKey(p.id, "description");
    const title = own[tk] ?? en[tk];
    if (!title) continue;
    const desc = own[dk] ?? en[dk];
    out[p.id] = desc ? [title, desc] : [title];
  }
  return out;
}
