/**
 * Six Star API (community phase 1). Only /api/* reaches this script (wrangler.jsonc run_worker_first);
 * every other request is served straight from the static export by the assets layer.
 *
 *   POST /api/suggest                 public: send a pin suggestion (no account); JSON, or multipart with an "image"
 *                                     screenshot when the PROOFS bucket is bound (stored until review, then deleted)
 *   GET  /api/community/pins          public: approved suggestions not yet baked into the site
 *   GET  /api/admin/queue?status=     moderator: list suggestions
 *   POST /api/admin/review            moderator: approve / reject (optionally edit title, category, name)
 *   POST /api/admin/published         moderator: mark approved rows as copied into content/pins.json
 *   POST /api/subscribe               public: join the e-mail list (topics: online, weekly)
 *   GET  /api/unsubscribe?t=          public: leave the list (link in every mail)
 *   GET  /api/admin/subscribers       moderator: counts per topic; ?format=csv for the active list
 *   POST /api/ref/visit               public: count a unique daily visit to a partner page (/p/<slug>)
 *   GET  /api/admin/partners          moderator: visits and suggestions per partner
 *   GET  /api/admin/proof?id=         moderator: the screenshot uploaded with a suggestion
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
  /** Optional R2 bucket for screenshot proofs (wrangler.jsonc r2_buckets). Without it, uploads are refused. */
  PROOFS?: R2Bucket;
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
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_UPLOAD = MAX_IMAGE + 16 * 1024;
/** Accepted screenshot formats, checked by their first bytes (not the browser's claim). */
function imageType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { mime: "image/webp", ext: "webp" };
  return null;
}

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

/** Turnstile siteverify; passes when no secret is configured. */
async function humanCheck(env: Env, token: unknown, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", clean(token, 4096));
  form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const v = (await r.json()) as { success?: boolean };
  return v.success === true;
}

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

/** Multipart suggestion: the same fields as the JSON body, plus an optional "image" file. */
async function readUpload(req: Request): Promise<{ body: Record<string, unknown>; image: File | null } | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD) return null;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return null;
  }
  const body: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") body[k] = v;
  const file = form.get("image");
  return { body, image: file && typeof file !== "string" && file.size > 0 ? file : null };
}

