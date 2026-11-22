#!/usr/bin/env node
// After `next build` (static export): keep the deployment under the host's file limit.
//   node scripts/prune-export.mjs        (part of npm run deploy)
// Every exported page is 5 files: index.html plus 4 RSC payloads used for client-side navigation. Pin pages
// (thousands, x3 languages) keep only index.html: links to them are plain page loads (prefetch is off on those
// links), so nothing is lost. Fails when the result is still over the limit, before anything is uploaded.
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const OUT = join(ROOT, "out");
const LIMIT = Number(process.env.ASSET_LIMIT ?? 20000); // Workers Free: 20,000 files per version (Paid: 100,000)

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let removed = 0;
for (const base of ["pins", "tr/pins", "es/pins"]) {
  const dir = join(OUT, base);
  try {
    statSync(dir);
  } catch {
    continue;
  }
  for (const slug of readdirSync(dir)) {
    const page = join(dir, slug);
    if (!statSync(page).isDirectory()) continue;
    for (const f of walk(page)) {
      if (f.endsWith("index.html")) continue;
      rmSync(f);
      removed++;
    }
  }
}
// Remove the RSC segment folders left empty.
for (const base of ["pins", "tr/pins", "es/pins"]) {
  const dir = join(OUT, base);
  try {
    for (const slug of readdirSync(dir)) {
      for (const e of readdirSync(join(dir, slug), { withFileTypes: true })) {
        if (e.isDirectory()) rmSync(join(dir, slug, e.name), { recursive: true, force: true });
      }
    }
  } catch {
    /* no such dir */
  }
}

let total = 0;
for (const _ of walk(OUT)) total++;
console.log(`prune: removed ${removed} pin-page payload files; ${total} files to upload (limit ${LIMIT}).`);
if (total > LIMIT) {
  console.error(`Over the file limit by ${total - LIMIT}. Lower the pin pages or tiles, or raise ASSET_LIMIT on Workers Paid.`);
  process.exit(1);
}
