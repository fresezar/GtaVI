#!/usr/bin/env node
// Bulk import: collectibles, activities and services from Open GTA 6 Map (fbritoferreira, CC BY 4.0).
//   npm run import:opengta6             uses the cached copy in .cache/opengta6 (downloads it the first time)
//   npm run import:opengta6 -- --update downloads the latest data and screenshots first
// Credit on every pin: "Open GTA 6 Map" -> https://github.com/fbritoferreira/gta6 (licence: CC BY 4.0).
// Idempotent: each pin carries an `og6:<id>` tag; re-running updates those pins in place.
// Place-like entries within 25 m of a pin we already have (e.g. GTADB shops) are skipped as duplicates.
// Screenshots are copied (resized WebP) to public/shots/og6/, never hot-linked.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ffmpeg from "ffmpeg-static";
import { PATHS, readJson, ROOT, slugify, today, ulid, writeJson } from "./lib.mjs";

const BASE = "https://fbritoferreira.github.io/gta6";
const CACHE = join(ROOT, ".cache", "opengta6");
const SHOTS = join(ROOT, "public", "shots", "og6");
const CREDIT = { name: "Open GTA 6 Map", url: "https://github.com/fbritoferreira/gta6" };
const update = process.argv.includes("--update");
mkdirSync(CACHE, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

async function cached(name) {
  const f = join(CACHE, name);
  if (update || !existsSync(f)) {
    const r = await fetch(`${BASE}/data/${name}`);
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    writeFileSync(f, await r.text());
  }
  return JSON.parse(readFileSync(f, "utf8"));
}

// Their kind -> our category. Kinds left out are not imported.
const CATEGORY = {
  card: "cat_collectible_cards",
  waink: "cat_waink_scans",
  magazine: "cat_magazines",
  meditation: "cat_meditation_spots",
  flamingo: "cat_cocaine_flamingos",
  underwater: "cat_underwater_discoveries",
  playlist: "cat_collectibles",
  treasure: "cat_collectibles",
  bottle: "cat_collectibles",
  bookswap: "cat_collectibles",
  kenton: "cat_collectibles",
  package: "cat_hidden_packages",
  meteorite: "cat_meteorites",
  streetart: "cat_street_art",
  mural: "cat_street_art",
  hoop: "cat_basketball_hoops",
  stunt: "cat_stunt_jumps",
  bridge: "cat_under_bridges",
  knife: "cat_knife_flights",
  basejump: "cat_base_jumps",
  race: "cat_races",
  drone: "cat_drone_trials",
  range: "cat_activities",
  arcade: "cat_activities",
  hunting: "cat_activities",
  payday: "cat_activities",
  bret: "cat_activities",
  fishing: "cat_fishing_spots",
  event: "cat_random_events",
  vehicle: "cat_rare_vehicles",
  weapon: "cat_weapon_pickups",
  gang: "cat_gang_operations",
  store: "cat_robbery_targets",
  bank: "cat_robbery_targets",
  smash: "cat_robbery_targets",
  safe: "cat_safes",
  towatm: "cat_atms",
  fence: "cat_shops",
  safehouse: "cat_safehouses",
  shop: "cat_shops",
  food: "cat_food",
  transport: "cat_transport",
  civic: "cat_civic",
  building: "cat_landmarks",
  other: "cat_landmarks",
};
const PLACE_KINDS = new Set(["shop", "food", "transport", "safehouse", "leisure", "building", "civic", "other", "fence", "store", "bank"]);
const categoryFor = (loc) => {
  if (loc.kind === "leisure") return /gym/i.test(loc.type ?? "") ? "cat_gyms" : "cat_activities";
  return CATEGORY[loc.kind];
};

// Generic English names -> Turkish / Spanish. Proper names stay as they are.
const PATTERNS = [
  [/^Hoop (\d+) - (.+)$/, "Pota $1 - $2", "Canasta $1 - $2"],
  [/^Meteorite Fragment$/i, "Göktaşı parçası", "Fragmento de meteorito"],
  [/^Towable ATM$/i, "Çekilebilir ATM", "Cajero remolcable"],
  [/^Under the Bridge: (.+)$/i, "Köprü altı: $1", "Bajo el puente: $1"],
  [/^(.+) Knife Flight$/i, "Bıçak uçuşu: $1", "Vuelo a cuchillo: $1"],
  [/^(.+) Base Jump$/i, "BASE atlayışı: $1", "Salto BASE: $1"],
  [/^(.+) Stunt Jump$/i, "Akrobatik atlayış: $1", "Salto acrobático: $1"],
  [/^Stunt Jump (.+)$/i, "Akrobatik atlayış: $1", "Salto acrobático: $1"],
  [/^Locked Safe - (.+)$/i, "Kilitli kasa - $1", "Caja fuerte cerrada - $1"],
  [/^Safe - (.+)$/i, "Kasa - $1", "Caja fuerte - $1"],
  [/^(.+) Meditation$/i, "Meditasyon: $1", "Meditación: $1"],
  [/^Hidden Package$/i, "Gizli paket", "Paquete oculto"],
  [/^Collectible card$/i, "Koleksiyon kartı", "Carta coleccionable"],
  [/^Weapon pickup$/i, "Silah", "Arma"],
];
function translate(name) {
  for (const [re, tr, es] of PATTERNS) if (re.test(name)) return [name.replace(re, tr), name.replace(re, es)];
  return [name, name];
}

const FRAME = 1024; // their map units: 0..1024 on the same 32768 m grid as ours
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const NEAR = 25 / 32768; // 25 m in frame units

const locations = await cached("locations.json");
const removed = new Set((await cached("removed.json")).map?.((r) => r.id) ?? []);

const pins = readJson(PATHS.pins);
const en = readJson(PATHS.pinText);
const tr = readJson(PATHS.pinTextTr);
const es = existsSync(PATHS.pinTextEs) ? readJson(PATHS.pinTextEs) : {};
const byTag = new Map();
for (const p of pins) for (const t of p.tags ?? []) if (t.startsWith("og6:")) byTag.set(t, p);
const others = pins.filter((p) => p.coord && !(p.tags ?? []).some((t) => t.startsWith("og6:")));
const slugs = new Set(pins.map((p) => p.slug));
const day = today();

/** GET with a timeout and up to 3 tries; null when the file cannot be fetched (the pin then has no image). */
async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      if (r.status === 404) return null;
    } catch {
      /* timeout or network: retry */
    }
    await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
  return null;
}

