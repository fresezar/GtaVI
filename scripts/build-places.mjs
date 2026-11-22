#!/usr/bin/env node
// Map overlays: region shapes + labels, district labels and named places.
//   npm run build:places      (needs .cache/gtadb from `npm run tiles` and .cache/opengta6 from `npm run import:opengta6`)
// Output (static files, fetched by the map):
//   public/data/regions.json   { regions: [{ id, name, color, label, area, rings }], districts: [{ name, area, label }] }
//   public/data/places.json    [{ id, name, district, area, coord, type, unconfirmed }]
//
// Sources (both CC BY 4.0): GTADB landmarks (addresses "Name, District, Area") and Open GTA 6 Map (places and
// locations with their area, and the coastline traced from Rockstar's printable map). No source publishes area
// borders, so they are derived here, in four steps:
//   1. every 20 m cell of the map goes to the area of its nearest point (all sources together; no gaps),
//   2. the borders are smoothed on the grid (majority filter), specks merged into their neighbour,
//   3. each shared border is traced ONCE as an arc and smoothed once, so neighbours fit exactly (no slivers),
//   4. every region is cut to the real coastline, so shapes stop exactly at the shore.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import polygonClipping from "polygon-clipping";
import { readJson, PATHS, ROOT } from "./lib.mjs";

const GTADB = join(ROOT, ".cache", "gtadb", "map", "data", "6", "landmarks.json");
const OG6 = join(ROOT, ".cache", "opengta6");
for (const f of [GTADB, join(OG6, "land.json"), join(OG6, "places.json"), join(OG6, "locations.json")]) {
  if (!existsSync(f)) {
    console.error(`Missing ${f}: run \`npm run tiles\` and \`npm run import:opengta6\` first.`);
    process.exit(1);
  }
}
const OUT = join(ROOT, "public", "data");
mkdirSync(OUT, { recursive: true });

const SIZE = 32768; // metres across the frame
const HALF = SIZE / 2;
const UNIT = 32; // Open GTA 6 Map unit = 32 m (1024 units across)
const r5 = (v) => Math.round(v * 1e5) / 1e5;

// ---------------------------------------------------------------- area names
const FIX = { "Vice CIty": "Vice City", "Stafish Island": "Starfish Island", "Gellhorn International Raceway": "Port Gellhorn", "Port Gellhorn International Raceway": "Port Gellhorn" };
const SKIP = new Set(["", "Leonida", "Atlantic Ocean", "Gulf of Leonida", "Leonida Straits"]);
const REGION_CODE = {
  kalaga: "Mount Kalaga National Park",
  grassrivers: "Grassrivers",
  lummox: "Lummox County",
  kelly: "Kelly County",
  mariana: "Mariana County",
  leonard: "Leonard County",
  gellhorn: "Port Gellhorn",
  hamlet: "Hamlet",
  ambrosia: "Ambrosia",
  capri: "Capri",
  watson: "Watson Bay",
};
const canon = (a) => FIX[a] ?? a;

// ---------------------------------------------------------------- points (metres)
const BAD = /^(demolished|cancelled|\/\/doesnt|\/\/may-not-exist|\/\/duplicate|\/\/todo_not_here)/;
const gtadb = Object.values(JSON.parse(readFileSync(GTADB, "utf8")))
  .filter((a) => !(a[6] ?? []).some((t) => BAD.test(t)))
  .map((a) => {
    const parts = a[0].split(", ").map(canon);
    return {
      gid: String(a[7]),
      name: parts[0],
      district: parts.length >= 3 ? parts[parts.length - 2] : "",
      area: parts.length >= 2 ? parts[parts.length - 1] : "",
      x: a[1][0] + HALF,
      y: HALF - a[1][1],
      types: (a[6] ?? []).filter((t) => /^[a-z]/.test(t) && !/^l\d$/.test(t)),
      unconfirmed: (a[6] ?? []).includes("unconfirmed"),
    };
  });
const og6Places = JSON.parse(readFileSync(join(OG6, "places.json"), "utf8")).map((p) => {
  const parts = String(p.area ?? "").split(", ").filter(Boolean).map(canon);
  return { id: p.id, name: p.name, district: parts.length >= 2 ? parts[parts.length - 2] : "", area: parts[parts.length - 1] ?? "", x: p.x * UNIT, y: p.y * UNIT, kind: p.kind };
});
const og6Locs = JSON.parse(readFileSync(join(OG6, "locations.json"), "utf8")).map((l) => ({
  area: canon(l.area ?? REGION_CODE[l.region] ?? ""),
  x: l.x * UNIT,
  y: l.y * UNIT,
}));

