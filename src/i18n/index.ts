import { en } from "./en";

export type Locale = "en";
const dictionaries: Record<Locale, Record<string, string>> = { en };

/** Falls back to English, then to the key itself (so gaps are visible, not blank). */
export function t(key: string, vars?: Record<string, string | number>, locale: Locale = "en"): string {
  const raw = dictionaries[locale][key] ?? en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
