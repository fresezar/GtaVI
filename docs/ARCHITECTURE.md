# Architecture (v0.1)

Stack: Next.js (App Router) · TypeScript · Tailwind 3 · Leaflet (CRS.Simple). No backend yet.

## Directory tree
```
src/
  app/                    routes only (thin); one folder per product area
    page.tsx              landing
    map/                  [F1] interactive map
    pins/[slug]/          [F1] one static page per pin (SEO + ad pageviews)
    checklists/           [F1] checklist index + [slug] pages
    guides/               [F1/F2] stub (.gitkeep)
    vehicles/ economy/    [F2] stubs
    minigames/ contribute/ account/   [F3] stubs
    manifest.ts sitemap.ts layout.tsx globals.css
  domain/                 pure TypeScript types, no logic, no React
  data/                   official content as typed literals (git = source of truth)
  i18n/                   en.ts (+ future locales), key helpers, t()
  storage/                StorageAdapter interface + LocalStorageAdapter (swap for Supabase)
  config/                 site.ts, entitlements.ts (plan -> feature flags)
  lib/                    framework-free helpers (progress math, ulid, clipboard)
  hooks/                  shared React hooks (useProgress)
  features/               one folder per product area: components + hooks
    map/                  MapExplorer, MapView, projection, DevPanel, dev/ (capture tool)
    checklists/           ChecklistView, ChecklistIndex
    vehicles/ economy/ minigames/ community/ account/   (future)
  components/ui/          shared primitives (future)
public/maps/              map artwork (placeholder.svg for now)
content/                  OFFICIAL DATA (JSON): pins.json, categories.json, text.en.json, import-template.csv
scripts/                  import-pins.mjs (table -> content), validate-content.mjs (runs before every build)
docs/                     this file, DATA_SCHEMA.md, INGEST.md (data workflow, Turkish)
```
`src/data/*.ts` are thin typed loaders over `content/`. Checklists are generated from pins (`src/data/checklists.ts`).
No real pins = SAMPLE_MODE (placeholder pins/checklist); the first real pin switches everything to real data.

## Rules that keep "zero-refactor" true
1. IDs are immutable (`pin_<ULID>`); slugs may change. Progress is keyed on IDs.
2. Content never deleted: `status: "deprecated"`.
3. Coordinates are normalized 0..1: changing map image/tiles never moves pins.
4. Text lives in i18n by key convention (`pin.<id>.title`, `category.<id>.name`); data has no language.
5. User data only through `StorageAdapter`. Completion % is computed, never stored.
6. Paywalls via `config/entitlements.ts` feature keys, never plan-name checks.
7. Official `Pin` and personal `UserMarker` are separate types.

## Add pins
Main path: table -> `npm run import:pins -- file.csv [--write]` -> `npm run validate`. Full guide: `docs/INGEST.md`.
`/map?dev=true` copies a coordinate (`x, y`) per click for the table's `coord` column (keys 1-0 pick category).
"Copy as: Pin JSON" remains for one-off manual edits of `content/pins.json` + `content/text.en.json`.

## Map art and calibration
- Single image: put it in `public/maps/`, set `source.url`, `imageSize`, and `attribution` for community art.
- Tiles: `source: { kind: "tiles", urlTemplate: "/tiles/main/{z}/{x}/{y}.png", tileSize: 256, minNativeZoom: 0, maxNativeZoom: N }`,
  `imageSize` = full-res size at zoom N. XYZ scheme (y down). Not yet tested with real tiles.
- Pins live in the frame of the first real map. A later image with other borders/scale gets `calibration`
  (3+ control points from the dev "Calibrate map" tool, Landmarks pins); `src/lib/affine.ts` fits a least-squares
  affine transform, so pins are never edited. Click handling bounds-checks image coords, saves frame coords.

## Known gaps / next
- Sample data is fake (tag `sample`); it disappears automatically with the first real pin.
- Regions: `pin.region` exists but there is no region filter or region data yet.
- Backup/restore uses `window.prompt` (fine for MVP).
- No service worker yet (manifest only): add offline caching after launch.
- Ads, analytics: not started.

## Deploy (Cloudflare Workers Static Assets)
Chosen over Pages (2026-11-17): Cloudflare recommends Workers Static Assets for new static sites; Pages gets no new features.
`npm run build:static` -> `./out` (plain files); `wrangler.jsonc` serves `./out` with no Worker script.
Set `NEXT_PUBLIC_SITE_URL` to the public URL before building (sitemap/metadata use it).
Tested: static export serves all routes; checklists and map share progress both ways; `wrangler deploy --dry-run` passes.
Workers Builds (Git): build command `npm run build:static`, deploy command `npx wrangler deploy`, build env var `NEXT_PUBLIC_SITE_URL`.
Worker name must stay trademark-free (it becomes a public `*.workers.dev` URL).
