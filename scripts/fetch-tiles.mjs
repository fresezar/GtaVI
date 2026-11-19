#!/usr/bin/env node
// Map tiles: GTADB "day" tileset (in-game map look), zoom 0-5, into public/tiles/day/{z}/{x}/{y}.jpg.
//   node scripts/fetch-tiles.mjs            (skips when the tiles are already there; part of `npm run deploy`)
//   node scripts/fetch-tiles.mjs --update   (pulls GTADB again and recopies)
// Source: https://github.com/rolux/gtadb.org (data license CC BY 4.0, credited on the map).
// Not committed: the tiles live in .cache/ and public/tiles/ (both git-ignored), ~7,800 files / 45 MB.
// Zoom 6 (2 px/m, ~23,000 more files) is left out: it would push the site past the static-asset file limit.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const MAX_Z = 5;
const REPO = "https://github.com/rolux/gtadb.org.git";
const CACHE = join(ROOT, ".cache", "gtadb");
const SRC = join(CACHE, "maps", "tiles", "6", "day");
const OUT = join(ROOT, "public", "tiles", "day");
const update = process.argv.includes("--update");

const count = (dir) => (existsSync(dir) ? readdirSync(dir).length : 0);
if (!update && count(join(OUT, String(MAX_Z))) > 0) {
  console.log("tiles: already in public/tiles/day (use --update to refresh)");
  process.exit(0);
}

// Git Bash rewrites leading-slash arguments into Windows paths; patterns below have none.
const git = (args, cwd = CACHE) => execFileSync("git", args, { cwd, stdio: "inherit", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
if (!existsSync(join(CACHE, ".git"))) {
  mkdirSync(join(ROOT, ".cache"), { recursive: true });
  git(["clone", "-q", "--filter=blob:none", "--no-checkout", "--depth", "1", "--sparse", REPO, CACHE], ROOT);
  const dirs = [...Array(MAX_Z + 1).keys()].map((z) => `maps/tiles/6/day/${z}/`);
  git(["sparse-checkout", "set", "--no-cone", ...dirs, "LICENSE-DATA", "map/data/"]);
  git(["read-tree", "-mu", "HEAD"]);
} else if (update) {
  git(["fetch", "-q", "--depth", "1", "origin", "main"]);
  git(["reset", "-q", "--hard", "origin/main"]);
}

// GTADB names tiles "{z},{y},{x}.jpg"; we serve the usual XYZ layout.
let n = 0;
for (let z = 0; z <= MAX_Z; z++) {
  for (const name of readdirSync(join(SRC, String(z)))) {
    const m = name.match(/^(\d+),(\d+),(\d+)\.jpg$/);
    if (!m) continue;
    const [, , y, x] = m;
    const dir = join(OUT, String(z), x);
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(SRC, String(z), name), join(dir, `${y}.jpg`));
    n++;
  }
}
console.log(`tiles: copied ${n} tiles to public/tiles/day (z0-${MAX_Z})`);
