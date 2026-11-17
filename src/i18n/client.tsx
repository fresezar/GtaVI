"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { DEFAULT_LOCALE, LOCALE_TAG, localePath, tFor, type Locale, type Translate } from "./index";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/**
 * Wraps a page so client components know its language. Also sets <html lang>, because the
 * single root layout cannot know the locale of the route below it.
 */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = LOCALE_TAG[locale].slice(0, 2);
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => tFor(locale), [locale]);
}

/** Locale-aware internal link builder: href("/map") -> "/tr/map" on Turkish pages. */
export function useHref() {
  const locale = useLocale();
  return useMemo(() => (path: string) => localePath(locale, path), [locale]);
}