/** Shrink a screenshot to a 960 px WebP in public/shots/og6 (downloaded once into the cache). */
async function screenshot(loc) {
  if (!loc.screenshot) return null;
  const out = join(SHOTS, `${loc.id}.webp`);
  if (existsSync(out) && !update) return `/shots/og6/${loc.id}.webp`;
  const src = join(CACHE, "shots", loc.screenshot.split("/").pop());
  mkdirSync(join(CACHE, "shots"), { recursive: true });
  if (update || !existsSync(src)) {
    const buf = await download(`${BASE}/${loc.screenshot}`);
    if (!buf) return null;
    writeFileSync(src, buf);
  }
  const run = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", src, "-vf", "scale='min(960,iw)':-2", "-quality", "78", out]);
  return run.status === 0 ? `/shots/og6/${loc.id}.webp` : null;
}

// Screenshots first, six at a time (the main loop below then only reads the results).
const images = new Map();
{
  const queue = (await cached("locations.json")).filter((l) => l.screenshot);
  let next = 0, done = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (next < queue.length) {
        const loc = queue[next++];
        images.set(loc.id, await screenshot(loc));
        if (++done % 50 === 0) console.log(`screenshots: ${done}/${queue.length}`);
      }
    }),
  );
}

let added = 0, updated = 0, skippedDup = 0, skippedKind = 0, withPage = 0;
for (const loc of locations) {
  if (removed.has(loc.id)) continue;
  const categoryId = categoryFor(loc);
  if (!categoryId) {
    skippedKind++;
    continue;
  }
  const coord = [r6(loc.x / FRAME), r6(loc.y / FRAME)];
  const tag = `og6:${loc.id}`;
  let pin = byTag.get(tag);
  if (!pin && PLACE_KINDS.has(loc.kind) && others.some((o) => Math.hypot(o.coord[0] - coord[0], o.coord[1] - coord[1]) < NEAR)) {
    skippedDup++;
    continue;
  }
  const name = String(loc.name ?? loc.type ?? loc.id).trim();
  const desc = String(loc.description ?? "").trim();
  const image = images.get(loc.id) ?? null;
  // A pin gets its own page only with something to show: a screenshot or a real description.
  const page = Boolean(image) || desc.length >= 60;
  if (page) withPage++;
  const fields = {
    mapId: "map_main",
    categoryId,
    coord,
    source: "community",
    credit: CREDIT,
    ...(loc.area ? { region: loc.area } : {}),
    status: "unverified",
    spoilerLevel: "none",
    provenance: { sourceUrl: `${BASE}/?id=${encodeURIComponent(loc.id)}`, retrievedAt: day, confidence: "medium", extractedBy: "human" },
    ...(image ? { media: [{ kind: "image", url: image, alt: name }] } : {}),
    tags: [tag, loc.kind, ...(page ? [] : ["nopage"])],
  };
  if (pin) {
    const before = JSON.stringify(pin);
    const { media, ...rest } = fields;
    Object.assign(pin, rest);
    if (media) pin.media = media;
    else delete pin.media;
    if (JSON.stringify(pin) !== before) {
      pin.updatedAt = day;
      pin.dataVersion += 1;
      updated++;
    }
  } else {
    let slug = slugify(`${name} ${loc.area ?? ""}`) || slugify(loc.id);
    if (slugs.has(slug)) slug = `${slug}-${slugify(loc.id)}`;
    slugs.add(slug);
    pin = { id: `pin_${ulid()}`, slug, ...fields, addedAt: day, dataVersion: 1 };
    pins.push(pin);
    byTag.set(tag, pin);
    added++;
  }
  const [nameTr, nameEs] = translate(name);
  en[`pin.${pin.id}.title`] = name;
  if (desc) en[`pin.${pin.id}.description`] = desc;
  else delete en[`pin.${pin.id}.description`];
  if (nameTr !== name) tr[`pin.${pin.id}.title`] = nameTr;
  else delete tr[`pin.${pin.id}.title`];
  if (nameEs !== name) es[`pin.${pin.id}.title`] = nameEs;
  else delete es[`pin.${pin.id}.title`];
}

writeJson(PATHS.pins, pins);
writeJson(PATHS.pinText, en);
writeJson(PATHS.pinTextTr, tr);
writeJson(PATHS.pinTextEs, es);
console.log(
  `opengta6: ${added} added, ${updated} updated, ${skippedDup} duplicates of existing pins skipped, ${skippedKind} kinds not imported; ` +
    `${withPage} with their own page. Total pins: ${pins.length}. Next: npm run validate`,
);
