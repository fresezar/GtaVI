#!/usr/bin/env node
// Map overlays from GTADB landmarks (CC BY 4.0): region shapes + labels, district labels, named places.
//   npm run build:places            (needs .cache/gtadb from `npm run tiles` and public/tiles/day/1)
// Output (served as static files, fetched by the map):
//   public/data/regions.json   { regions: [{ id, name, color, label, rings }], districts: [{ name, area, label }] }
//   public/data/places.json    [{ id, name, district, area, coord, type, unconfirmed }]
//
// GTADB has no area boundaries, only ~3,600 points with addresses ("Name, District, Area"). Regions are
// derived here: land cells (water masked out using the zoom-1 map tiles) go to the area of the nearest
// point, then each area's cells are traced into outlines and smoothed. Approximate by design.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ffmpeg from "ffmpeg-static";
import { readJson, PATHS, ROOT } from "./lib.mjs";

const SRC = join(ROOT, ".cache", "gtadb", "map", "data", "6", "landmarks.json");
if (!existsSync(SRC)) {
  console.error("Missing GTADB data: run `npm run tiles` first.");
  process.exit(1);
}
const OUT = join(ROOT, "public", "data");
mkdirSync(OUT, { recursive: true });

const SIZE = 32768; // metres across the frame (zoom-5 pixels)
const HALF = SIZE / 2;
const frame = ([x, y]) => [(x + HALF) / SIZE, (HALF - y) / SIZE];
const r5 = (v) => Math.round(v * 1e5) / 1e5;

// ---------- landmarks ----------
const BAD = /^(demolished|cancelled|\/\/doesnt|\/\/may-not-exist|\/\/duplicate|\/\/todo_not_here)/;
const FIX = { "Vice CIty": "Vice City", "Stafish Island": "Starfish Island", "Gellhorn International Raceway": "Port Gellhorn", "Port Gellhorn International Raceway": "Port Gellhorn" };
const rows = Object.values(JSON.parse(readFileSync(SRC, "utf8")))
  .filter((a) => !(a[6] ?? []).some((t) => BAD.test(t)))
  .map((a) => {
    const parts = a[0].split(", ").map((p) => FIX[p] ?? p);
    const [fx, fy] = frame(a[1]);
    return {
      gid: String(a[7]),
      name: parts[0],
      district: parts.length >= 3 ? parts[parts.length - 2] : "",
      area: parts.length >= 2 ? parts[parts.length - 1] : "",
      fx,
      fy,
      types: (a[6] ?? []).filter((t) => /^[a-z]/.test(t) && !/^l\d$/.test(t)),
      unconfirmed: (a[6] ?? []).includes("unconfirmed"),
    };
  });

