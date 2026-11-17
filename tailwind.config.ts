import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-solid": "var(--surface-solid)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        // Hex (not var) so Tailwind opacity modifiers like bg-accent/20 work.
        accent: "#ff3d8b",
        accent2: "#2ee6d0",
        sun: "#ffb547",
        violet: "#8b5cf6",
      },
      fontFamily: {
        display: ["Shrikhand", "Georgia", "serif"],
        sans: ['"DM Sans Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        sticker: "0 18px 40px -18px var(--shadow)",
        "sticker-sm": "0 8px 20px -12px var(--shadow)",
        neon: "0 0 0 1px rgba(255,61,139,0.35), 0 10px 30px -8px rgba(255,61,139,0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
