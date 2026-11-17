import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        accent2: "var(--accent-2)",
        sun: "var(--sun)",
      },
      fontFamily: {
        display: ["Shrikhand", "Georgia", "serif"],
        sans: ['"DM Sans Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        sticker: "4px 4px 0 0 var(--shadow)",
        "sticker-sm": "2px 2px 0 0 var(--shadow)",
      },
    },
  },
  plugins: [],
};
export default config;
