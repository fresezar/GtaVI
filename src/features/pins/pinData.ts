"use client";

import { useEffect, useState } from "react";
import { registerText, type Locale } from "@/i18n";
import { pinKey } from "@/i18n/keys";
import { fromCompact, type ClientPin, type CompactPin } from "@/lib/pinIndex";

/**
 * Pins in the browser: one fetch of /pin-data/pins.json (built with the site, cached by the browser), shared
 * by every component on the page. Pin titles come from /pin-data/text.<locale>.json and go into the
 * dictionary, so t(pinKey(id, "title")) works as usual once they arrive.
 */
let pinsPromise: Promise<ClientPin[]> | null = null;
let pinsCache: ClientPin[] | null = null;
const textPromises = new Map<Locale, Promise<void>>();
const textReady = new Set<Locale>();

export function loadPins(): Promise<ClientPin[]> {
  pinsPromise ??= fetch("/pin-data/pins.json")
    .then((r) => (r.ok ? (r.json() as Promise<{ pins: CompactPin[] }>) : { pins: [] }))
    .then(({ pins }) => (pinsCache = pins.map(fromCompact)))
    .catch(() => {
      pinsPromise = null; // try again next time
      return [];
    });
  return pinsPromise;
}

export function loadPinText(locale: Locale): Promise<void> {
  let p = textPromises.get(locale);
  if (!p) {
    p = fetch(`/pin-data/text.${locale}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, [string, string?]>>) : ({} as Record<string, [string, string?]>)))
      .then((data) => {
        const entries: Record<string, string> = {};
        for (const [id, [title, desc]] of Object.entries(data)) {
          entries[pinKey(id as never, "title")] = title;
          if (desc) entries[pinKey(id as never, "description")] = desc;
        }
        registerText(entries, locale);
        textReady.add(locale);
      })
      .catch(() => {
        textPromises.delete(locale);
      });
    textPromises.set(locale, p);
  }
  return p;
}

/** All pins (non-deprecated). `ready` is false until the list has arrived. */
export function usePins(): { pins: readonly ClientPin[]; ready: boolean } {
  const [pins, setPins] = useState<ClientPin[] | null>(pinsCache);
  useEffect(() => {
    let alive = true;
    if (!pinsCache) void loadPins().then((p) => alive && setPins(p));
    return () => {
      alive = false;
    };
  }, []);
  return { pins: pins ?? [], ready: pins !== null };
}

/** True once this language's pin titles are in the dictionary (re-renders the caller when they land). */
export function usePinText(locale: Locale): boolean {
  const [ready, setReady] = useState(textReady.has(locale));
  useEffect(() => {
    let alive = true;
    if (!textReady.has(locale)) void loadPinText(locale).then(() => alive && setReady(true));
    else setReady(true);
    return () => {
      alive = false;
    };
  }, [locale]);
  return ready;
}