const allSeeds = [...gtadb, ...og6Places, ...og6Locs].filter((s) => !SKIP.has(s.area));
const MIN_POINTS = 12;
const count = {};
for (const s of allSeeds) count[s.area] = (count[s.area] ?? 0) + 1;
const areaNames = Object.keys(count).filter((a) => count[a] >= MIN_POINTS).sort();
const areaIdx = new Map(areaNames.map((a, i) => [a, i + 1]));
const seeds = allSeeds.filter((s) => areaIdx.has(s.area)).map((s) => ({ x: s.x, y: s.y, a: areaIdx.get(s.area) }));

// ---------------------------------------------------------------- land (metres)
const landRaw = JSON.parse(readFileSync(join(OG6, "land.json"), "utf8"));
const land = landRaw.map((poly) => poly.map((ring) => ring.map(([x, y]) => [x * UNIT, y * UNIT])));
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const poly of land) for (const [x, y] of poly[0]) (minX = Math.min(minX, x)), (minY = Math.min(minY, y)), (maxX = Math.max(maxX, x)), (maxY = Math.max(maxY, y));

const CELL = 20;
const PAD = 400;
const X0 = Math.floor((minX - PAD) / CELL) * CELL;
const Y0 = Math.floor((minY - PAD) / CELL) * CELL;
const NX = Math.ceil((maxX + PAD - X0) / CELL);
const NY = Math.ceil((maxY + PAD - Y0) / CELL);
const N = NX * NY;

// Land mask by scanline (even-odd over all rings: outer rings and lake holes).
const landMask = new Uint8Array(N);
{
  const edges = [];
  for (const poly of land) for (const ring of poly) for (let k = 0; k < ring.length; k++) edges.push([ring[k], ring[(k + 1) % ring.length]]);
  const rows = Array.from({ length: NY }, () => []);
  for (const [[ax, ay], [bx, by]] of edges) {
    if (ay === by) continue;
    const lo = Math.min(ay, by), hi = Math.max(ay, by);
    const j0 = Math.max(0, Math.ceil((lo - Y0) / CELL - 0.5)), j1 = Math.min(NY - 1, Math.floor((hi - Y0) / CELL - 0.5));
    for (let j = j0; j <= j1; j++) {
      const y = Y0 + (j + 0.5) * CELL;
      if (y < lo || y >= hi) continue;
      rows[j].push(ax + ((y - ay) * (bx - ax)) / (by - ay));
    }
  }
  for (let j = 0; j < NY; j++) {
    const xs = rows[j].sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - X0) / CELL - 0.5)), i1 = Math.min(NX - 1, Math.floor((xs[k + 1] - X0) / CELL - 0.5));
      for (let i = i0; i <= i1; i++) landMask[j * NX + i] = 1;
    }
  }
}

// ---------------------------------------------------------------- 1. nearest area for every cell
const B = 400;
const buckets = new Map();
for (const s of seeds) {
  const k = `${Math.floor(s.x / B)},${Math.floor(s.y / B)}`;
  (buckets.get(k) ?? buckets.set(k, []).get(k)).push(s);
}
let grid = new Uint8Array(N);
// Weighted vote: every point within 3 sigma votes for its area with a Gaussian weight, so a few stray or
// mislabelled points cannot carve islands into a neighbour. Cells with no point that close take the nearest.
const SIGMA = 380;
const REACH = 3 * SIGMA;
const votes = new Float64Array(areaNames.length + 1);
for (let j = 0; j < NY; j++) {
  for (let i = 0; i < NX; i++) {
    const mx = X0 + (i + 0.5) * CELL, my = Y0 + (j + 0.5) * CELL;
    const bx = Math.floor(mx / B), by = Math.floor(my / B);
    const R = Math.ceil(REACH / B);
    votes.fill(0);
    let any = false;
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const list = buckets.get(`${bx + dx},${by + dy}`);
        if (!list) continue;
        for (const s of list) {
          const d2 = (s.x - mx) ** 2 + (s.y - my) ** 2;
          if (d2 > REACH * REACH) continue;
          votes[s.a] += Math.exp(-d2 / (2 * SIGMA * SIGMA));
          any = true;
        }
      }
    if (any) {
      let top = 0;
      for (let a = 1; a < votes.length; a++) if (votes[a] > votes[top]) top = a;
      grid[j * NX + i] = top;
      continue;
    }
    let best = Infinity, area = 0;
    for (let r = 0; r < 200; r++) {
      if (r > 0 && (r - 1) * B > Math.sqrt(best)) break;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const list = buckets.get(`${bx + dx},${by + dy}`);
          if (!list) continue;
          for (const s of list) {
            const d = (s.x - mx) ** 2 + (s.y - my) ** 2;
            if (d < best) (best = d), (area = s.a);
          }
        }
    }
    grid[j * NX + i] = area;
  }
}

