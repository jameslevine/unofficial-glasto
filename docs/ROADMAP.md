# Unofficial Glasto — Roadmap

## Project Overview

An offline-first companion app for Glastonbury Festival on web (Vite + React) and mobile (Expo / React Native), backed by an AWS serverless API. Users browse the lineup (music + non-music sessions like yoga, theatre, talks), favourite acts, build a personal schedule, see walking times between stages, and look artists up on Spotify before they go.

Until the 2026 lineup is announced, the app ships with archive data from 2022–2025 so users can experience the full UX before the real schedule drops.

## Goals & Success Criteria

- App fully usable on a phone in the Worthy Farm signal black-hole (offline-first).
- Lineup browse, search, and favourites all work in airplane mode after first sync.
- Web and mobile share the same data layer; favourites can sync across devices via optional Cognito sign-in.
- Map shows site layout with stage pins; favouriting two acts shows realistic walking time between them.
- Scraper picks up the official 2026 lineup automatically once published.

## Tech Stack (summary)

See [`TOOLS_AND_TECH.md`](TOOLS_AND_TECH.md) for the full list.

- Web: Vite + React + TypeScript + Tailwind + Mapbox GL JS
- Mobile: Expo SDK + Expo Router + React Native Paper + `@rnmapbox/maps`
- Backend: Node.js (TS) + Express + AWS Lambda + API Gateway
- Data: DynamoDB single-table; scheduled scraper Lambda
- Auth: Optional Amazon Cognito sign-in
- Hosting: S3 + CloudFront (web), EAS Build (mobile)

## Phased Milestones

### Phase 0 — Foundation 🟢 Complete

- [x] `docs/` folder populated
- [x] Monorepo (`packages/`, `backend/`, `scraper/`, `infrastructure/`) — `apps/web` + `apps/mobile` deferred to phases 2/3
- [x] ESLint + Prettier + TypeScript + Husky + commitlint
- [x] Git initialised with first commit
- [x] CI pipeline (`ci.yml`)
- [x] Quality gates verified (lint, typecheck, format, tests all passing)

### Phase 1 — Data Pipeline + API 🟢 Complete

- [x] DynamoDB single-table CloudFormation
- [x] Express + Lambda backend with `/lineup/:year`, `/stages`
- [x] TypeScript scraper for `glastonburyfestivals.co.uk`
- [x] Seed data committed for 2022–2025
- [x] Spotify Client Credentials integration at ingest
- [x] DDB seed loader (`scripts/load-seeds.ts`) for first deploy
- [x] Deployed to dev env; smoke-tested `/v1/lineup/{2022..2025}` (3148/3667/3935/4023) and `/v1/stages` (121)

### Phase 2 — Web MVP 🟢 Complete

- [x] Vite + React app shell with Tailwind design tokens
- [x] Lineup browse, search, day/area filters
- [x] Local favourites (Zustand + localStorage)
- [x] TanStack Query + IndexedDB cache persister (offline-on-revisit)
- [x] Service Worker + offline cache via Vite PWA plugin (full offline shell)
- [x] Deployed to S3 + CloudFront — <https://d5zgsiw27b3ju.cloudfront.net>

### Phase 3 — Mobile MVP 🟢 Complete

- [x] Expo app shell with Expo Router (file-based routing under `apps/mobile/app/`)
- [x] Reuse `packages/shared` query hooks (`useLineup` etc.)
- [x] AsyncStorage-persisted query cache (see [ADR-007](DECISIONS.md))
- [x] Lineup browse, search, day/area filter, favourites screens
- [x] Verified on iOS simulator (iPhone 17 Pro / iOS 26.3) via Expo dev client + Metro
- [ ] EAS preview build (deferred — not blocking ongoing development)

### Phase 4 — Spotify + Artist Pages 🟢 Complete

- [x] `/artists/:slug` lazy-resolves via Spotify Client Credentials and caches to DDB (30-day TTL)
- [x] Web artist detail page (`/artists/:slug`) with Spotify embed iframe + deep-link
- [x] Mobile artist detail screen (`app/artists/[slug].tsx`) with image + Spotify deep-link
- [x] Offline fallback (cached metadata + deep-link; embed-only when API top-tracks blocked)
- [x] PerformanceCards link title → artist page on web + mobile

### Phase 5 — Map + Walking Times 🟢 Complete

- [x] Mapbox `outdoors-v12` style (custom style deferred — outdoors-v12 reads well at zoom 14-18)
- [x] Stage pins on web (Mapbox GL JS, lazy-loaded) + mobile (`@rnmapbox/maps@10.1.38`)
- [x] Walking time estimates between consecutive favourites within a day (great-circle × 1.4 ÷ 5 km/h)
- [x] Web Service Worker raises Workbox precache limit to 4MB so the Mapbox chunk is precached
- [x] Mobile native `@rnmapbox/maps` rebuild via `eas build --profile development` (verified in iOS simulator)
- [x] Mobile offline tile pack (`OfflineManager.createPack` for Worthy Farm bbox, zoom 13–18)

