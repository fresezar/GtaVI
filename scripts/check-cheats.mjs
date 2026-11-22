#!/usr/bin/env node
// Compare our cheat list with the source (GTA 6 Intel, shared by its founder for reuse) and report what changed.
//   npm run cheats:check               report only (one request to the source page)
//   npm run cheats:check -- --write    apply new codes and unlock rules to content/cheats.json, then: npm run deploy
// New cheats come in with the source's English text; rewrite effect.en and translate the TR fields afterwards (listed).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const FILE = join(ROOT, "content", "cheats.json");
const write = process.argv.includes("--write");
const data = JSON.parse(readFileSync(FILE, "utf8").replace(/^﻿/, ""));

const res = await fetch(data.source, { headers: { "user-agent": "Mozilla/5.0 (compatible; SixStarCheatCheck/1.0)" } });
if (!res.ok) throw new Error(`source: HTTP ${res.status}`);
const html = await res.text();

const dec = (s) => s.replace(/&#0?39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
const KIND = { Player: "player", Weapons: "weapons", Vehicles: "vehicles", World: "world" };
const DIR = { Up: "up", Down: "down", Left: "left", Right: "right" };
const rows = html
  .split('<li class="ch-row"')
  .slice(1)
  .map((r) => r.split("</details>")[0])
  .map((r) => {
    const g = (re) => {
      const m = r.match(re);
      return m ? dec(m[1]) : "";
    };
    const slug = g(/cheats\/([a-z0-9-]+)">Full/);
    const ps5 = g(/aria-label="PS5 code: ([^"]*)"/);
    return {
      id: `cheat_${slug.replace(/-/g, "_")}`,
      slug,
      name: g(/class="ch-name">([^<]*)</),
      kind: KIND[g(/data-kind="([^"]*)"/)] ?? "player",
      effect: g(/class="ch-what[^"]*">([^<]*)</),
      code: ps5 ? ps5.split(/,\s*/).map((d) => DIR[d]) : null,
      unlock: g(/Then unlock this cheat: ([^<]*)</) || null,
    };
  })
  .filter((r) => r.slug && r.name);

if (rows.length < 10) throw new Error(`source: only ${rows.length} cheats parsed; the page layout probably changed. Nothing written.`);

const ours = new Map(data.cheats.map((c) => [c.id, c]));
const report = { newCodes: [], changedCodes: [], changedUnlocks: [], added: [], missing: [] };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const r of rows) {
  const c = ours.get(r.id);
  if (!c) {
    report.added.push(r.name);
    if (write)
      data.cheats.push({
        id: r.id,
        slug: r.slug,
        name: r.name,
        kind: r.kind,
        code: r.code,
        effect: { en: r.effect, tr: r.effect, es: r.effect },
        unlock: r.unlock ? { en: r.unlock, tr: r.unlock, es: r.unlock } : null,
      });
    continue;
  }
  if (r.code && !c.code) {
    report.newCodes.push(`${r.name}: ${r.code.join(" ")}`);
    if (write) c.code = r.code;
  } else if (r.code && !same(r.code, c.code)) {
    report.changedCodes.push(`${r.name}: ${c.code.join(" ")} -> ${r.code.join(" ")}`);
    if (write) c.code = r.code;
  }
  if ((r.unlock ?? null) !== (c.unlock?.en ?? null)) {
    report.changedUnlocks.push(`${r.name}: "${c.unlock?.en ?? "after story"}" -> "${r.unlock ?? "after story"}"`);
    if (write) c.unlock = r.unlock ? { en: r.unlock, tr: r.unlock, es: r.unlock } : null;
  }
}
const theirs = new Set(rows.map((r) => r.id));
for (const c of data.cheats) if (!theirs.has(c.id)) report.missing.push(c.name);

const section = (title, list) => list.length && console.log(`\n${title} (${list.length}):\n  ${list.join("\n  ")}`);
console.log(`Source: ${rows.length} cheats, ${rows.filter((r) => r.code).length} with codes. Ours: ${data.cheats.length}, ${data.cheats.filter((c) => c.code).length} with codes.`);
section("New codes", report.newCodes);
section("Changed codes", report.changedCodes);
section("Changed unlock rules (TR and ES need translating)", report.changedUnlocks);
section("New cheats (rewrite effect.en, translate TR and ES)", report.added);
section("Not on the source any more (left as is)", report.missing);
const changes = report.newCodes.length + report.changedCodes.length + report.changedUnlocks.length + report.added.length;
if (!changes) console.log("\nNo changes.");

if (write) {
  data.checkedAt = new Date().toISOString();
  writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote content/cheats.json (checkedAt updated). Next: npm run deploy`);
} else if (changes) {
  console.log("\nApply with: npm run cheats:check -- --write");
}