// ---------- places: named spots not already on the map as pins ----------
const pins = readJson(PATHS.pins);
const pinned = new Set(pins.flatMap((p) => (p.tags ?? []).filter((t) => t.startsWith("gtadb:")).map((t) => t.slice(6))));
const TYPE = ["hotel", "restaurant", "retail", "transportation", "leisure", "government", "events", "industrial", "utilities", "landmark", "natural", "residential", "office", "public"];
const seen = new Set();
const places = rows
  .filter((r) => r.name && r.name !== "?" && !r.name.startsWith("?") && !pinned.has(r.gid))
  .filter((r) => {
    const key = `${r.name}|${Math.round(r.fx * 2000)}|${Math.round(r.fy * 2000)}`; // same name within ~16 m = one place
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .map((r) => ({
    id: `place_${r.gid}`,
    name: r.name,
    district: r.district,
    area: r.area,
    coord: [r5(r.fx), r5(r.fy)],
    type: TYPE.find((t) => r.types.includes(t)) ?? "",
    unconfirmed: r.unconfirmed,
  }));
writeFileSync(join(OUT, "places.json"), JSON.stringify(places));

// ---------- regions ----------
const MIN_POINTS = 12;
const SKIP_AREAS = new Set(["Leonida", "Atlantic Ocean", "Gulf of Leonida", "Leonida Straits", ""]);
const count = {};
for (const r of rows) count[r.area] = (count[r.area] ?? 0) + 1;
const areaNames = Object.keys(count).filter((a) => count[a] >= MIN_POINTS && !SKIP_AREAS.has(a)).sort();
const areaIdx = new Map(areaNames.map((a, i) => [a, i + 1]));
const seeds = rows.filter((r) => areaIdx.has(r.area)).map((r) => ({ x: r.fx * SIZE, y: r.fy * SIZE, a: areaIdx.get(r.area) }));

// Grid over the land view (src/data/maps.ts view: zoom-5 tiles 17..84 x 17..104), metres.
const CELL = 32;
const X0 = 17 * 256, Y0 = 17 * 256, X1 = 85 * 256, Y1 = 105 * 256;
const NX = Math.ceil((X1 - X0) / CELL), NY = Math.ceil((Y1 - Y0) / CELL);

// Water mask from zoom-1 tiles (16 m per pixel). Missing tile = sea.
const tileCache = new Map();
function tile(tx, ty) {
  const key = `${tx}/${ty}`;
  if (!tileCache.has(key)) {
    const f = join(ROOT, "public", "tiles", "day", "1", String(tx), `${ty}.jpg`);
    tileCache.set(key, existsSync(f) ? spawnSync(ffmpeg, ["-v", "error", "-i", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1e7 }).stdout : null);
  }
  return tileCache.get(key);
}
function isWater(mx, my) {
  const px = Math.floor(mx / 16), py = Math.floor(my / 16);
  const buf = tile(Math.floor(px / 256), Math.floor(py / 256));
  if (!buf) return true;
  const i = ((py % 256) * 256 + (px % 256)) * 3;
  const [r, g, b] = [buf[i], buf[i + 1], buf[i + 2]];
  return b - r > 60 && b >= g - 6;
}

// Nearest seed (bucketed), up to MAX_D metres from any point.
const MAX_D = 2600;
const B = 400;
const buckets = new Map();
for (const s of seeds) {
  const k = `${Math.floor(s.x / B)},${Math.floor(s.y / B)}`;
  (buckets.get(k) ?? buckets.set(k, []).get(k)).push(s);
}
const R = Math.ceil(MAX_D / B);
let grid = new Uint8Array(NX * NY);
for (let j = 0; j < NY; j++) {
  for (let i = 0; i < NX; i++) {
    const mx = X0 + (i + 0.5) * CELL, my = Y0 + (j + 0.5) * CELL;
    if (isWater(mx, my)) continue;
    const bx = Math.floor(mx / B), by = Math.floor(my / B);
    let best = MAX_D * MAX_D, area = 0;
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const list = buckets.get(`${bx + dx},${by + dy}`);
        if (!list) continue;
        for (const s of list) {
          const d = (s.x - mx) ** 2 + (s.y - my) ** 2;
          if (d < best) (best = d), (area = s.a);
        }
      }
    grid[j * NX + i] = area;
  }
}

// Smooth: majority of the 3x3 neighbourhood (water stays water), twice.
for (let pass = 0; pass < 2; pass++) {
  const next = grid.slice();
  for (let j = 1; j < NY - 1; j++)
    for (let i = 1; i < NX - 1; i++) {
      const v = grid[j * NX + i];
      if (!v) continue;
      const tally = new Map();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const n = grid[(j + dy) * NX + i + dx];
        if (n) tally.set(n, (tally.get(n) ?? 0) + 1);
      }
      let top = v, topN = 0;
      for (const [k, n] of tally) if (n > topN) (top = k), (topN = n);
      next[j * NX + i] = top;
    }
  grid = next;
}

// Drop specks: connected pieces under MIN_CELLS cells.
const MIN_CELLS = 40;
{
  const seen2 = new Uint8Array(NX * NY);
  for (let start = 0; start < grid.length; start++) {
    if (!grid[start] || seen2[start]) continue;
    const v = grid[start], stack = [start], comp = [];
    seen2[start] = 1;
    while (stack.length) {
      const c = stack.pop();
      comp.push(c);
      const i = c % NX, j = (c / NX) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) continue;
        const n = nj * NX + ni;
        if (!seen2[n] && grid[n] === v) (seen2[n] = 1), stack.push(n);
      }
    }
    if (comp.length < MIN_CELLS) for (const c of comp) grid[c] = 0;
  }
}

// Trace outlines: directed cell edges (clockwise in screen space), chained into rings.
function trace(a) {
  const out = new Map(); // vertex -> [next vertices]
  const V = (x, y) => y * (NX + 1) + x;
  const add = (from, to) => (out.get(from) ?? out.set(from, []).get(from)).push(to);
  const at = (i, j) => i >= 0 && j >= 0 && i < NX && j < NY && grid[j * NX + i] === a;
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      if (!at(i, j)) continue;
      if (!at(i, j - 1)) add(V(i, j), V(i + 1, j));
      if (!at(i + 1, j)) add(V(i + 1, j), V(i + 1, j + 1));
      if (!at(i, j + 1)) add(V(i + 1, j + 1), V(i, j + 1));
      if (!at(i - 1, j)) add(V(i, j + 1), V(i, j));
    }
  const rings = [];
  for (const [startV, list] of out) {
    while (list.length) {
      const ring = [startV];
      let v = list.pop();
      let guard = 0;
      while (v !== startV && guard++ < 1e6) {
        ring.push(v);
        const nexts = out.get(v);
        if (!nexts || !nexts.length) break;
        v = nexts.pop();
      }
      if (ring.length >= 4) rings.push(ring.map((id) => [id % (NX + 1), Math.floor(id / (NX + 1))]));
    }
  }
  return rings;
}

