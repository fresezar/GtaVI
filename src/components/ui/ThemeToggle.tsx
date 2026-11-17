"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("atlas:theme", next);
    } catch {
      /* ignore: theme just won't persist */
    }
  };

  return (
    <button type="button" className="btn btn-icon" onClick={flip} aria-label={t("ui.theme.toggle")} title={t("ui.theme.toggle")}>
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
