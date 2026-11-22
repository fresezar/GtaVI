#!/usr/bin/env node
// Import pins from a table (CSV/TSV exported from Google Sheets). See docs/INGEST.md.
//
//   npm run import:pins -- <file.csv>            dry run: report only, nothing written
//   npm run import:pins -- <file.csv> --write    apply
//   flags: --allow-near   import rows even if a same-category pin is very close
//
// New rows get an immutable pin_<ULID>. Rows with an `id` update that pin (non-empty cells only).
import { readFileSync } from "node:fs";
import {
  CONFIDENCES,
  COORD_MAX,
  COORD_MIN,
  PATHS,
  SOURCES,
  SPOILERS,
  STATUSES,
  inferSource,
  isHttpUrl,
  parseDelimited,
  parseTimestamp,
  readJson,
  slugify,
  today,
  ulid,
  withTimestamp,
  writeJson,
} from "./lib.mjs";

const NEAR = 0.003; // ~0.3% of map width: closer than this in the same category = probably the same thing

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const WRITE = args.includes("--write");
const ALLOW_NEAR = args.includes("--allow-near");
if (!file) {
  console.error("Usage: npm run import:pins -- <file.csv> [--write] [--allow-near]");
  process.exit(1);
}

// ---- header normalization: tolerate "Source URL", "found by", "x"/"y", etc. ----
const ALIASES = {
  category: "category", kategori: "category",
  title: "title", name: "title", baslik: "title",
  description: "description", desc: "description", aciklama: "description",
  title_tr: "title_tr", baslik_tr: "title_tr", description_tr: "description_tr", aciklama_tr: "description_tr",
  coord: "coord", coords: "coord", coordinate: "coord", koordinat: "coord",
  x: "x", y: "y",
  source_url: "source_url", source: "source_url", url: "source_url", link: "source_url", kaynak: "source_url",
  timestamp: "timestamp", time: "timestamp", t: "timestamp", zaman: "timestamp",
  finder: "finder", found_by: "finder", credit: "finder", streamer: "finder", bulan: "finder",
  finder_url: "finder_url", credit_url: "finder_url", channel: "finder_url",
  spoiler: "spoiler", status: "status", confidence: "confidence", region: "region", id: "id", notes: "notes", not: "notes",
  source_type: "source_type", extracted_by: "extracted_by",
};
const normHeader = (h) => {
  const k = h.trim().toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[\s-]+/g, "_").replace(/ı/g, "i");
  return ALIASES[k] ?? k;
};

const rows = parseDelimited(readFileSync(file, "utf8"));
if (rows.length < 2) {
  console.error("No data rows found.");
  process.exit(1);
}
const headers = rows[0].map(normHeader);
if (!headers.includes("category") || !headers.includes("title")) {
  if (!headers.includes("id")) {
    console.error(`Header row must include at least "category" and "title" (found: ${rows[0].join(", ")}).`);
    process.exit(1);
  }
}

const pins = readJson(PATHS.pins);
const categories = readJson(PATHS.categories);
const text = readJson(PATHS.pinText);
const textTr = readJson(PATHS.pinTextTr);
/** Optional Turkish text (title_tr / description_tr columns). Missing Turkish falls back to English on the site. */
const setTr = (id, get) => {
  if (get("title_tr")) textTr[`pin.${id}.title`] = get("title_tr");
  if (get("description_tr")) textTr[`pin.${id}.description`] = get("description_tr");
};

// Category lookup by id, slug or English name (case-insensitive, & / and tolerant).
const catKey = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
const catLookup = new Map();
for (const c of categories) {
  for (const k of [c.id, c.slug, c.id.replace(/^cat_/, ""), text[`category.${c.id}.name`] ?? ""]) if (k) catLookup.set(catKey(k), c);
}
const validCategoryNames = categories.map((c) => text[`category.${c.id}.name`] ?? c.slug).join(", ");

const byId = new Map(pins.map((p) => [p.id, p]));
const usedSlugs = new Set(pins.map((p) => p.slug));
const uniqueSlug = (base) => {
  let slug = base || "pin";
  for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
  usedSlugs.add(slug);
  return slug;
};

function parseCoord(get) {
  let x;
  let y;
  if (get("coord")) {
    const m = get("coord").match(/^\s*\[?\s*(-?\d*\.?\d+)\s*[,;\s]\s*(-?\d*\.?\d+)\s*\]?\s*$/);
    if (!m) return { error: `coord "${get("coord")}" is not "x, y"` };
    x = Number(m[1]);
    y = Number(m[2]);
  } else if (get("x") && get("y")) {
    x = Number(get("x"));
    y = Number(get("y"));
  } else return { missing: true };
  if (![x, y].every((n) => Number.isFinite(n) && n >= COORD_MIN && n <= COORD_MAX)) return { error: `coord ${x}, ${y} is out of range` };
  return { coord: [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000] };
}