async function suggest(req: Request, env: Env): Promise<Response> {
  const multipart = (req.headers.get("content-type") ?? "").startsWith("multipart/form-data");
  const upload = multipart ? await readUpload(req) : null;
  if (multipart && !upload) return fail(400, "image");
  const body = upload ? upload.body : await readBody(req);
  if (!body) return fail(400, "bad_request");
  const image = upload?.image ?? null;
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
  if (proofUrl && !isHttpUrl(proofUrl)) return fail(400, "proof");
  if (!proofUrl && !image) return fail(400, "proof");
  let bytes: Uint8Array | null = null;
  let kind: { mime: string; ext: string } | null = null;
  if (image) {
    if (!env.PROOFS) return fail(400, "image");
    if (image.size > MAX_IMAGE) return fail(400, "image");
    bytes = new Uint8Array(await image.arrayBuffer());
    kind = imageType(bytes);
    if (!kind) return fail(400, "image");
  }
  if (!(x >= VIEW.x[0] && x <= VIEW.x[1] && y >= VIEW.y[0] && y <= VIEW.y[1])) return fail(400, "position");

  const ip = clientIp(req);
  if (!(await humanCheck(env, body.turnstile, ip))) return fail(403, "captcha");

  const now = new Date();
  const ipHash = await dailyIpHash(env, ip, now);
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM suggestions WHERE ip_hash = ? AND created_at > ?").bind(ipHash, hourAgo).first<{ n: number }>();
  if ((recent?.n ?? 0) >= RATE_PER_HOUR) return fail(429, "rate_limited");

  const id = `sug_${ulid(now.getTime())}`;
  let proofKey: string | null = null;
  if (bytes && kind && env.PROOFS) {
    proofKey = `proofs/${id}.${kind.ext}`;
    await env.PROOFS.put(proofKey, bytes, { httpMetadata: { contentType: kind.mime } });
  }
  await env.DB.prepare(
    "INSERT INTO suggestions (id, created_at, category_id, title, x, y, proof_url, note, name, locale, ip_hash, ref, proof_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(id, now.toISOString(), categoryId, title, x, y, proofUrl, note || null, name || null, locale, ipHash, ref, proofKey)
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
  proof_image: string | null;
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
    "SELECT id, created_at, status, category_id, title, x, y, proof_url, note, name, locale, pin_id, reviewed_at, reason, ref, proof_image FROM suggestions WHERE status = ? ORDER BY created_at ASC LIMIT 200",
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
  // A screenshot only lives until the decision (founder, 2026-11-20): delete it on approve and on reject.
  const dropProof = async () => {
    if (!row.proof_image) return;
    if (env.PROOFS) await env.PROOFS.delete(row.proof_image);
    await env.DB.prepare("UPDATE suggestions SET proof_image = NULL WHERE id = ?").bind(id).run();
  };

  if (action === "reject") {
    await env.DB.prepare("UPDATE suggestions SET status = 'rejected', reviewed_at = ?, reason = ? WHERE id = ?")
      .bind(now, clean(body.reason, 200) || null, id)
      .run();
    await dropProof();
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
  await dropProof();
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

const TOPICS = ["online", "weekly"] as const;
const SUBS_PER_HOUR = 5;
const EMAIL = /^[^\s@<>()",;:]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,24}$/;

async function subscribe(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  if (!body) return fail(400, "bad_request");
  if (clean(body.website, 200)) return json({ ok: true }); // honeypot
  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return fail(400, "email");
  const asked = Array.isArray(body.topics) ? body.topics.map((v) => clean(v, 20)) : [];
  const topics = TOPICS.filter((t) => asked.includes(t));
  if (!topics.length) return fail(400, "topics");
  const ip = clientIp(req);
  if (!(await humanCheck(env, body.turnstile, ip))) return fail(403, "captcha");

  const now = new Date();
  const ipHash = await dailyIpHash(env, ip, now);
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE ip_hash = ? AND created_at > ?").bind(ipHash, hourAgo).first<{ n: number }>();
  if ((recent?.n ?? 0) >= SUBS_PER_HOUR) return fail(429, "rate_limited");

  const old = await env.DB.prepare("SELECT topics FROM subscribers WHERE email = ?").bind(email).first<{ topics: string }>();
  const merged = [...new Set([...(old?.topics.split(",") ?? []), ...topics])].filter(Boolean).join(",");
  const locale = body.locale === "tr" ? "tr" : "en";
  const source = clean(body.source, 120) || null;
  if (old) {
    await env.DB.prepare("UPDATE subscribers SET topics = ?, locale = ?, unsubscribed_at = NULL WHERE email = ?").bind(merged, locale, email).run();
  } else {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("INSERT INTO subscribers (email, created_at, topics, locale, source, ip_hash, token) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(email, now.toISOString(), merged, locale, source, ipHash, token)
      .run();
  }
  // Same answer whether the address was new or known: the API never tells who is on the list.
  return json({ ok: true });
}

const UNSUB_PAGE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Six Star</title>' +
  '<body style="font-family:system-ui,sans-serif;background:#0B1422;color:#fff4ec;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center">' +
  '<div><h1 style="font-size:22px">You are off the list.</h1><p>Listeden çıktın. No more mails from Six Star.</p><p><a href="/" style="color:#FF6A55">sixstargta.com</a></p></div></body>';

async function unsubscribe(url: URL, env: Env): Promise<Response> {
  const token = clean(url.searchParams.get("t"), 64);
  if (/^[0-9a-f]{32}$/.test(token)) {
    await env.DB.prepare("UPDATE subscribers SET unsubscribed_at = ? WHERE token = ? AND unsubscribed_at IS NULL").bind(new Date().toISOString(), token).run();
  }
  return new Response(UNSUB_PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

interface SubRow {
  email: string;
  created_at: string;
  topics: string;
  locale: string;
  source: string | null;
}

async function subscribersAdmin(url: URL, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT email, created_at, topics, locale, source FROM subscribers WHERE unsubscribed_at IS NULL ORDER BY created_at",
  ).all<SubRow>();
  if (url.searchParams.get("format") === "csv") {
    const q = (v: string | null) => '"' + (v ?? "").replace(/"/g, '""') + '"';
    const lines = ["email,topics,locale,created_at,source", ...results.map((r) => [r.email, r.topics, r.locale, r.created_at, r.source].map(q).join(","))];
    return new Response(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": 'attachment; filename="sixstar-subscribers.csv"',
      },
    });
  }
  const count = (t: string) => results.filter((r) => r.topics.split(",").includes(t)).length;
  const gone = await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE unsubscribed_at IS NOT NULL").first<{ n: number }>();
  return json({
    active: results.length,
    online: count("online"),
    weekly: count("weekly"),
    tr: results.filter((r) => r.locale === "tr").length,
    unsubscribed: gone?.n ?? 0,
  });
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

async function proof(url: URL, env: Env): Promise<Response> {
  const id = clean(url.searchParams.get("id"), 40);
  const row = await env.DB.prepare("SELECT proof_image FROM suggestions WHERE id = ?").bind(id).first<{ proof_image: string | null }>();
  if (!row?.proof_image || !env.PROOFS) return fail(404, "not_found");
  const obj = await env.PROOFS.get(row.proof_image);
  if (!obj) return fail(404, "not_found");
  return new Response(obj.body, {
    headers: { "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");
    try {
      if (path === "/api/suggest" && req.method === "POST") return await suggest(req, env);
      if (path === "/api/community/pins" && req.method === "GET") return await communityPins(env);
      if (path === "/api/ref/visit" && req.method === "POST") return await refVisit(req, env);
      if (path === "/api/subscribe" && req.method === "POST") return await subscribe(req, env);
      if (path === "/api/unsubscribe" && req.method === "GET") return await unsubscribe(url, env);
      if (path.startsWith("/api/admin/")) {
        if (!isAdmin(req, env)) return fail(401, "unauthorized");
        if (path === "/api/admin/queue" && req.method === "GET") return await queue(url, env);
        if (path === "/api/admin/review" && req.method === "POST") return await review(req, env);
        if (path === "/api/admin/published" && req.method === "POST") return await markPublished(req, env);
        if (path === "/api/admin/partners" && req.method === "GET") return await partnerStats(env);
        if (path === "/api/admin/proof" && req.method === "GET") return await proof(url, env);
        if (path === "/api/admin/subscribers" && req.method === "GET") return await subscribersAdmin(url, env);
      }
      if (path.startsWith("/api/")) return fail(404, "not_found");
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e);
      return fail(500, "server_error");
    }
  },
} satisfies ExportedHandler<Env>;
