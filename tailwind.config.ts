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
        // Hex (not var) so Tailwind opacity modifiers like bg-accent/20 work.
        accent: "#FF6A55",
        accent2: "#2EE6D0",
        sun: "#FFC857",
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
        neon: "0 10px 26px -10px rgba(255,106,85,0.65)",
      },
    },
  },
  plugins: [],
};
export default config;