### Phase 6 — Cognito + Sync 🟢 Complete

- [x] Cognito user pool + Hosted UI domain (`glasto-dev-563146874500.auth.us-east-1.amazoncognito.com`)
- [x] `/me/favourites` + `/me/sync` endpoints (last-write-wins via DDB conditional write)
- [x] Web PKCE OAuth2 + sync-on-sign-in
- [x] Mobile PKCE via `expo-auth-session` + tokens in `expo-secure-store` + sync-on-sign-in
- [x] Cross-device favourites verified end-to-end (Browser A → server → Browser B fresh state)

### Phase 7 — Polish + 2026 Readiness ♻ Folded into Phase 8/9/10 Definition of Done

WCAG 2.1 AA, perf budgets, and i18n scaffolding are now per-PR gates baked into every Phase 8/9/10 feature rather than a standalone retrofit phase. Scheduled scraper validation against the 2026 lineup remains a one-off task triggered when the lineup drops.

### Phase 8 — Planning Tool 🟢 Complete

- [x] M8.1 — `ArtistSummary` shared type + `pickPreviewTrack`/`topGenres` utils + `useArtistSummary` hook
- [x] M8.1 — Backend `GET /v1/artists/summary?year=YYYY` (BatchGet artists, server-picked previewUrl)
- [x] M8.1 — Genre chip rows on web (URL-syncable `?g=`) + mobile lineup screen
- [x] M8.2 — `buildSchedule` + `detectConflicts` shared utils with unit tests
- [x] M8.2 — Web `/favourites` swap to `ScheduleTimeline` with conflict styling
- [x] M8.2 — Mobile `favourites.tsx` swap to schedule view + store v3 migration
- [x] M8.3 — Web + mobile `useAudioPreview` zustand singletons (HTMLAudioElement / expo-av)
- [x] M8.3 — `PlayPreviewButton` wired into lineup cards, schedule rows, and artist pages
- [x] M8.4 — Shared `buildIcs` (RFC 5545 + Europe/London VTIMEZONE) + Google Calendar template URL
- [x] M8.4 — Web `ExportButton` (per-page) + per-row `AddToCalendarButton` (.ics + Google fallback)
- [x] M8.4 — Mobile share-sheet via `expo-file-system` + `expo-sharing` (per-row + per-page)

### Phase 9 — On-Site Usefulness 🟡 In Progress (closing out)

- [x] Now/next pinning above the schedule when festival is live
- [x] Full POI map layer — 1,107 POIs across 33 categories from `Jonty/glastonbury-app-data` 2025 dataset (toilets, water, food, medical, info, ATM, accessibility, …)
- [x] "My pin" for tent / meet-up — long-press on web/mobile map to drop, edit/delete callout, multi-pin Cognito sync via `/v1/me/pins` with real-time dirty-id push (no reload required)
- [→] GPS routing — promoted to **Phase 11** with upgraded scope (festival-map-traced graph, raster overlay, 2026 OTA unlock).
- [✗] Push notifications — **dropped from this version.** Re-evaluate post-festival.
- [✗] Battery saver mode — **dropped as a feature.** Replaced by sensible defaults (no background polling, GPS rate-limit when battery <20%) folded into Phase 11.D.

---

## Reframe (2026-05-25)

After Phase 9, the roadmap was reshaped:

- **Audience:** public App Store + Play Store release, mobile-only.
- **Web:** parked. No further investment. Stays deployed as-is.
- **Job-to-be-done:** plan-and-pivot pre-festival (existing surfaces, polished in-stream as issues are found), navigate-and-survive on-site (new work in Phases 10–13).
- **Capacity not the constraint, scope is.** No hard freeze; build ordering favours starting external-dependency tracks (Phase 13) immediately and keeping the routing data-build (Phase 11.A/B cartography) parallel to the UI overhaul (Phase 10).
- **Three ADRs underpin the on-site loop:** [ADR-0011](adr/0011-festival-map-raster-overlay.md) (festival raster overlay), [ADR-0012](adr/0012-routing-graph-from-festival-map.md) (path graph traced from festival map), [ADR-0013](adr/0013-2026-data-driven-unlocks-and-ota-raster.md) (2026 unlocks data-driven, raster ships via OTA).

### Phase 10 — Mobile UI Overhaul 🔴 Not Started

