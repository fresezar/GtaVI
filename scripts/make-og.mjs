#!/usr/bin/env node
// Social preview images (1200x630), shown when a link is shared on TikTok, X, Discord, WhatsApp...
//   public/og.jpg        official art + title  (used while SITE.officialArt is true)
//   public/og-plain.jpg  our own gradient only (used when the art kill switch is off)
// Runs as part of `npm run media`. Text is drawn as SVG with system fonts.
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib.mjs";

const W = 1200;
const H = 630;
const ART = join(ROOT, "media-src", "HXRoX68WEAAIBko.jpg"); // same scene as the site backdrop

const overlay = (withArt) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b1050"/><stop offset="0.55" stop-color="#c2366b"/><stop offset="1" stop-color="#ff9a4d"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#120b1e" stop-opacity="0.92"/><stop offset="0.6" stop-color="#120b1e" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#120b1e" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  ${withArt ? "" : `<rect width="${W}" height="${H}" fill="url(#sky)"/>`}
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <text x="72" y="250" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="132" fill="#fff4ec">SIX STAR</text>
  <text x="76" y="330" font-family="Arial, sans-serif" font-weight="700" font-size="44" fill="#ffd27a">GTA VI interactive map</text>
  <text x="76" y="388" font-family="Arial, sans-serif" font-weight="700" font-size="34" fill="#fff4ec">Checklists · finds from streams · news</text>
  <text x="76" y="560" font-family="Arial, sans-serif" font-size="22" fill="#fff4ec" opacity="0.75">Unofficial fan site. Not affiliated with Rockstar Games.</text>
</svg>`;

const out = async (base, withArt, file) => {
  await base
    .composite([{ input: Buffer.from(overlay(withArt)), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(ROOT, "public", file));
  console.log(`Wrote public/${file}`);
};

await out(sharp({ create: { width: W, height: H, channels: 3, background: "#120b1e" } }), false, "og-plain.jpg");
if (existsSync(ART)) {
  await out(sharp(ART).resize({ width: W, height: H, fit: "cover", position: "attention" }), true, "og.jpg");
} else {
  console.warn("skip og.jpg: backdrop original not in media-src/ (og-plain.jpg is still used if the art is off)");
}
