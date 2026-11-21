"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __sixstarInstall?: InstallEvent;
  }
}

/**
 * "Put the map on your home screen". Chrome/Edge/Android: the saved beforeinstallprompt (layout INSTALL_INIT).
 * iPhone/iPad Safari has no prompt: a one-line how-to instead. Hidden when already running as an installed app.
 */
export default function InstallButton() {
  const t = useT();
  const [mode, setMode] = useState<"none" | "prompt" | "ios">("none");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;
    if (window.__sixstarInstall) setMode("prompt");
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setMode("ios");
    const on = () => setMode("prompt");
    window.addEventListener("sixstar:install", on);
    return () => window.removeEventListener("sixstar:install", on);
  }, []);

  if (mode === "none") return null;
  return (
    <section className="card-solid !p-3" aria-label={t("ui.install.title")}>
      <p className="text-sm font-bold">{t("ui.install.title")}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">{mode === "ios" ? t("ui.install.ios") : t("ui.install.body")}</p>
      {mode === "prompt" && (
        <button
          type="button"
          className="btn btn-primary mt-2 !min-h-[40px]"
          onClick={async () => {
            const e = window.__sixstarInstall;
            if (!e) return;
            await e.prompt();
            await e.userChoice.catch(() => undefined);
            window.__sixstarInstall = undefined;
            setMode("none");
          }}
        >
          {t("ui.install.cta")}
        </button>
      )}
    </section>
  );
}