// ---------------------------------------------------------------- 2. smooth borders, merge specks
function majority(radius, passes) {
  for (let pass = 0; pass < passes; pass++) {
    const next = grid.slice();
    const tally = new Uint16Array(areaNames.length + 1);
    for (let j = radius; j < NY - radius; j++)
      for (let i = radius; i < NX - radius; i++) {
        tally.fill(0);
        let top = grid[j * NX + i], topN = 0;
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            const v = grid[(j + dy) * NX + i + dx];
            if (++tally[v] > topN) (topN = tally[v]), (top = v);
          }
        next[j * NX + i] = top;
      }
    grid = next;
  }
}
majority(3, 3);

const MIN_CELLS = 400; // 0.16 km2
for (let round = 0; round < 4; round++) {
  const seen = new Uint8Array(N);
  let changed = 0;
  for (let start = 0; start < N; start++) {
    if (seen[start]) continue;
    const v = grid[start], stack = [start], comp = [];
    seen[start] = 1;
    const around = new Map();
    while (stack.length) {
      const c = stack.pop();
      comp.push(c);
      const i = c % NX, j = (c / NX) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) continue;
        const n = nj * NX + ni;
        if (grid[n] === v) {
          if (!seen[n]) (seen[n] = 1), stack.push(n);
        } else around.set(grid[n], (around.get(grid[n]) ?? 0) + 1);
      }
    }
    if (comp.length < MIN_CELLS && around.size) {
      const to = [...around].sort((p, q) => q[1] - p[1])[0][0];
      for (const c of comp) grid[c] = to;
      changed++;
    }
  }
  if (!changed) break;
}

