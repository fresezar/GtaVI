#!/usr/bin/env node
// Brand logo: brand/logo-source.jpg (neon shield on a dark backdrop) -> transparent PNGs + app icons.
//   node scripts/make-logo.mjs   (also part of `npm run media`)
// The backdrop is removed by treating the neon as light added on top of it: subtract the local
// background, alpha = brightest channel. The glow survives as soft transparency on any dark page.
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib.mjs";

const SRC = join(ROOT, "brand", "logo-source.jpg");
const CROP = { left: 445, top: 120, width: 520, height: 520 }; // square around the shield (+ glow)
const BG = [18, 11, 30]; // site background #120b1e (for opaque icons)

const { data, info } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// Background estimate: per-row median of the left and right 24 px columns (the vignette varies vertically).
const bgRow = [];
for (let y = 0; y < H; y++) {
  const samples = [];
  for (const x0 of [0, W - 24]) for (let x = x0; x < x0 + 24; x++) samples.push(y * W + x);
  bgRow.push([0, 1, 2].map((c) => samples.map((i) => data[i * 3 + c]).sort((a, b) => a - b)[samples.length >> 1]));
}

const rgba = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  const bg = bgRow[y];
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const d = [0, 1, 2].map((c) => Math.max(0, data[i * 3 + c] - bg[c] - 4)); // -4: kill JPEG noise
    const a = Math.min(255, Math.max(...d) * 1.15);
    for (let c = 0; c < 3; c++) rgba[i * 4 + c] = a ? Math.min(255, Math.round((d[c] * 255) / a)) : 0;
    rgba[i * 4 + 3] = Math.round(a);
  }
}
const clear = () => sharp(rgba, { raw: { width: W, height: H, channels: 4 } });

const out = (p) => join(ROOT, p);
for (const size of [64, 128, 256]) {
  await clear().resize(size, size).png({ compressionLevel: 9 }).toFile(out(`public/brand/logo-${size}.png`));
}
// App icons: opaque, site background, a little padding.
const opaque = async (size, pad, file) => {
  const inner = await clear().resize(size - pad * 2, size - pad * 2).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: BG[0], g: BG[1], b: BG[2], alpha: 1 } } })
    .composite([{ input: inner, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(out(file));
};
await opaque(512, 24, "src/app/icon.png");
await opaque(180, 12, "src/app/apple-icon.png");
await opaque(512, 72, "public/brand/icon-maskable-512.png"); // safe zone for Android masks
console.log("Wrote public/brand/logo-*.png, src/app/icon.png, src/app/apple-icon.png, public/brand/icon-maskable-512.png");
