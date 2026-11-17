#!/usr/bin/env node
// Crop + resize official artwork from media-src/ into public/media/*.webp (see src/config/art.ts).
//   npm run media
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib.mjs";

// Read the asset table from the TS config without a TS runtime: it is a plain object literal.
const cfg = readFileSync(join(ROOT, "src/config/art.ts"), "utf8");
const body = cfg.slice(cfg.indexOf("export const ART = {") + "export const ART = ".length, cfg.indexOf("} as const"));
const ART = Function(`"use strict"; return (${body}});`)();

const SRC = join(ROOT, "media-src");
const OUT = join(ROOT, "public", "media");
mkdirSync(OUT, { recursive: true });

let made = 0;
for (const [name, a] of Object.entries(ART)) {
  const file = join(SRC, a.src);
  if (!existsSync(file)) {
    console.warn(`skip ${name}: ${a.src} not in media-src/`);
    continue;
  }
  const meta = await sharp(file).metadata();
  const cropW = meta.width;
  const cropH = Math.min(meta.height, Math.round(cropW / a.aspect));
  const top = Math.max(0, Math.min(meta.height - cropH, Math.round(a.focusY * meta.height - cropH / 2)));
  for (const w of a.widths) {
    await sharp(file)
      .extract({ left: 0, top, width: cropW, height: cropH })
      .resize({ width: w })
      .webp({ quality: 72 })
      .toFile(join(OUT, `${name}-${w}.webp`));
    made++;
  }
}
console.log(`Wrote ${made} images to public/media/`);
