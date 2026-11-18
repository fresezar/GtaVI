# CONTEXT: project hand-off (read first)

Unofficial player companion site for the open-world game launching 2026-11-19: interactive map, checklists, guides.
Owner works solo; Claude acts as product manager + architect. Replies: concise, direct, plain Turkish (no language mixing); flag risks and the weakest link on decisions.

## Goals
1. Growing community (Discord, short-form video, streamers). 2. Ad revenue. Subscription later (Phase 2/3).
Revenue/time-to-market beats polish. Flag work with no path to revenue.

## Hard rules
- Domain sixstargta.com, brand "Six Star" (2026-11-18, founder's choice). No GTA logo or "GTA" in the visual brand; never look official. Always show the "unofficial" disclaimer (`src/config/site.ts`).
- Pin IDs are immutable (`pin_<ULID>`); progress is keyed on them. Never delete content: `status: "deprecated"`.
- Coordinates are normalized 0..1. Text lives in `src/i18n` by key convention; data has no language.
- User data only through `StorageAdapter`. Completion % is computed, never stored.
- Paywalls only via `src/config/entitlements.ts` feature keys.
- New data starts `unverified`; AI-collected data needs a source URL + confidence and stays unverified until confirmed (verified = 2 independent sources or community).
- No copying other sites' text (facts only, original wording). No leaked/stolen pre-release material.
- Copyright: no self-imposed rule (2026-11-17). Official art is used with a "© Rockstar Games" credit; `SITE.officialArt=false` removes it all at once. No GTA VI logo as decoration (looks official).

## Stack and status (Phase 1 done)
Next.js (App Router) + TypeScript + Tailwind 3 + Leaflet (CRS.Simple). No backend.
Done: domain types, map with filters/progress, `?dev=true` click-to-copy pin tool, checklists synced with map, static export (`npm run build:static` -> `out/`), dark theme.
Data is SAMPLE ONLY until the first real pin (automatic switch), placeholder map SVG.
See `docs/ARCHITECTURE.md`, `docs/DATA_SCHEMA.md`, `docs/PROJECT_BRIEF.md`.

## Data pipeline (ready for launch, 2026-11-17)
Sezar enters pins in the site's own form at `/map?dev=true` (click map, fill, add, "CSV indir") and drops the CSV
in `inbox/` (or a Google Sheet CSV from `content/import-template.csv`); Claude runs
`npm run import:pins -- file.csv` (dry run), then `--write`, `npm run validate`, build, deploy. Guide: `docs/INGEST.md`.
Content is JSON in `content/`. 12 categories (story/side missions, activities, collectibles, stunt jumps, random events,
rare vehicles, easter eggs, weapon pickups, safehouses, shops, landmarks); add/remove after launch.
Map: community map first (chosen in the first 2 days after launch by what the market adopts; permission + attribution),
our own later; switching maps = calibration, pins untouched. Until the map exists, finds are published WITHOUT coord
(`Pin.coord` optional: pin page + checklists + progress, skipped on the map); re-sending the same row with a coord places it.
Entry tool also has "Hızlı not" (link + time + note = draft) and opens rows from the list to finish/place them.
Search engines on (`SITE.indexable=true`) since the domain went live; OG image `public/og.jpg` (`npm run media`).
Social: TikTok only for now (one short per find).

Map UX: tapping a pin opens `src/features/map/PinCard.tsx` (not a Leaflet popup); `?pin=<id>` mirrors the selection.
News: `/news` (+ `/tr/news`) from `content/news.json`; Claude writes original summaries from links Sezar sends.

## Run
`npm install` then `npm run dev` (http://localhost:3000). Dev capture tool: `/map?dev=true`.
Checks: `npm run typecheck`, `npm run validate`, `npm run build`, `npm run build:static`.

## Decisions made
Full, dated log: `docs/DECISIONS.md` (record every accepted proposal there). Ideas: `docs/BACKLOG.md`. Competitors: `docs/COMPETITORS.md`.
- Scope: everything GTA VI over the years, community + online focus; the map is only the start. Compete at least at rival level, always fresh.
- Visual identity: LeonidaMap-like hub with a neon-sunset look, single dark theme, official art with credit, own SVG scene as fallback via `SITE.officialArt` (2026-11-17, done). Originals stay untracked in `media-src/`; `npm run media` writes `public/media/`.
- Language: EN + TR (done 2026-11-17). EN at root, TR under `/tr/`; thin route files in `src/app` and `src/app/tr` call shared views in `src/views/` with a `locale`. UI text: `src/i18n/ui.en.ts` + `ui.tr.ts` (TR is type-checked complete). Client components use `useT()` / `useHref()` from `src/i18n/client.tsx`. Social media: one English account only.
- Revenue: decided later by product quality/scope; donations first.
- Domain: sixstargta.com (+ www), brand "Six Star" (2026-11-18). No backup domain bought.
- Hosting: Cloudflare Workers Static Assets (not Pages), static export, `wrangler.jsonc`, Worker name `atlas` (internal name, kept). workers.dev disabled.
- Ads: after traffic exists; check current ad-network thresholds before applying.

## Next
1. Live: https://sixstargta.com (Cloudflare account theshamsfr; GitHub fresezar). Deploy: `npm run deploy`.
   Optional: connect the repo to Workers Builds (Worker name must stay `atlas`) for auto-deploy on push.
2. Done: analytics, robots, OG image, domain.
3. Launch day: real map art + pins from streamers via dev tool; each pin -> short video.
4. Phase 2: vehicle/weapon DB (stats carry method + sample size), economy calculators, ads, accounts/Supabase.
