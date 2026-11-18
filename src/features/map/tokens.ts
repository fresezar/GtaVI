import type { ColorToken } from "@/domain";

/** Same in light and dark so pins keep their meaning across themes. */
export const CATEGORY_COLORS: Record<ColorToken, string> = {
  coral: "#FF6A55",
  orchid: "#C45AB3",
  sky: "#4A9DFF",
  sun: "#FFC857",
  lime: "#8BC34A",
  rose: "#FF7EB6",
  turquoise: "#19B5A5",
  plum: "#7B4B94",
  rust: "#B5532A",
  mint: "#7FD8BE",
  peach: "#FFA45B",
  slate: "#7A8CA0",
  indigo: "#6C7BFF",
  ice: "#A8E6FF",
  green: "#2FD27A",
  crimson: "#D7263D",
  magenta: "#E040FB",
  navy: "#3A5BA0",
  sand: "#D9C3A0",
  gold: "#D4AF37",
  jade: "#00A86B",
  cobalt: "#2F6BFF",
  lilac: "#B39DDB",
  copper: "#C9773B",
};

/** Light outline reads on both dark night tiles and bright community map art. */
export const PIN_OUTLINE = "#FFF4EC";
