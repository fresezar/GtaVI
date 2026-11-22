// Shared helpers for content scripts. Plain Node (no deps) so they run anywhere, including CI.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT = join(ROOT, "content");
export const PATHS = {
  pins: join(CONTENT, "pins.json"),
  categories: join(CONTENT, "categories.json"),
  text: join(CONTENT, "text.en.json"),
  textTr: join(CONTENT, "text.tr.json"),
  textEs: join(CONTENT, "text.es.json"),
  /** Pin titles and descriptions live apart from the UI text so pages don't ship them to the browser. */
  pinText: join(CONTENT, "pin-text.en.json"),
  pinTextTr: join(CONTENT, "pin-text.tr.json"),
  pinTextEs: join(CONTENT, "pin-text.es.json"),
  timeline: join(CONTENT, "timeline.json"),
  news: join(CONTENT, "news.json"),
  missables: join(CONTENT, "missables.json"),
  guides: join(CONTENT, "guides.json"),
};

export const STATUSES = ["verified", "unverified", "disputed", "deprecated"];
export const SPOILERS = ["none", "mild", "major"];
export const CONFIDENCES = ["low", "medium", "high"];
export const SOURCES = ["stream", "community", "self", "datamine", "official"];
export const COLOR_TOKENS = [
  "coral", "orchid", "sky", "sun", "lime", "rose", "turquoise", "plum", "rust", "mint", "peach", "slate",
  "indigo", "ice", "green", "crimson", "magenta", "navy", "sand", "gold", "jade", "cobalt", "lilac", "copper", "salmon", "orange", "teal",
  "berry", "amber", "lavender", "olive", "aqua", "brick", "violet", "steel",
];
/** Frame coordinates may sit slightly outside 0..1 once a calibrated map is wider than the first one. */
export const COORD_MIN = -0.5;
export const COORD_MAX = 1.5;

export const readJson = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^﻿/, ""));
export const writeJson = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
export const today = () => new Date().toISOString().slice(0, 10);

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32, same as src/lib/ulid.ts
export function ulid(now = Date.now()) {
  let time = "";
  let n = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[n % 32] + time;
    n = Math.floor(n / 32);
  }
  const bytes = new Uint8Array(16);
  webcrypto.getRandomValues(bytes);
  let rand = "";
  for (const b of bytes) rand += ALPHABET[b % 32];
  return time + rand;
}

export function slugify(text) {
  return String(text)
    .replace(/[ıİ]/g, "i") // dotless i has no NFKD decomposition
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** RFC 4180 CSV (also TSV when pasted from a sheet). Handles quotes, escaped quotes and newlines in cells. */
export function parseDelimited(input) {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delim = (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? "\t" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ---- source links (mirror of src/lib/source.ts; keep in sync) ----
export function parseTimestamp(raw) {
  if (!raw) return 0;
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) return Number(s);
  const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (hms && (hms[1] || hms[2] || hms[3])) return Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0);
  const parts = s.split(":").map(Number);
  if (parts.length >= 2 && parts.length <= 3 && parts.every((n) => Number.isFinite(n) && n >= 0)) {
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  }
  return NaN;
}

export function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function hostOf(url) {
  return new URL(url).hostname.replace(/^www\.|^m\./, "");
}

export function withTimestamp(url, seconds) {
  if (!seconds) return url;
  const u = new URL(url);
  const host = hostOf(url);
  if (host === "youtube.com" || host === "youtu.be") u.searchParams.set("t", String(seconds));
  else if (host === "twitch.tv" || host.endsWith(".twitch.tv")) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    u.searchParams.set("t", `${h}h${m}m${seconds % 60}s`);
  }
  return u.toString();
}

/** Stream platforms -> "stream"; anything else with a URL -> "community". */
export function inferSource(url) {
  if (!url) return "self";
  const host = hostOf(url);
  return /(^|\.)(youtube\.com|youtu\.be|twitch\.tv|kick\.com)$/.test(host) ? "stream" : "community";
}