const report = { created: [], updated: [], placed: [], needsLocation: [], near: [], errors: [], skippedEmpty: 0, drafts: 0, already: 0 };
const batch = []; // new pins from this file, for in-file duplicate checks

for (let r = 1; r < rows.length; r++) {
  const rowNo = r + 1; // 1-based, header is row 1 (matches the sheet)
  const cells = rows[r];
  if (cells.every((c) => !c.trim())) {
    report.skippedEmpty++;
    continue;
  }
  const record = Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()]));
  const get = (k) => record[k] ?? "";
  const errs = [];

  const category = get("category") ? catLookup.get(catKey(get("category"))) : undefined;
  if (get("category") && !category) errs.push(`unknown category "${get("category")}" (use one of: ${validCategoryNames})`);

  const enumField = (key, allowed) => {
    const v = get(key).toLowerCase();
    if (v && !allowed.includes(v)) errs.push(`${key} "${get(key)}" must be one of ${allowed.join("/")}`);
    return v || undefined;
  };
  const spoiler = enumField("spoiler", SPOILERS);
  const status = enumField("status", STATUSES);
  const confidence = enumField("confidence", CONFIDENCES);
  const sourceType = enumField("source_type", SOURCES);
  const extractedBy = enumField("extracted_by", ["human", "ai"]);

  let sourceUrl = get("source_url");
  if (sourceUrl && !isHttpUrl(sourceUrl)) errs.push(`source_url "${sourceUrl}" is not a web link`);
  const seconds = parseTimestamp(get("timestamp"));
  if (Number.isNaN(seconds)) errs.push(`timestamp "${get("timestamp")}" not understood (use 1:02:33)`);
  if (sourceUrl && isHttpUrl(sourceUrl) && seconds > 0) sourceUrl = withTimestamp(sourceUrl, seconds);
  if (get("finder_url") && !isHttpUrl(get("finder_url"))) errs.push(`finder_url "${get("finder_url")}" is not a web link`);
  if (extractedBy === "ai" && !sourceUrl) errs.push("AI-collected rows need a source_url");

  const loc = parseCoord(get);
  if (loc.error) errs.push(loc.error);

  // ---- update an existing pin ----
  if (get("id")) {
    const pin = byId.get(get("id"));
    if (!pin) errs.push(`id ${get("id")} does not exist`);
    if (errs.length) {
      report.errors.push({ rowNo, errs });
      continue;
    }
    const changes = [];
    if (category && category.id !== pin.categoryId) (pin.categoryId = category.id), changes.push("category");
    if (loc.coord) (pin.coord = loc.coord), changes.push("coord");
    if (spoiler) (pin.spoilerLevel = spoiler), changes.push("spoiler");
    if (status) (pin.status = status), changes.push("status");
    if (get("region")) (pin.region = get("region")), changes.push("region");
    if (get("finder")) (pin.credit = { name: get("finder"), ...(get("finder_url") ? { url: get("finder_url") } : {}) }), changes.push("credit");
    if (sourceUrl || confidence) {
      pin.provenance = {
        ...(pin.provenance ?? { confidence: "medium", extractedBy: "human" }),
        ...(sourceUrl ? { sourceUrl, retrievedAt: today() } : {}),
        ...(confidence ? { confidence } : {}),
      };
      changes.push("source");
    }
    if (sourceType) (pin.source = sourceType), changes.push("source type");
    if (get("title")) (text[`pin.${pin.id}.title`] = get("title")), changes.push("title");
    if (get("description")) (text[`pin.${pin.id}.description`] = get("description")), changes.push("description");
    if (get("title_tr") || get("description_tr")) setTr(pin.id, get), changes.push("turkish text");
    if (changes.length) {
      pin.updatedAt = today();
      pin.dataVersion = (pin.dataVersion ?? 1) + 1;
      report.updated.push({ rowNo, id: pin.id, title: text[`pin.${pin.id}.title`], changes });
    }
    continue;
  }

  // ---- new pin ----
  // No title = a quick note from the site's entry tool (link + time). Not publishable yet: skip quietly.
  if (!get("title")) {
    if (errs.length) report.errors.push({ rowNo, errs });
    else report.drafts++;
    continue;
  }
  if (!get("category")) errs.push("category is empty");
  if (errs.length) {
    report.errors.push({ rowNo, errs });
    continue;
  }

  // The entry tool always sends its whole list, so most rows were imported before. Same pin =
  // same category and (same title, or same clip at the same second), and not clearly elsewhere on the map.
  const titleSlug = slugify(get("title"));
  const clipKey = seconds > 0 ? sourceUrl : "";
  const same = [...pins, ...batch].find((p) => {
    if (p.categoryId !== category.id) return false;
    const sameTitle = slugify(text[`pin.${p.id}.title`] ?? "") === titleSlug;
    const sameClip = clipKey && p.provenance?.sourceUrl === clipKey;
    if (!sameTitle && !sameClip) return false;
    if (!p.coord || loc.missing) return true;
    return Math.hypot(p.coord[0] - loc.coord[0], p.coord[1] - loc.coord[1]) < NEAR * 10;
  });
  if (same) {
    if (!same.coord && loc.coord) {
      same.coord = loc.coord;
      same.updatedAt = today();
      same.dataVersion = (same.dataVersion ?? 1) + 1;
      report.placed.push({ rowNo, id: same.id, title: text[`pin.${same.id}.title`] ?? get("title") });
    } else report.already++;
    continue;
  }

  const close = loc.coord
    ? [...pins, ...batch].find((p) => p.categoryId === category.id && p.coord && Math.hypot(p.coord[0] - loc.coord[0], p.coord[1] - loc.coord[1]) < NEAR)
    : undefined;
  if (close && !ALLOW_NEAR) {
    report.near.push({ rowNo, title: get("title"), other: close.id, otherTitle: text[`pin.${close.id}.title`] ?? "(this file)" });
    continue;
  }
  if (loc.missing) report.needsLocation.push({ rowNo, title: get("title") });

  const id = `pin_${ulid()}`;
  const pin = {
    id,
    slug: uniqueSlug(slugify(get("title"))),
    mapId: "map_main",
    categoryId: category.id,
    ...(loc.coord ? { coord: loc.coord } : {}),
    source: sourceType ?? inferSource(sourceUrl),
    ...(get("finder") ? { credit: { name: get("finder"), ...(get("finder_url") ? { url: get("finder_url") } : {}) } } : {}),
    ...(get("region") ? { region: get("region") } : {}),
    status: status ?? "unverified",
    spoilerLevel: spoiler ?? "none",
    ...(sourceUrl
      ? { provenance: { sourceUrl, retrievedAt: today(), confidence: confidence ?? "medium", extractedBy: extractedBy ?? "human" } }
      : {}),
    addedAt: today(),
    dataVersion: 1,
  };
  text[`pin.${id}.title`] = get("title");
  if (get("description")) text[`pin.${id}.description`] = get("description");
  setTr(id, get);
  batch.push(pin);
  report.created.push({ rowNo, id, title: get("title"), category: text[`category.${category.id}.name`] ?? category.slug });
}