Visual refresh in the [appkart-hotel-booking](https://themes.pixelstrap.net/pwa/appkart/hotel-booking/index.html) direction. Pinterest-board approach: the theme is a reference, not a codebase. Lift visual language only; IA unchanged.

- [ ] 10.1 — Token extraction: palette, typography stack, spacing scale, radii, shadows, icon set into `packages/shared` design tokens consumable by RN Paper + Tailwind.
- [ ] 10.2 — Component refresh: cards, buttons, inputs, list rows, headers — RN Paper theming + custom components where Paper falls short.
- [ ] 10.3 — Screen-by-screen restyle: lineup, schedule, favourites, artist, map, settings.
- [ ] 10.4 — Hero-image slots specced with explicit _no-image fallback design_ baked in from day one. AI-generated imagery slots in later as a content drop and never blocks build.

### Phase 11 — On-Site Loop 🔴 Not Started

The festival-week navigation experience. Per [ADR-0011](adr/0011-festival-map-raster-overlay.md), [ADR-0012](adr/0012-routing-graph-from-festival-map.md), [ADR-0013](adr/0013-2026-data-driven-unlocks-and-ota-raster.md).

- [ ] **11.A — Routing engine.** Hand-traced GeoJSON path graph (per festival year), client-side A\* router, polyline render. 2022–2025 buildable now from published festival maps; 2026 graph builds when the festival publishes their site map.
- [ ] **11.B — Festival map raster overlay.** Festival's official PDF → tile pyramid → bundled as Mapbox raster source. Same georeferencing transform as the routing graph (single source of truth). Per-year, server-fetched.
- [ ] **11.C — 2026 unlock infrastructure.** Two independent gates (`lineup-available-2026`, `map-available-2026`). App data-driven: lineup unlocks when API serves 2026; map+routing unlocks when raster + path graph are uploaded. Until then, 2026 shows an explicit "details pending" state. Year picker defaults to most-recent-with-data.
- [ ] **11.D — On-site UX details.**
  - "What's next?" sticky pinned header — visible on every screen during festival, shows next favourite + walk time + tap-to-route.
  - 56pt+ hit-area pass on primary actions (route, favourite, pin).
  - State restoration (screen + scroll + filters) verified across cold-launch.
  - Haptic feedback on pin drop, favourite toggle, route lock.
  - Sensible battery defaults: no background polling, GPS rate-limit when battery <20%.

### Phase 12 — Offline Robustness 🔴 Not Started

Audit-led, defensive. Run on a stable codebase (after Phases 10–11 settle).

- [ ] **12.A — Cold-airplane-mode audit on a real iPhone.** Walk every flow with no signal. File issues for every breakage.
- [ ] **12.B — Stale-data UX.** "Last synced X ago" affordances. Distinguish cached-with-content from no-content. Manual refresh actions.
- [ ] **12.C — Map / tile-pack robustness.** Tile pack expiry, eviction, recovery. Festival raster fallback when OTA bundle unavailable. Confirm offline coverage at the right zoom levels (13–18 for site, lower zooms for context).
- [ ] **12.D — Crash resilience.** Defensive cache reads, error boundaries on every screen, "something went wrong" fallbacks. Survive cache corruption, expired tokens, 404s on previously-cached entities.

### Phase 13 — Public Release 🟡 Track running in parallel

External-dependency-heavy; start now.

- [x] Apple Developer + Google Play Developer accounts ready.
- [ ] 13.1 — App icons + splash (both platforms, all sizes).
- [ ] 13.2 — App Privacy answers (Apple) + Data Safety form (Google).
- [ ] 13.3 — Marketing screenshots (6.7" + 6.5" required), description, keywords.
- [ ] 13.4 — First TestFlight + Play Internal Track build, real-device QA loop.
- [ ] 13.5 — Public store submission. Patch releases via OTA where possible, store updates where required.

### Dropped from this version

- Push notifications.
- Battery saver as a feature (replaced by sensible defaults in 11.D).
- Offline write outbox / conflict resolution.
- Background-fetch when connectivity returns.
- Web overhaul (web parked entirely).
- Phase 10's previous social/discovery content (group overlap, recommendations, share schedule, etc.) — see _Post-festival v2 candidates_ below.

### Post-festival v2 candidates (not committed)

- AI-styled map alternative (replaces bundled festival raster if [ADR-0011](adr/0011-festival-map-raster-overlay.md) IP risk materialises).
- Push notifications.
- Web revival or formal deprecation.
- Social: share schedule, group overlap, recommendations, lineup change feed, alt music platforms (Apple/YouTube/Tidal), setlist.fm.
- GPS routing turn-by-turn instructions.
- One-way path enforcement, re-routing on path closure.
- Routed walking times replacing crow-flies in places not yet upgraded.
- Native widgets (iOS/Android home-screen schedule).

## Considerations for Scalability

- Single-table DynamoDB is cost-efficient up to massive scale; GSIs cover known access patterns.
- Lambda + API Gateway scales horizontally; concerns are Spotify rate limits (180 req/min) — mitigated by caching at ingest.
- Map costs grow with users (Mapbox tiered pricing); rate-limit map opens and consider switching to MapLibre + self-hosted tiles if usage explodes.
- Festival-map raster bandwidth: per-year tile pyramid bundles are bounded (~tens of MB max), served once per device per year via OTA — not a hot path.
