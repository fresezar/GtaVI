# CONTEXT: project hand-off (read first)

Unofficial player companion site for the open-world game launching 2026-11-19: interactive map, checklists, guides.
Owner works solo; Claude acts as product manager + architect. Replies: concise, direct, Turkish with light English; flag risks and the weakest link on decisions.

## Goals
1. Growing community (Discord, short-form video, streamers). 2. Ad revenue. Subscription later (Phase 2/3).
Revenue/time-to-market beats polish. Flag work with no path to revenue.

## Hard rules
- No game/character trademarks in domain or brand (`gta`, `vice`, `leonida`...). Always show the "unofficial" disclaimer (`src/config/site.ts`).
- Pin IDs are immutable (`pin_<ULID>`); progress is keyed on them. Never delete content: `status: "deprecated"`.
- Coordinates are normalized 0..1. Text lives in `src/i18n` by key convention; data has no language.
- User data only through `StorageAdapter`. Completion % is computed, never stored.
- Paywalls only via `src/config/entitlements.ts` feature keys.
- New data starts `unverified`; AI-collected data needs a source URL + confidence and stays unverified until confirmed (verified = 2 independent sources or community).
- No copying other sites' text (facts only, original wording). No leaked/stolen pre-release material.
- Do not add Rockstar/Take-Two images without checking their fan-content policy.

## Stack and status (Phase 1 done)
Next.js (App Router) + TypeScript + Tailwind 3 + Leaflet (CRS.Simple). No backend.
Done: domain types, map with filters/progress, `?dev=true` click-to-copy pin tool, checklists synced with map, static export (`npm run build:static` -> `out/`), dark theme.
Data is SAMPLE ONLY (tag `sample`, placeholder map SVG). Replace after launch.
See `docs/ARCHITECTURE.md`, `docs/DATA_SCHEMA.md`, `docs/PROJECT_BRIEF.md`.

## Run
`npm install` then `npm run dev` (http://localhost:3000). Dev capture tool: `/map?dev=true`.
Checks: `npm run typecheck`, `npm run build`, `npm run build:static`.

## Decisions made
- Visual identity: 80s Florida brochure (cream/coral/turquoise, thick borders, offset shadows). Avoid generic AI-site look.
- Language: English only at launch; i18n ready. Add a language only when it reaches ~10% of traffic.
- Domain: undecided (candidates considered: amirvc.com preferred over viceamir.com for trademark safety). Final brand after launch.
- Hosting: Cloudflare Workers Static Assets (not Pages), static export, `wrangler.jsonc`, Worker name `atlas`. Decided 2026-11-17.
- Ads: after traffic exists; check current ad-network thresholds before applying.

## Next
1. Pushed to GitHub (`fresezar/GtaVI`). Deploy to Cloudflare Workers, set `NEXT_PUBLIC_SITE_URL`.
2. Analytics (Cloudflare Web Analytics), robots, OG image.
3. Launch day: real map art + pins from streamers via dev tool; each pin -> short video.
4. Phase 2: vehicle/weapon DB (stats carry method + sample size), economy calculators, ads, accounts/Supabase.