// ---- report ----
const byCat = report.created.reduce((acc, c) => ((acc[c.category] = (acc[c.category] ?? 0) + 1), acc), {});
const line = (s = "") => console.log(s);
line(`\nImport ${WRITE ? "APPLIED" : "dry run"}: ${file}`);
line(`  New pins:        ${report.created.length}${report.created.length ? `  (${Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join(", ")})` : ""}`);
line(`  ...of them unplaced: ${report.needsLocation.length}  (published without a map spot)`);
line(`  Placed now:      ${report.placed.length}  (existing unplaced pins got their coord)`);
line(`  Updated pins:    ${report.updated.length}`);
line(`  Already in:      ${report.already}`);
line(`  Drafts skipped:  ${report.drafts}  (quick notes without a title)`);
line(`  Near duplicates: ${report.near.length}`);
line(`  Errors:          ${report.errors.length}`);
if (report.needsLocation.length) {
  line("\nPublished without a map spot (give them a coord in /map?dev=true and send the list again):");
  for (const r of report.needsLocation) line(`  row ${r.rowNo}: ${r.title}`);
}
if (report.placed.length) {
  line("\nPlaced on the map:");
  for (const r of report.placed) line(`  row ${r.rowNo}: ${r.id} "${r.title}"`);
}
if (report.near.length) {
  line("\nSkipped as probable duplicates (put the existing id in the `id` column to update it, or use --allow-near):");
  for (const r of report.near) line(`  row ${r.rowNo}: "${r.title}" is next to ${r.other} "${r.otherTitle}"`);
}
if (report.errors.length) {
  line("\nErrors (row skipped):");
  for (const r of report.errors) line(`  row ${r.rowNo}: ${r.errs.join("; ")}`);
}
if (report.updated.length) {
  line("\nUpdated:");
  for (const u of report.updated) line(`  row ${u.rowNo}: ${u.id} "${u.title}" (${u.changes.join(", ")})`);
}

if (WRITE) {
  writeJson(PATHS.pins, [...pins, ...batch]);
  writeJson(PATHS.pinText, text);
  writeJson(PATHS.pinTextTr, textTr);
  line(`\nWrote content/pins.json, text.en.json and text.tr.json. Next: npm run validate`);
} else {
  line(`\nNothing written. Re-run with --write to apply.`);
}
