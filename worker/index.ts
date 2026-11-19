/**
 * Six Star API (community phase 1). Only /api/* reaches this script (wrangler.jsonc run_worker_first);
 * every other request is served straight from the static export by the assets layer.
 *
 *   POST /api/suggest                 public: send a pin suggestion (no account)
 *   GET  /api/community/pins          public: approved suggestions not yet baked into the site
 *   GET  /api/admin/queue?status=     moderator: list suggestions
 *   POST /api/admin/review            moderator: approve / reject (optionally edit title, category, name)
 *   POST /api/admin/published         moderator: mark approved rows as copied into content/pins.json
 *   POST /api/ref/visit               public: count a unique daily visit to a partner page (/p/<slug>)
 *   GET  /api/admin/partners          moderator: visits and suggestions per partner
 *
 * Moderator auth: "Authorization: Bearer <ADMIN_TOKEN>" (wrangler secret). Spam guards: honeypot field,
 * per-IP rate limit (salted daily hash, the IP itself is never stored), optional Turnstile.
 */
import categories from "../content/categories.json";
import partners from "../content/partners.json";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_TOKEN: string;
  IP_SALT: string;
  /** Optional: set it (wrangler secret) and the site's NEXT_PUBLIC_TURNSTILE_SITE_KEY to require Turnstile. */
  TURNSTILE_SECRET?: string;
}

