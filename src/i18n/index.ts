import { DICTIONARIES } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./locale";

export type { Locale } from "./locale";
export { LOCALES, DEFAULT_LOCALE, LOCALE_TAG, localePath, alternates } from "./locale";

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Falls back to English, then to the key itself (so gaps are visible, not blank). */
export function t(key: string, vars?: Record<string, string | number>, locale: Locale = DEFAULT_LOCALE): string {
  const raw = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

/** Bound translator for one locale (server components). Client components use `useT()`. */
export const tFor =
  (locale: Locale): Translate =>
  (key, vars) =>
    t(key, vars, locale);

/** True when the key has real text in this locale or English (not just the key echoed back). */
export const hasText = (key: string, locale: Locale = DEFAULT_LOCALE) => t(key, undefined, locale) !== key;
