#!/usr/bin/env node
// Bake approved community suggestions into the static site (own page, search, sitemap), then mark them
// "published" so the live API stops serving them twice.
//   npm run import:community        then: npm run deploy
// Needs the moderator token: SIXSTAR_ADMIN_TOKEN in the environment or in .env.local (git-ignored).
// Idempotent: a suggestion whose pin id is already in content/pins.json is only marked published.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, readJson, ROOT, today, writeJson } from "./lib.mjs";

const API = process.env.SIXSTAR_API ?? "https://sixstargta.com";
const token = process.env.SIXSTAR_ADMIN_TOKEN ?? readEnvLocal("SIXSTAR_ADMIN_TOKEN");
if (!token) {
  console.error("No token: set SIXSTAR_ADMIN_TOKEN (environment or .env.local).");
  process.exit(1);
}

function readEnvLocal(key) {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return "";
  const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}

const auth = { authorization: `Bearer ${token}` };
const res = await fetch(`${API}/api/admin/queue?status=approved`, { headers: auth });
if (!res.ok) throw new Error(`queue: HTTP ${res.status}`);
const { items } = await res.json();
if (!items.length) {
  console.log("community: nothing approved waiting");
  process.exit(0);
}

const slugify = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ı/g, "i").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const pins = readJson(PATHS.pins);
const en = readJson(PATHS.text);
const ids = new Set(pins.map((p) => p.id));
const slugs = new Set(pins.map((p) => p.slug));
const done = [];
let added = 0;

for (const s of items) {
  if (!/^pin_[0-9A-HJKMNP-TV-Z]{26}$/.test(s.pin_id ?? "")) continue;
  if (!ids.has(s.pin_id)) {
    let slug = slugify(s.title) || s.pin_id.toLowerCase();
    if (slugs.has(slug)) slug = `${slug}-${s.pin_id.slice(-6).toLowerCase()}`;
    slugs.add(slug);
    pins.push({
      id: s.pin_id,
      slug,
      mapId: "map_main",
      categoryId: s.category_id,
      coord: [s.x, s.y],
      source: "community",
      ...(s.name ? { credit: { name: s.name } } : {}),
      status: "unverified",
      spoilerLevel: "none",
      provenance: { sourceUrl: s.proof_url, retrievedAt: today(), confidence: "medium", extractedBy: "human" },
      addedAt: (s.reviewed_at ?? new Date().toISOString()).slice(0, 10),
      dataVersion: 1,
      tags: [`suggestion:${s.id}`],
    });
    en[`pin.${s.pin_id}.title`] = s.title;
    if (s.note) en[`pin.${s.pin_id}.description`] = s.note;
    ids.add(s.pin_id);
    added++;
  }
  done.push(s.id);
}

writeJson(PATHS.pins, pins);
writeJson(PATHS.text, en);

const mark = await fetch(`${API}/api/admin/published`, {
  method: "POST",
  headers: { ...auth, "content-type": "application/json" },
  body: JSON.stringify({ ids: done }),
});
if (!mark.ok) throw new Error(`published: HTTP ${mark.status} (pins were written; run again after fixing)`);
console.log(`community: ${added} pins added, ${done.length} marked published. Next: npm run validate && npm run deploy`);
