#!/usr/bin/env node
// Content contract check. Runs before every build (prebuild): a bad record never ships.
//   npm run validate
import { execFileSync } from "node:child_process";
import {
  COLOR_TOKENS,
  CONFIDENCES,
  COORD_MAX,
  COORD_MIN,
  PATHS,
  SOURCES,
  SPOILERS,
  STATUSES,
  isHttpUrl,
  readJson,
} from "./lib.mjs";

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const pins = readJson(PATHS.pins);
const categories = readJson(PATHS.categories);
const text = readJson(PATHS.text);

// ---- categories ----
const catIds = new Set();
const catSlugs = new Set();
for (const c of categories) {
  const at = `category ${c.id}`;
  if (!/^cat_[a-z0-9_]+$/.test(c.id ?? "")) err(`${at}: id must look like cat_snake_case`);
  if (catIds.has(c.id)) err(`${at}: duplicate id`);
  if (catSlugs.has(c.slug)) err(`${at}: duplicate slug ${c.slug}`);
  catIds.add(c.id);
  catSlugs.add(c.slug);
  if (!/^[a-z0-9-]+$/.test(c.slug ?? "")) err(`${at}: bad slug`);
  if (!COLOR_TOKENS.includes(c.colorToken)) err(`${at}: colorToken must be one of ${COLOR_TOKENS.join(", ")}`);
  if (typeof c.sortOrder !== "number") err(`${at}: sortOrder must be a number`);
  if (typeof c.countsForProgress !== "boolean") err(`${at}: countsForProgress must be true/false`);
  if (!text[`category.${c.id}.name`]) warn(`${at}: no name in text.en.json`);
}

// ---- pins ----
const pinIds = new Set();
const slugs = new Map();
for (const p of pins) {
  const at = `pin ${p.id ?? "(no id)"}`;
  if (!/^pin_[0-9A-HJKMNP-TV-Z]{26}$/.test(p.id ?? "")) err(`${at}: id must be pin_<ULID>`);
  if (pinIds.has(p.id)) err(`${at}: duplicate id`);
  pinIds.add(p.id);
  if (!/^[a-z0-9-]+$/.test(p.slug ?? "")) err(`${at}: bad slug "${p.slug}"`);
  else if (slugs.has(p.slug)) err(`${at}: slug "${p.slug}" also used by ${slugs.get(p.slug)}`);
  else slugs.set(p.slug, p.id);
  if (!/^map_[a-z0-9_]+$/.test(p.mapId ?? "")) err(`${at}: bad mapId`);
  if (!catIds.has(p.categoryId)) err(`${at}: unknown category ${p.categoryId}`);
  // No coord = published but not placed yet (allowed). If present it must be valid.
  const [x, y] = Array.isArray(p.coord) ? p.coord : [];
  if (p.coord !== undefined && ![x, y].every((n) => typeof n === "number" && Number.isFinite(n) && n >= COORD_MIN && n <= COORD_MAX)) {
    err(`${at}: coord must be [x, y] numbers within ${COORD_MIN}..${COORD_MAX}`);
  }
  if (!STATUSES.includes(p.status)) err(`${at}: status must be one of ${STATUSES.join("/")}`);
  if (!SPOILERS.includes(p.spoilerLevel)) err(`${at}: spoilerLevel must be one of ${SPOILERS.join("/")}`);
  if (!SOURCES.includes(p.source)) err(`${at}: source must be one of ${SOURCES.join("/")}`);
  if (!/^\d{4}-\d{2}-\d{2}/.test(p.addedAt ?? "")) err(`${at}: addedAt must be YYYY-MM-DD`);
  if (!Number.isInteger(p.dataVersion) || p.dataVersion < 1) err(`${at}: dataVersion must be an integer >= 1`);
  if (p.credit && (!p.credit.name || (p.credit.url && !isHttpUrl(p.credit.url)))) err(`${at}: credit needs a name and an http(s) url if any`);

  const prov = p.provenance;
  if (prov) {
    if (prov.sourceUrl && !isHttpUrl(prov.sourceUrl)) err(`${at}: provenance.sourceUrl is not a web link`);
    if (!CONFIDENCES.includes(prov.confidence)) err(`${at}: provenance.confidence must be ${CONFIDENCES.join("/")}`);
    if (!["human", "ai"].includes(prov.extractedBy)) err(`${at}: provenance.extractedBy must be human/ai`);
    if (prov.extractedBy === "ai" && !prov.sourceUrl) err(`${at}: AI-collected data needs a sourceUrl`);
  } else if (p.source !== "self") {
    warn(`${at}: source "${p.source}" but no provenance.sourceUrl`);
  }
  if (p.status !== "deprecated" && !text[`pin.${p.id}.title`]) err(`${at}: missing title in text.en.json`);
}

// ---- editorial: timeline + news ----
for (const [file, prefix, fields] of [
  [PATHS.timeline, "timeline", ["title", "body"]],
  [PATHS.news, "news", ["title", "summary"]],
]) {
  const ids = new Set();
  for (const e of readJson(file)) {
    const at = `${prefix} ${e.id ?? "(no id)"}`;
    if (!/^[a-z0-9_]+$/.test(e.id ?? "")) err(`${at}: id must be snake_case`);
    if (ids.has(e.id)) err(`${at}: duplicate id`);
    ids.add(e.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")) err(`${at}: date must be YYYY-MM-DD`);
    if (!["confirmed", "rumor", "launch"].includes(e.kind)) err(`${at}: kind must be confirmed/rumor/launch`);
    if (!e.sourceName || !isHttpUrl(e.sourceUrl ?? "")) err(`${at}: needs sourceName and an http(s) sourceUrl`);
    for (const f of fields) if (!text[`${prefix}.${e.id}.${f}`]) err(`${at}: missing ${prefix}.${e.id}.${f} in text.en.json`);
  }
}

// ---- text: orphan keys are harmless but usually a typo. Turkish keys must also exist in English. ----
const textTr = readJson(PATHS.textTr);
for (const key of Object.keys(text)) {
  const m = key.match(/^pin\.(pin_[^.]+)\./);
  if (m && !pinIds.has(m[1])) warn(`text key ${key}: no such pin`);
}
for (const key of Object.keys(textTr)) {
  if (!(key in text)) warn(`text.tr.json key ${key}: not in text.en.json (English is the source of truth)`);
}
const trCategoryGaps = categories.filter((c) => !textTr[`category.${c.id}.name`]).map((c) => c.id);
if (trCategoryGaps.length) warn(`Turkish category names missing (English shown): ${trCategoryGaps.join(", ")}`);

// ---- never delete: every pin id that is committed must still exist ----
try {
  const committed = JSON.parse(execFileSync("git", ["show", "HEAD:content/pins.json"], { stdio: ["ignore", "pipe", "ignore"] }).toString());
  for (const p of committed) {
    if (!pinIds.has(p.id)) err(`pin ${p.id} was deleted. Never delete pins: set "status": "deprecated" (user progress depends on the id)`);
  }
} catch {
  /* no git or file not committed yet: nothing to compare */
}

// ---- report ----
const total = pins.length;
const live = pins.filter((p) => p.status !== "deprecated");
const counts = STATUSES.map((s) => `${s} ${pins.filter((p) => p.status === s).length}`).join(", ");
console.log(`Content: ${categories.length} categories, ${total} pins (${counts})${live.length === 0 ? " -> site runs in SAMPLE mode" : ""}`);
for (const w of warnings) console.log(`  warn: ${w}`);
for (const e of errors) console.error(`  ERROR: ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s). Fix content/ before building.`);
  process.exit(1);
}
console.log("Content OK.");