// ---------------------------------------------------------------- 3. arcs: each shared border traced and smoothed once
const VX = NX + 1;
const vid = (x, y) => y * VX + x;
const cellAt = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NY ? 0 : grid[j * NX + i]);
// A vertex is a junction when 3+ different areas meet around it, or 4 edges meet (checkerboard).
function isJunction(x, y) {
  const s = new Set([cellAt(x - 1, y - 1), cellAt(x, y - 1), cellAt(x - 1, y), cellAt(x, y)]);
  if (s.size >= 3) return true;
  const a = cellAt(x - 1, y - 1), b = cellAt(x, y - 1), c = cellAt(x - 1, y), d = cellAt(x, y);
  return a === d && b === c && a !== b;
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [x1, y1] = pts[s], [x2, y2] = pts[e];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    let far = -1, fd = 0;
    for (let k = s + 1; k < e; k++) {
      const d = len < 1e-9 ? Math.hypot(pts[k][0] - x1, pts[k][1] - y1) : Math.abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / len;
      if (d > fd) (fd = d), (far = k);
    }
    if (fd > tol && far > 0) (keep[far] = 1), stack.push([s, far], [far, e]);
  }
  return pts.filter((_, k) => keep[k]);
}
/** Chaikin corner cutting with both ends pinned (arcs meet other arcs there). */
function chaikinOpen(pts, rounds) {
  let p = pts;
  for (let r = 0; r < rounds; r++) {
    if (p.length < 3) return p;
    const out = [p[0]];
    for (let k = 0; k < p.length - 1; k++) {
      const [ax, ay] = p[k], [bx, by] = p[k + 1];
      if (k > 0) out.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by]);
      if (k < p.length - 2) out.push([0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
function chaikinClosed(pts, rounds) {
  let p = pts;
  for (let r = 0; r < rounds; r++) {
    const out = [];
    for (let k = 0; k < p.length; k++) {
      const [ax, ay] = p[k], [bx, by] = p[(k + 1) % p.length];
      out.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    p = out;
  }
  return p;
}
const TOL = 1.4; // cells
const smoothArc = (verts) => chaikinOpen(simplify(verts, TOL), 2);

// Directed boundary edges per area (area on the right when walking: clockwise in screen space).
function traceRings(a) {
  const out = new Map();
  const add = (from, to) => (out.get(from) ?? out.set(from, []).get(from)).push(to);
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      if (grid[j * NX + i] !== a) continue;
      if (cellAt(i, j - 1) !== a) add(vid(i, j), vid(i + 1, j));
      if (cellAt(i + 1, j) !== a) add(vid(i + 1, j), vid(i + 1, j + 1));
      if (cellAt(i, j + 1) !== a) add(vid(i + 1, j + 1), vid(i, j + 1));
      if (cellAt(i - 1, j) !== a) add(vid(i, j + 1), vid(i, j));
    }
  const rings = [];
  for (const [startV, list] of out)
    while (list.length) {
      const ring = [startV];
      let v = list.pop();
      while (v !== startV) {
        ring.push(v);
        const nexts = out.get(v);
        if (!nexts?.length) break;
        // At a checkerboard vertex prefer the turn that keeps this area's cells together.
        v = nexts.length > 1 ? nexts.splice(pickTurn(ring[ring.length - 2], v, nexts), 1)[0] : nexts.pop();
      }
      if (ring.length >= 4) rings.push(ring);
    }
  return rings;
}
function pickTurn(prev, at, options) {
  const px = prev % VX, py = (prev / VX) | 0, ax = at % VX, ay = (at / VX) | 0;
  const inX = ax - px, inY = ay - py;
  // Right turn first (area on the right).
  let best = 0, bestScore = -9;
  options.forEach((o, k) => {
    const ox = (o % VX) - ax, oy = ((o / VX) | 0) - ay;
    const cross = inX * oy - inY * ox;
    const score = cross > 0 ? 2 : cross === 0 ? 1 : 0;
    if (score > bestScore) (bestScore = score), (best = k);
  });
  return best;
}

const arcCache = new Map(); // key "u>v" of the arc's first edge in canonical direction -> smoothed points (metres)
const toMetres = (id) => [X0 + (id % VX) * CELL, Y0 + ((id / VX) | 0) * CELL];
const junction = new Map();
const isJ = (id) => {
  if (!junction.has(id)) junction.set(id, isJunction(id % VX, (id / VX) | 0));
  return junction.get(id);
};
/** A ring (vertex ids) -> smoothed coordinates, re-using each shared arc in both directions. */
function smoothRing(ring) {
  const n = ring.length;
  const start = ring.findIndex(isJ);
  if (start < 0) {
    // A closed border with no junction (an enclave): both sides must smooth it identically, so start at the
    // smallest vertex id and walk one fixed direction, then give the result back in this ring's direction.
    const m = ring.indexOf(Math.min(...ring));
    let canon = [...ring.slice(m), ...ring.slice(0, m)];
    const flipped = canon[1] > canon[canon.length - 1];
    if (flipped) canon = [canon[0], ...canon.slice(1).reverse()];
    const key = `loop:${canon[0]}:${canon.length}`;
    let loop = arcCache.get(key);
    if (!loop) {
      loop = chaikinClosed(simplify([...canon, canon[0]].map((id) => [id % VX, (id / VX) | 0]), TOL).slice(0, -1), 2);
      arcCache.set(key, loop);
    }
    const pts = flipped ? [loop[0], ...loop.slice(1).reverse()] : loop;
    return pts.map(([x, y]) => [X0 + x * CELL, Y0 + y * CELL]);
  }
  const pts = [];
  let k = 0;
  while (k < n) {
    const seg = [ring[(start + k) % n]];
    do {
      k++;
      seg.push(ring[(start + k) % n]);
    } while (k < n && !isJ(ring[(start + k) % n]));
    const a = seg[0], b = seg[1];
    const key = a < b ? `${a}>${b}` : `${b}>${a}`;
    const fwdKey = `${seg[0]}|${seg[seg.length - 1]}|${key}`;
    let arc = arcCache.get(fwdKey);
    if (!arc) {
      const rev = arcCache.get(`${seg[seg.length - 1]}|${seg[0]}|${(() => {
        const c = seg[seg.length - 1], d = seg[seg.length - 2];
        return c < d ? `${c}>${d}` : `${d}>${c}`;
      })()}`);
      arc = rev ? rev.slice().reverse() : smoothArc(seg.map((id) => [id % VX, (id / VX) | 0]));
      arcCache.set(fwdKey, arc);
    }
    for (let q = 0; q < arc.length - 1; q++) pts.push([X0 + arc[q][0] * CELL, Y0 + arc[q][1] * CELL]);
  }
  return pts;
}

// ---------------------------------------------------------------- 4. cut to the coastline
const landGeom = land.map((poly) => poly.map((ring) => (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring : [...ring, ring[0]])));
const close = (r) => [...r, r[0]];

// Neighbours on land (for colours) and land cells per area (for label priority).
const landCells = new Map();
const adj = new Map(areaNames.map((_, i) => [i + 1, new Set()]));
for (let j = 0; j < NY; j++)
  for (let i = 0; i < NX; i++) {
    const c = j * NX + i;
    if (!landMask[c]) continue;
    const v = grid[c];
    landCells.set(v, (landCells.get(v) ?? 0) + 1);
    for (const [di, dj] of [[1, 0], [0, 1]]) {
      const ni = i + di, nj = j + dj;
      if (ni >= NX || nj >= NY) continue;
      const n = nj * NX + ni;
      if (landMask[n] && grid[n] !== v) adj.get(v).add(grid[n]), adj.get(grid[n]).add(v);
    }
  }
// Ten clearly different hues. Each area takes the colour furthest (in Lab space) from its coloured neighbours,
// so two touching areas never look alike; ties rotate through the palette for variety across the map.
const PALETTE = ["#FF7F6B", "#FFC94D", "#A78BFA", "#60A5FA", "#A3E635", "#2DD4BF", "#F472B6", "#FB923C", "#E879F9", "#94A3B8"];
function lab(hex) {
  const c = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((v) => (v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92));
  const x = (c[0] * 0.4124 + c[1] * 0.3576 + c[2] * 0.1805) / 0.95047, y = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722, z = (c[0] * 0.0193 + c[1] * 0.1192 + c[2] * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const LAB = new Map(PALETTE.map((c) => [c, lab(c)]));
const dist = (p, q) => Math.hypot(...LAB.get(p).map((v, k) => v - LAB.get(q)[k]));
const colour = new Map();
for (const a of [...adj.keys()].sort((p, q) => adj.get(q).size - adj.get(p).size)) {
  const near = [...adj.get(a)].map((n) => colour.get(n)).filter(Boolean);
  const used = (c) => [...colour.values()].filter((v) => v === c).length;
  let best = PALETTE[a % PALETTE.length], bestScore = -Infinity;
  for (const c of PALETTE) {
    // Far from the neighbours first; among good options prefer the colours used least so far.
    const sep = near.length ? Math.min(...near.map((n) => dist(c, n))) : 100;
    const score = Math.min(sep, 45) - 14 * used(c);
    if (score > bestScore) (bestScore = score), (best = c);
  }
  colour.set(a, best);
}

// Label: the land cell of the area furthest from its edge (or the coast).
function labelPoint(a) {
  const d = new Float32Array(N);
  for (let k = 0; k < N; k++) d[k] = grid[k] === a && landMask[k] ? 1e9 : 0;
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const k = j * NX + i;
      if (d[k]) d[k] = Math.min(d[k], (j ? d[k - NX] : 0) + 1, (i ? d[k - 1] : 0) + 1);
    }
  for (let j = NY - 1; j >= 0; j--)
    for (let i = NX - 1; i >= 0; i--) {
      const k = j * NX + i;
      if (d[k]) d[k] = Math.min(d[k], (j < NY - 1 ? d[k + NX] : 0) + 1, (i < NX - 1 ? d[k + 1] : 0) + 1);
    }
  let best = -1, bk = -1;
  for (let k = 0; k < N; k++) if (d[k] > best) (best = d[k]), (bk = k);
  if (bk < 0) return null;
  return [r5((X0 + ((bk % NX) + 0.5) * CELL) / SIZE), r5((Y0 + (Math.floor(bk / NX) + 0.5) * CELL) / SIZE)];
}

const regions = [];
for (const [name, a] of areaIdx) {
  if (!landCells.get(a)) continue;
  const rings = traceRings(a).map(smoothRing).filter((r) => r.length >= 3);
  if (!rings.length) continue;
  // Even-odd union of the traced rings = the area's polygon (outer rings and holes), then cut to land.
  let shape = polygonClipping.xor(...rings.map((r) => [[close(r)]]));
  shape = polygonClipping.intersection(shape, landGeom);
  const out = [];
  for (const poly of shape)
    for (const ring of poly) {
      const pts = ring.slice(0, -1).map(([x, y]) => [r5(x / SIZE), r5(y / SIZE)]);
      if (pts.length >= 3) out.push(pts);
    }
  if (!out.length) continue;
  const label = labelPoint(a);
  if (!label) continue;
  regions.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    color: colour.get(a),
    label,
    area: Math.round(((landCells.get(a) ?? 0) * CELL * CELL) / 1e4) / 100, // km2
    rings: out,
  });
}
regions.sort((p, q) => q.area - p.area);

// District labels: median of their points, moved onto land when the median falls in water.
const byDistrict = new Map();
for (const r of [...gtadb, ...og6Places]) {
  if (!r.district || !areaIdx.has(r.area) || /\d|Route|Hwy|Cswy|Blvd|St$|Dr$|Interstate/.test(r.district) || r.district === r.area) continue;
  const k = `${r.area}|${r.district}`;
  (byDistrict.get(k) ?? byDistrict.set(k, []).get(k)).push(r);
}
const median = (v) => v.sort((p, q) => p - q)[Math.floor(v.length / 2)];
function onLand(x, y) {
  const i = Math.floor((x - X0) / CELL), j = Math.floor((y - Y0) / CELL);
  if (landMask[j * NX + i]) return [x, y];
  for (let r = 1; r < 40; r++)
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        const c = (j + dj) * NX + (i + di);
        if (landMask[c]) return [X0 + (i + di + 0.5) * CELL, Y0 + (j + dj + 0.5) * CELL];
      }
  return [x, y];
}
const districts = [...byDistrict]
  .filter(([, list]) => list.length >= 8)
  .map(([k, list]) => {
    const [area, name] = k.split("|");
    const [x, y] = onLand(median(list.map((r) => r.x)), median(list.map((r) => r.y)));
    return { name, area, label: [r5(x / SIZE), r5(y / SIZE)] };
  });

// ---------------------------------------------------------------- places: named spots not already pins
const pins = readJson(PATHS.pins);
const pinned = new Set(pins.flatMap((p) => (p.tags ?? []).filter((t) => t.startsWith("gtadb:")).map((t) => t.slice(6))));
const pinXY = pins.filter((p) => p.coord).map((p) => [p.coord[0] * SIZE, p.coord[1] * SIZE]);
const nearPin = (x, y) => pinXY.some(([px, py]) => Math.abs(px - x) < 30 && Math.abs(py - y) < 30);
const TYPE = ["hotel", "restaurant", "retail", "transportation", "leisure", "government", "events", "industrial", "utilities", "landmark", "natural", "residential", "office", "public"];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const kept = [];
const seenName = new Map();
const keep = (p) => {
  const key = norm(p.name);
  const same = seenName.get(key) ?? [];
  if (same.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 60)) return;
  same.push([p.x, p.y]);
  seenName.set(key, same);
  kept.push(p);
};
for (const r of gtadb) {
  if (!r.name || r.name.startsWith("?") || pinned.has(r.gid) || nearPin(r.x, r.y)) continue;
  keep({ id: `place_${r.gid}`, name: r.name, district: r.district, area: r.area, x: r.x, y: r.y, type: TYPE.find((t) => r.types.includes(t)) ?? "", unconfirmed: r.unconfirmed });
}
for (const p of og6Places) {
  if (!p.name || nearPin(p.x, p.y)) continue;
  keep({ id: `place_og6_${p.id}`, name: p.name, district: p.district, area: p.area, x: p.x, y: p.y, type: p.kind === "hotel" ? "hotel" : "", unconfirmed: false });
}
const places = kept.map(({ x, y, ...p }) => ({ ...p, coord: [r5(x / SIZE), r5(y / SIZE)] }));

writeFileSync(
  join(OUT, "regions.json"),
  JSON.stringify({ source: "GTADB.org and Open GTA 6 Map (CC BY 4.0); outlines derived by Six Star", regions, districts }),
);
writeFileSync(join(OUT, "places.json"), JSON.stringify(places));

const landTotal = landMask.reduce((s, v) => s + v, 0);
const covered = [...landCells].filter(([a]) => regions.some((r) => r.name === areaNames[a - 1])).reduce((s, [, n]) => s + n, 0);
const kb = (f) => Math.round(readFileSync(join(OUT, f)).length / 1024);
console.log(
  `seeds: ${seeds.length} points in ${areaNames.length} areas\n` +
    `regions: ${regions.length}, land covered ${((covered / landTotal) * 100).toFixed(1)}%, ${kb("regions.json")} KB\n` +
    `districts: ${districts.length}\nplaces: ${places.length} (${places.filter((p) => p.unconfirmed).length} unconfirmed), ${kb("places.json")} KB\n` +
    regions.map((r) => `  ${r.name.padEnd(34)} ${String(r.area).padStart(6)} km2  ${r.color}  rings=${r.rings.length}`).join("\n"),
);
