/**
 * Understands source links (stream VODs, clips, posts) so pin pages can embed or link them.
 * Never re-host: embed via the platform's own player, or link out.
 */

export type SourceInfo =
  | { kind: "youtube"; videoId: string; start: number; url: string }
  | { kind: "twitch"; start: number; url: string }
  | { kind: "link"; host: string; url: string };

/** "1:02:33", "62:10", "3753", "1h2m33s" -> seconds. */
export function parseTimestamp(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = raw.trim();
  if (/^\d+$/.test(s)) return Number(s);
  const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (hms && (hms[1] || hms[2] || hms[3])) return Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0);
  const parts = s.split(":").map(Number);
  if (parts.length >= 2 && parts.length <= 3 && parts.every((n) => Number.isFinite(n) && n >= 0)) {
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  }
  return 0;
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function parseSource(url: string | undefined): SourceInfo | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1] ?? "";
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
      return { kind: "youtube", videoId: id, start: parseTimestamp(u.searchParams.get("t") ?? u.searchParams.get("start")), url };
    }
  }
  if (host === "twitch.tv" || host.endsWith(".twitch.tv")) {
    return { kind: "twitch", start: parseTimestamp(u.searchParams.get("t")), url };
  }
  return { kind: "link", host, url };
}

/** Puts a start time into a YouTube/Twitch URL (used by the importer). Other URLs are returned unchanged. */
export function withTimestamp(url: string, seconds: number): string {
  if (!seconds) return url;
  const info = parseSource(url);
  if (!info || info.kind === "link") return url;
  const u = new URL(url);
  if (info.kind === "youtube") u.searchParams.set("t", String(seconds));
  else {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    u.searchParams.set("t", `${h}h${m}m${seconds % 60}s`);
  }
  return u.toString();
}
