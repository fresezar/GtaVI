#!/usr/bin/env node
// Brand logo, drawn as SVG (concept: brand/logo-concepts-2026-11-18.jpg, left variant):
// sheriff-badge six-point star + map pin + five small stars (badge = the sixth star).
//   node scripts/make-logo.mjs   (also part of `npm run media`)
// Writes two SVGs (ink on dark / ink on light), transparent PNGs for the dark site, and opaque app icons.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib.mjs";

const NAVY = "#0E1A2B";
const CORAL = "#FF6A55";
const CREAM = "#FFF4EC";

const f = (n) => Math.round(n * 100) / 100;
const star = (cx, cy, rOut, rIn, points = 6) => {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 ? rIn : rOut;
    pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join("L")}Z`;
};

// Geometry (viewBox 400 x 440).
const C = { x: 200, y: 258 }; // badge centre
const R = 150; // badge tip radius
const tips = [...Array(6)].map((_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return { x: f(C.x + R * Math.cos(a)), y: f(C.y + R * Math.sin(a)) };
});
const badgeOuter = star(C.x, C.y, R, R * 0.6);
const badgeInner = star(C.x, C.y, R * 0.64, R * 0.64 * 0.6);

const pin = { x: 200, y: 150, r: 50, tip: 262 };
const alpha = Math.acos(pin.r / (pin.tip - pin.y));
const tL = { x: f(pin.x - pin.r * Math.sin(alpha)), y: f(pin.y + pin.r * Math.cos(alpha)) };
const tR = { x: f(pin.x + pin.r * Math.sin(alpha)), y: tL.y };
const pinPath = `M${pin.x},${pin.tip}L${tL.x},${tL.y}A${pin.r},${pin.r} 0 1 1 ${tR.x},${tR.y}Z`;

const arc = { x: 200, y: 168, r: 128 };
const smallStars = (size) => [-72, -36, 0, 36, 72].map((deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return star(arc.x + arc.r * Math.cos(a), arc.y + arc.r * Math.sin(a), size, size * 0.43, 5);
});

// compact: for small sizes (favicon, header): no inner star, heavier strokes, bigger stars.
const svg = (ink, compact = false) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 20 340 410" width="340" height="410">
  <defs>
    <mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="440">
      <rect x="0" y="0" width="400" height="440" fill="#fff"/>
      <path d="${pinPath}" fill="#000" stroke="#000" stroke-width="40" stroke-linejoin="round"/>
      ${tips.map((t) => `<circle cx="${t.x}" cy="${t.y}" r="6" fill="#000"/>`).join("")}
    </mask>
    <mask id="hole" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="440">
      <rect x="0" y="0" width="400" height="440" fill="#fff"/>
      <circle cx="${pin.x}" cy="${pin.y - 2}" r="17" fill="#000"/>
    </mask>
  </defs>
  <g mask="url(#cut)" fill="none" stroke="${ink}" stroke-linejoin="round">
    <path d="${badgeOuter}" stroke-width="${compact ? 26 : 17}"/>
    ${compact ? "" : `<path d="${badgeInner}" stroke-width="13"/>`}
    ${tips.map((t) => `<circle cx="${t.x}" cy="${t.y}" r="${compact ? 14 : 12.5}" stroke-width="${compact ? 18 : 13}"/>`).join("")}
  </g>
  <path d="${pinPath}" fill="${CORAL}" stroke="${ink}" stroke-width="${compact ? 18 : 13}" stroke-linejoin="round" mask="url(#hole)"/>
  <g fill="${CORAL}">${smallStars(compact ? 22 : 15).map((d) => `<path d="${d}"/>`).join("")}</g>
</svg>
`;

const out = (p) => join(ROOT, p);
mkdirSync(out("public/brand"), { recursive: true });
const onDark = svg(CREAM);
const onLight = svg(NAVY);
const onDarkSmall = svg(CREAM, true);
const onLightSmall = svg(NAVY, true);
writeFileSync(out("brand/logo-on-dark.svg"), onDark);
writeFileSync(out("brand/logo-on-light.svg"), onLight);
writeFileSync(out("brand/logo-small-on-dark.svg"), onDarkSmall);
writeFileSync(out("brand/logo-small-on-light.svg"), onLightSmall);
writeFileSync(out("public/brand/logo.svg"), onDark);

// Fit the (taller than wide) mark into a transparent square.
const square = async (src, size, pad = 0) => {
  const inner = size - pad * 2;
  const mark = await sharp(Buffer.from(src), { density: 600 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, top: pad, left: pad }]);
};

for (const size of [64, 128, 256]) {
  await (await square(size <= 128 ? onDarkSmall : onDark, size)).png({ compressionLevel: 9 }).toFile(out(`public/brand/logo-${size}.png`));
}

// App icons: compact navy-ink mark on a cream tile, the brand's light face (favicons are tiny).
const icon = async (size, pad, file) => {
  const mark = await (await square(onLightSmall, size, pad)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: mark }])
    .png({ compressionLevel: 9 })
    .toFile(out(file));
};
await icon(512, 40, "src/app/icon.png");
await icon(180, 14, "src/app/apple-icon.png");
await icon(512, 96, "public/brand/icon-maskable-512.png"); // safe zone for Android masks
console.log("Wrote brand/logo-on-*.svg, public/brand/logo.svg, public/brand/logo-*.png, app icons");