function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [x1, y1] = pts[s], [x2, y2] = pts[e];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    let far = -1, fd = 0;
    for (let k = s + 1; k < e; k++) {
      // Closed ring: first == last, so measure from that point instead of from a zero-length segment.
      const d = len < 1e-9 ? Math.hypot(pts[k][0] - x1, pts[k][1] - y1) : Math.abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / len;
      if (d > fd) (fd = d), (far = k);
    }
    if (fd > tol && far > 0) (keep[far] = 1), stack.push([s, far], [far, e]);
  }
  return pts.filter((_, k) => keep[k]);
}
const chaikin = (pts) => {
  const out = [];
  for (let k = 0; k < pts.length; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length];
    out.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
  }
  return out;
};
const ringArea = (pts) => Math.abs(pts.reduce((s, [x, y], k) => s + x * pts[(k + 1) % pts.length][1] - pts[(k + 1) % pts.length][0] * y, 0)) / 2;
const toFrame = ([gx, gy]) => [r5((X0 + gx * CELL) / SIZE), r5((Y0 + gy * CELL) / SIZE)];

// Label spot: the cell deepest inside the region (chamfer distance to the edge).
function labelPoint(a) {
  const d = new Float32Array(NX * NY);
  for (let k = 0; k < d.length; k++) d[k] = grid[k] === a ? 1e9 : 0;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i;
    if (!d[k]) continue;
    const up = j ? d[k - NX] : 0, left = i ? d[k - 1] : 0;
    d[k] = Math.min(d[k], up + 1, left + 1);
  }
  for (let j = NY - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) {
    const k = j * NX + i;
    if (!d[k]) continue;
    const down = j < NY - 1 ? d[k + NX] : 0, right = i < NX - 1 ? d[k + 1] : 0;
    d[k] = Math.min(d[k], down + 1, right + 1);
  }
  let best = -1, bk = 0;
  for (let k = 0; k < d.length; k++) if (d[k] > best) (best = d[k]), (bk = k);
  return toFrame([(bk % NX) + 0.5, Math.floor(bk / NX) + 0.5]);
}

// Neighbours (for colouring): areas whose cells touch.
const adj = new Map(areaNames.map((_, i) => [i + 1, new Set()]));
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
  const v = grid[j * NX + i];
  if (!v) continue;
  for (const [di, dj] of [[1, 0], [0, 1], [2, 0], [0, 2]]) {
    const ni = i + di, nj = j + dj;
    if (ni >= NX || nj >= NY) continue;
    const n = grid[nj * NX + ni];
    if (n && n !== v) adj.get(v).add(n), adj.get(n).add(v);
  }
}
const PALETTE = ["#FF6A55", "#FFC857", "#2EE6D0", "#9B7BFF", "#FF5FA2", "#A8E05F", "#5FB8FF", "#FF9F43"];
const colour = new Map();
for (const a of [...adj.keys()].sort((p, q) => adj.get(q).size - adj.get(p).size)) {
  const used = new Set([...adj.get(a)].map((n) => colour.get(n)));
  // Rotate the start so regions that do not touch still get varied colours.
  const order = PALETTE.map((_, k) => PALETTE[(k + a * 3) % PALETTE.length]);
  colour.set(a, order.find((c) => !used.has(c)) ?? order[0]);
}

const regions = [];
for (const [name, a] of areaIdx) {
  const rings = trace(a)
    .map((r) => simplify([...r, r[0]], 1.1).slice(0, -1))
    .filter((r) => r.length >= 3 && ringArea(r) >= MIN_CELLS)
    .map((r) => chaikin(chaikin(r)).map(toFrame));
  if (!rings.length) continue;
  regions.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, color: colour.get(a), label: labelPoint(a), rings });
}

// District labels: median of their points (inside Vice City and the larger towns).
const byDistrict = new Map();
for (const r of rows) {
  if (!r.district || !areaIdx.has(r.area) || /\d|Route|Hwy|Cswy|Blvd|St$|Dr$|Interstate/.test(r.district)) continue;
  const k = `${r.area}|${r.district}`;
  (byDistrict.get(k) ?? byDistrict.set(k, []).get(k)).push(r);
}
const median = (v) => v.sort((p, q) => p - q)[Math.floor(v.length / 2)];
const districts = [...byDistrict]
  .filter(([, list]) => list.length >= 8)
  .map(([k, list]) => {
    const [area, name] = k.split("|");
    return { name, area, label: [r5(median(list.map((r) => r.fx))), r5(median(list.map((r) => r.fy)))] };
  })
  .filter((d) => d.name !== d.area);

writeFileSync(join(OUT, "regions.json"), JSON.stringify({ source: "GTADB.org (CC BY 4.0), shapes derived by Six Star", regions, districts }));
const kb = (f) => Math.round(readFileSync(join(OUT, f)).length / 1024);
console.log(
  `places: ${places.length} (${places.filter((p) => p.unconfirmed).length} unconfirmed) ${kb("places.json")} KB\n` +
    `regions: ${regions.length} (${regions.reduce((s, r) => s + r.rings.reduce((t, x) => t + x.length, 0), 0)} vertices) ${kb("regions.json")} KB\n` +
    `districts: ${districts.length}\n` +
    regions.map((r) => `  ${r.name} ${r.color} rings=${r.rings.length}`).join("\n"),
);
