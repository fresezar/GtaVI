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
docs/                     this file, DATA_SCHEMA.md
```

## Rules that keep "zero-refactor" true
1. IDs are immutable (`pin_<ULID>`); slugs may change. Progress is keyed on IDs.
2. Content never deleted: `status: "deprecated"`.
3. Coordinates are normalized 0..1: changing map image/tiles never moves pins.
4. Text lives in i18n by key convention (`pin.<id>.title`, `category.<id>.name`); data has no language.
5. User data only through `StorageAdapter`. Completion % is computed, never stored.
6. Paywalls via `config/entitlements.ts` feature keys, never plan-name checks.
7. Official `Pin` and personal `UserMarker` are separate types.

## Add a pin (stream workflow)
1. Open `/map?dev=true`. Pick category (keys 1-9), optionally source/credit.
2. Click the map: pin JSON is on the clipboard. `C` re-copies, `Z` undoes.
3. Paste into `src/data/pins.ts`; paste the i18n lines into `src/i18n/en.ts` (`pins` object).
4. Commit. New pins start `unverified` (dashed outline) until confirmed.

## Swap in real map art
- Single image: put it in `public/maps/`, set `source.url`, set `imageSize`.
- Tiles: `source: { kind: "tiles", urlTemplate: "/tiles/main/{z}/{x}/{y}.png", tileSize: 256, minNativeZoom: 0, maxNativeZoom: N }`,
  `imageSize` = full-res size at zoom N. XYZ scheme (y down). Not yet tested with real tiles.

## Known gaps / next
- Sample data is fake (tag `sample`). Delete before launch.
- Backup/restore uses `window.prompt` (fine for MVP).
- No service worker yet (manifest only): add offline caching after launch.
- Ads, analytics: not started.

## Deploy (Cloudflare Pages, static)
`npm run build:static` -> `./out` (plain files). Set `NEXT_PUBLIC_SITE_URL` to the real domain before building (sitemap/metadata use it).
Tested: static export serves all routes; checklists and map share progress both ways.
Pages needs: build command `npm run build:static`, output dir `out`. Verify current Pages settings at deploy time.
