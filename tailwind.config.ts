import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-driven (see globals.css: dark default, "vice" alternative). RGB channels so /opacity works.
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        panel: "rgb(var(--panel-rgb) / <alpha-value>)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-solid": "var(--surface-solid)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        paper: "#F3E9DC",
        "paper-ink": "#1B1F27",
        // Signal colours, per theme (globals.css). RGB channels so opacity modifiers like bg-accent/20 work.
        accent: "rgb(var(--accent-rgb) / <alpha-value>)", // amber: selection, primary action, progress
        accent2: "rgb(var(--accent2-rgb) / <alpha-value>)", // mineral green: verified, done
        sun: "rgb(var(--sun-rgb) / <alpha-value>)", // copper: unverified, caution
        info: "rgb(var(--info-rgb) / <alpha-value>)", // cold glass blue: coordinates, data, links
        violet: "#8b5cf6",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', "system-ui", "sans-serif"],
        sans: ['"DM Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "Consolas", "monospace"],
      },
      // Square-cornered panels, like the in-game menu. rounded-full stays round (dots, avatars).
      borderRadius: {
        lg: "3px",
        xl: "3px",
        "2xl": "4px",
        "3xl": "6px",
      },
      boxShadow: {
        sticker: "0 18px 40px -18px var(--shadow)",
        "sticker-sm": "0 8px 20px -12px var(--shadow)",
        neon: "0 10px 28px -12px rgb(var(--accent-rgb) / 0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
