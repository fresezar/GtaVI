#!/usr/bin/env node
// Bulk import: GTADB landmarks that have an in-game function (shops, stations, safehouses, tracks...) -> pins.
//   npm run import:gtadb            (run `npm run tiles` first: it fetches .cache/gtadb, incl. map/data/)
//   npm run import:gtadb -- --update  (pull GTADB again first)
// Source: https://github.com/rolux/gtadb.org, data license CC BY 4.0 (credited on every pin).
// Idempotent: each pin carries a "gtadb:<id>" tag; existing pins are updated in place, never duplicated or deleted.
// Coordinates: GTADB world metres -> pin frame on the GTADB grid (same formula as src/lib/worldCoord.ts).
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PATHS, readJson, ROOT, today, ulid, writeJson } from "./lib.mjs";

if (process.argv.includes("--update")) execFileSync("node", [join(ROOT, "scripts", "fetch-tiles.mjs"), "--update"], { stdio: "inherit" });

const DATA = join(ROOT, ".cache", "gtadb", "map", "data", "6", "landmarks.json");
const SOURCE_URL = "https://map.gtadb.org";
const CREDIT = { name: "GTADB.org", url: "https://map.gtadb.org" };

// GTADB "#tag" -> our category + a label for places GTADB has no name for ("?").
const MAP = {
  safehouse: ["cat_safehouses", "Safehouse", "Güvenli ev"],
  gym: ["cat_gyms", "Gym", "Spor salonu"],
  racetrack: ["cat_activities", "Racetrack", "Yarış pisti"],
  golf: ["cat_activities", "Golf course", "Golf sahası"],
  guns: ["cat_shops", "Gun shop", "Silah dükkânı"],
  modshop: ["cat_shops", "Mod shop", "Modifiye dükkânı"],
  carwash: ["cat_shops", "Car wash", "Oto yıkama"],
  gas: ["cat_shops", "Gas station", "Benzinlik"],
  supermarket: ["cat_shops", "Supermarket", "Market"],
  liquor: ["cat_shops", "Liquor store", "İçki dükkânı"],
  food: ["cat_shops", "Restaurant", "Restoran"],
  fastfood: ["cat_shops", "Fast food", "Fast food"],
  hair: ["cat_shops", "Barber", "Berber"],
  clothes: ["cat_shops", "Clothing store", "Giyim mağazası"],
  shoes: ["cat_shops", "Shoe store", "Ayakkabı mağazası"],
  tattoos: ["cat_shops", "Tattoo parlor", "Dövme salonu"],
  bikeshop: ["cat_shops", "Bike shop", "Motosiklet dükkânı"],
  electronics: ["cat_shops", "Electronics store", "Elektronik mağazası"],
  pharmacy: ["cat_shops", "Pharmacy", "Eczane"],
  vendor: ["cat_shops", "Vendor", "Satıcı"],
  fence: ["cat_shops", "Pawn shop (fence)", "Rehinci (çalıntı alımı)"],
  train: ["cat_transport", "Train station", "Tren istasyonu"],
  metro: ["cat_transport", "Metro station", "Metro istasyonu"],
  metromover: ["cat_transport", "Metromover station", "Metromover istasyonu"],
  bus: ["cat_transport", "Bus stop", "Otobüs durağı"],
  marina: ["cat_transport", "Marina", "Marina"],
  airport: ["cat_transport", "Airport", "Havalimanı"],
  airbase: ["cat_transport", "Air base", "Hava üssü"],
  hospital: ["cat_landmarks", "Hospital", "Hastane"],
  police: ["cat_landmarks", "Police station", "Karakol"],
  jail: ["cat_landmarks", "Prison", "Hapishane"],
  nightclub: ["cat_landmarks", "Nightclub", "Gece kulübü"],
  bar: ["cat_landmarks", "Bar", "Bar"],
  stripclub: ["cat_landmarks", "Strip club", "Striptiz kulübü"],
  cinema: ["cat_landmarks", "Cinema", "Sinema"],
  tennis: ["cat_landmarks", "Tennis courts", "Tenis kortu"],
  volleyball: ["cat_landmarks", "Volleyball court", "Voleybol sahası"],
  ferriswheel: ["cat_landmarks", "Ferris wheel", "Dönme dolap"],
  blimp: ["cat_landmarks", "Blimp", "Zeplin"],
};
const SKIP = new Set(["demolished", "//may-not-exist", "closed"]);

const HALF = 16384;
const frame = ([x, y]) => [round((x + HALF) / (HALF * 2)), round((HALF - y) / (HALF * 2))];
const round = (n) => Math.round(n * 1e7) / 1e7;
const slugify = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const landmarks = readJson(DATA);
const pins = readJson(PATHS.pins);
const en = readJson(PATHS.text);
const tr = readJson(PATHS.textTr);
const byTag = new Map(pins.flatMap((p) => (p.tags ?? []).filter((t) => t.startsWith("gtadb:")).map((t) => [t, p])));
const slugs = new Set(pins.map((p) => p.slug));
const day = today();
let added = 0;
let updated = 0;

for (const [gid, row] of Object.entries(landmarks)) {
  const [fullName, world, , , , , tags = []] = row;
  if (tags.some((t) => SKIP.has(t))) continue;
  const kind = tags.find((t) => t.startsWith("#") && MAP[t.slice(1)])?.slice(1);
  if (!kind) continue;
  const [categoryId, labelEn, labelTr] = MAP[kind];
  const [name, ...rest] = String(fullName).split(",").map((s) => s.trim());
  const region = rest.join(", ") || undefined;
  const named = name && name !== "?";
  const titleEn = named ? name : region ? `${labelEn}, ${rest[0]}` : labelEn;
  const titleTr = named ? name : region ? `${labelTr}, ${rest[0]}` : labelTr;
  const unconfirmed = tags.includes("unconfirmed");
  const tag = `gtadb:${gid}`;

  const fields = {
    mapId: "map_main",
    categoryId,
    coord: frame(world),
    source: "community",
    credit: CREDIT,
    ...(region ? { region } : {}),
    status: "unverified",
    spoilerLevel: "none",
    provenance: { sourceUrl: SOURCE_URL, retrievedAt: day, confidence: unconfirmed ? "low" : "medium", extractedBy: "ai" },
    tags: [tag, kind],
  };

  let pin = byTag.get(tag);
  if (pin) {
    const before = JSON.stringify(pin);
    Object.assign(pin, fields);
    if (JSON.stringify(pin) !== before) {
      pin.updatedAt = day;
      pin.dataVersion += 1;
      updated++;
    }
  } else {
    let slug = slugify(`${titleEn} ${named && rest[0] ? rest[0] : ""}`) || slugify(gid);
    if (slugs.has(slug)) slug = `${slug}-${gid.toLowerCase()}`;
    slugs.add(slug);
    pin = { id: `pin_${ulid()}`, slug, ...fields, addedAt: day, dataVersion: 1 };
    pins.push(pin);
    byTag.set(tag, pin);
    added++;
  }
  en[`pin.${pin.id}.title`] = titleEn;
  if (titleTr !== titleEn) tr[`pin.${pin.id}.title`] = titleTr;
  else delete tr[`pin.${pin.id}.title`];
}

writeJson(PATHS.pins, pins);
writeJson(PATHS.text, en);
writeJson(PATHS.textTr, tr);
console.log(`gtadb: ${added} added, ${updated} updated, ${pins.length} pins total`);