const CATEGORY_IDS = new Set((categories as { id: string }[]).map((c) => c.id));
const PARTNER_SLUGS = new Set((partners as { slug: string }[]).map((p) => p.slug));
const partnerRef = (v: unknown) => {
  const slug = clean(v, 40);
  return PARTNER_SLUGS.has(slug) ? slug : null;
};
/** Land area of the main map, in pin frame coordinates (src/data/maps.ts `view`). */
const VIEW = { x: [17 / 128, 84 / 128], y: [17 / 128, 104 / 128] } as const;
const RATE_PER_HOUR = 8;
const MAX_BODY = 8 * 1024;

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
const fail = (status: number, error: string) => json({ ok: false, error }, status);

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(now = Date.now()): string {
  let time = "";
  let n = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[n % 32] + time;
    n = Math.floor(n / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return time + Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
}

const clientIp = (req: Request) => req.headers.get("cf-connecting-ip") ?? "0.0.0.0";
const dailyIpHash = (env: Env, ip: string, now: Date) => sha256(`${env.IP_SALT}|${ip}|${now.toISOString().slice(0, 10)}`);

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isAdmin(req: Request, env: Env): boolean {
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const want = env.ADMIN_TOKEN ?? "";
  if (!want || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return null;
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function suggest(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  if (!body) return fail(400, "bad_request");
  // Honeypot: a field people never see. Bots fill it; pretend success so they don't adapt.
  if (clean(body.website, 200)) return json({ ok: true });

  const categoryId = clean(body.categoryId, 64);
  const title = clean(body.title, 80);
  const proofUrl = clean(body.proofUrl, 500);
  const note = clean(body.note, 500);
  const name = clean(body.name, 40);
  const locale = body.locale === "tr" ? "tr" : "en";
  const ref = partnerRef(body.ref);
  const x = Number(body.x);
  const y = Number(body.y);

  if (!CATEGORY_IDS.has(categoryId)) return fail(400, "category");
  if (title.length < 3) return fail(400, "title");
  if (!isHttpUrl(proofUrl)) return fail(400, "proof");
  if (!(x >= VIEW.x[0] && x <= VIEW.x[1] && y >= VIEW.y[0] && y <= VIEW.y[1])) return fail(400, "position");

  const ip = clientIp(req);
  if (env.TURNSTILE_SECRET) {
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", clean(body.turnstile, 4096));
    form.append("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const v = (await r.json()) as { success?: boolean };
    if (!v.success) return fail(403, "captcha");
  }

  const now = new Date();
  const ipHash = await dailyIpHash(env, ip, now);
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM suggestions WHERE ip_hash = ? AND created_at > ?").bind(ipHash, hourAgo).first<{ n: number }>();
  if ((recent?.n ?? 0) >= RATE_PER_HOUR) return fail(429, "rate_limited");

  const id = `sug_${ulid(now.getTime())}`;
  await env.DB.prepare(
    "INSERT INTO suggestions (id, created_at, category_id, title, x, y, proof_url, note, name, locale, ip_hash, ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(id, now.toISOString(), categoryId, title, x, y, proofUrl, note || null, name || null, locale, ipHash, ref)
    .run();
  return json({ ok: true, id }, 201);
}

interface Row {
  id: string;
  created_at: string;
  status: string;
  category_id: string;
  title: string;
  x: number;
  y: number;
  proof_url: string;
  note: string | null;
  name: string | null;
  locale: string;
  pin_id: string | null;
  reviewed_at: string | null;
  reason: string | null;
  ref: string | null;
}

async function communityPins(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT pin_id, category_id, title, x, y, proof_url, name, reviewed_at, ref FROM suggestions WHERE status = 'approved' ORDER BY reviewed_at DESC LIMIT 500",
  ).all<Row>();
  const pins = results.map((r) => ({
    id: r.pin_id,
    categoryId: r.category_id,
    title: r.title,
    coord: [r.x, r.y],
    proofUrl: r.proof_url,
    name: r.name,
    approvedAt: r.reviewed_at,
    via: r.ref,
  }));
  return json({ pins }, 200, { "cache-control": "public, max-age=60" });
}

async function queue(url: URL, env: Env): Promise<Response> {
  const status = url.searchParams.get("status") ?? "pending";
  if (!["pending", "approved", "rejected", "published"].includes(status)) return fail(400, "status");
  const { results } = await env.DB.prepare(
    "SELECT id, created_at, status, category_id, title, x, y, proof_url, note, name, locale, pin_id, reviewed_at, reason, ref FROM suggestions WHERE status = ? ORDER BY created_at ASC LIMIT 200",
  )
    .bind(status)
    .all<Row>();
  const counts = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM suggestions GROUP BY status").all<{ status: string; n: number }>();
  return json({ items: results, counts: Object.fromEntries(counts.results.map((c) => [c.status, c.n])) });
}

async function review(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  if (!body) return fail(400, "bad_request");
  const id = clean(body.id, 40);
  const action = body.action;
  const row = await env.DB.prepare("SELECT * FROM suggestions WHERE id = ?").bind(id).first<Row>();
  if (!row) return fail(404, "not_found");
  const now = new Date().toISOString();

  if (action === "reject") {
    await env.DB.prepare("UPDATE suggestions SET status = 'rejected', reviewed_at = ?, reason = ? WHERE id = ?")
      .bind(now, clean(body.reason, 200) || null, id)
      .run();
    return json({ ok: true });
  }
  if (action !== "approve") return fail(400, "action");

  const title = clean(body.title, 80) || row.title;
  const categoryId = clean(body.categoryId, 64) || row.category_id;
  if (!CATEGORY_IDS.has(categoryId)) return fail(400, "category");
  const name = body.name === undefined ? row.name : clean(body.name, 40) || null;
  const pinId = row.pin_id ?? `pin_${ulid()}`;
  await env.DB.prepare("UPDATE suggestions SET status = 'approved', reviewed_at = ?, title = ?, category_id = ?, name = ?, pin_id = ?, reason = NULL WHERE id = ?")
    .bind(now, title, categoryId, name, pinId, id)
    .run();
  return json({ ok: true, pinId });
}

async function markPublished(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).map((v) => clean(v, 40)).filter(Boolean).slice(0, 500) : [];
  if (!ids.length) return fail(400, "ids");
  const stmt = env.DB.prepare("UPDATE suggestions SET status = 'published' WHERE id = ? AND status = 'approved'");
  await env.DB.batch(ids.map((id) => stmt.bind(id)));
  return json({ ok: true, count: ids.length });
}

async function refVisit(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  const slug = partnerRef(body?.slug);
  if (!slug) return fail(400, "slug");
  const now = new Date();
  const ipHash = await dailyIpHash(env, clientIp(req), now);
  await env.DB.prepare("INSERT OR IGNORE INTO partner_visits (slug, day, ip_hash) VALUES (?, ?, ?)").bind(slug, now.toISOString().slice(0, 10), ipHash).run();
  return json({ ok: true });
}

/** Per partner: unique daily visits (all time, last 30 days) and suggestions by status. */
async function partnerStats(env: Env): Promise<Response> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [visits, recent, sugg] = await env.DB.batch([
    env.DB.prepare("SELECT slug, COUNT(*) AS n FROM partner_visits GROUP BY slug"),
    env.DB.prepare("SELECT slug, COUNT(*) AS n FROM partner_visits WHERE day >= ? GROUP BY slug").bind(since),
    env.DB.prepare("SELECT ref AS slug, status, COUNT(*) AS n FROM suggestions WHERE ref IS NOT NULL GROUP BY ref, status"),
  ]);
  const out: Record<string, { visits: number; visits30: number; suggestions: Record<string, number> }> = {};
  const row = (slug: string) => (out[slug] ??= { visits: 0, visits30: 0, suggestions: {} });
  for (const slug of PARTNER_SLUGS) row(slug);
  for (const r of visits.results as { slug: string; n: number }[]) row(r.slug).visits = r.n;
  for (const r of recent.results as { slug: string; n: number }[]) row(r.slug).visits30 = r.n;
  for (const r of sugg.results as { slug: string; status: string; n: number }[]) row(r.slug).suggestions[r.status] = r.n;
  return json({ partners: out });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");
    try {
      if (path === "/api/suggest" && req.method === "POST") return await suggest(req, env);
      if (path === "/api/community/pins" && req.method === "GET") return await communityPins(env);
      if (path === "/api/ref/visit" && req.method === "POST") return await refVisit(req, env);
      if (path.startsWith("/api/admin/")) {
        if (!isAdmin(req, env)) return fail(401, "unauthorized");
        if (path === "/api/admin/queue" && req.method === "GET") return await queue(url, env);
        if (path === "/api/admin/review" && req.method === "POST") return await review(req, env);
        if (path === "/api/admin/published" && req.method === "POST") return await markPublished(req, env);
        if (path === "/api/admin/partners" && req.method === "GET") return await partnerStats(env);
      }
      if (path.startsWith("/api/")) return fail(404, "not_found");
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e);
      return fail(500, "server_error");
    }
  },
} satisfies ExportedHandler<Env>;
