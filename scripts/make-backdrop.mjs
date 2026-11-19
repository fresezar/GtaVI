#!/usr/bin/env node
// Dark-theme page backdrop: Leonida map (GTADB tiles, zoom 2), blurred and darkened, baked into one JPEG.
//   node scripts/make-backdrop.mjs   (needs `npm run tiles` first) -> public/brand/backdrop-map.jpg (committed)
// Baking the blur in keeps phones from running a live CSS blur over a big image.
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib.mjs";

const Z = 2;
const X = [2, 10];
const Y = [2, 12];
const TILE = 256;
const dir = join(ROOT, "public", "tiles", "day", String(Z));
if (!existsSync(dir)) throw new Error("no tiles: run `npm run tiles` first");

const tiles = [];
for (let x = X[0]; x <= X[1]; x++) {
  for (let y = Y[0]; y <= Y[1]; y++) {
    const f = join(dir, String(x), `${y}.jpg`);
    if (existsSync(f)) tiles.push({ input: f, left: (x - X[0]) * TILE, top: (y - Y[0]) * TILE });
  }
}
const w = (X[1] - X[0] + 1) * TILE;
const h = (Y[1] - Y[0] + 1) * TILE;
const map = await sharp({ create: { width: w, height: h, channels: 3, background: "#2F90B0" } }).composite(tiles).png().toBuffer();

// Landscape crop around the land, then blur and pull toward the night navy (#0B1422).
const out = await sharp(map)
  .extract({ left: 0, top: 380, width: w, height: Math.round(w * 0.62) })
  .resize(1600)
  .blur(14)
  .modulate({ brightness: 0.42, saturation: 1.1 })
  .composite([{ input: { create: { width: 1600, height: Math.round(1600 * 0.62), channels: 4, background: { r: 11, g: 20, b: 34, alpha: 0.35 } } } }])
  .jpeg({ quality: 70, mozjpeg: true })
  .toFile(join(ROOT, "public", "brand", "backdrop-map.jpg"));
console.log(`Wrote public/brand/backdrop-map.jpg (${out.width}x${out.height}, ${Math.round(out.size / 1024)} KB)`);
