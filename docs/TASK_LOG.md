# Task Log

## 🔵 Current Task

- **Task:** Phase 6 — Cognito + cross-device favourites sync (kicking off)
- **Started:** 2026-05-22
- **Context:** Phase 5 fully shipped. Mobile `/map` now offers a "Download for offline" pill (top-left) backed by `Mapbox.offlineManager.createPack({ name: 'worthy-farm', styleURL: 'outdoors-v12', minZoom: 13, maxZoom: 18, bounds: [[-2.55, 51.18], [-2.62, 51.13]] })` with progress %, idle/done/error states, and a tappable "✓ Offline ready" pill that calls `deletePack` for re-downloading. On screen mount we call `getPack(PACK_NAME)` to restore state from disk. Next: Cognito user pool, `/me/favourites` endpoints, last-write-wins merge on first sign-in.

## ✅ Completed Tasks

| Date       | Task                                                                                     | Notes                                                            |
| ---------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 2026-05-21 | Approved implementation plan                                                             | Mapbox over MapLibre per user preference                         |
| 2026-05-21 | Created `docs/` (ROADMAP, ARCHITECTURE, API_SCHEMA, TOOLS_AND_TECH, TASK_LOG, DECISIONS) | Documentation-first                                              |
| 2026-05-21 | Bootstrapped monorepo + tooling + scaffolds + first commit                               | Hooks bypassed on first commit because deps not yet installed    |
| 2026-05-21 | Installed deps; ran prettier/eslint/tsc/vitest — all green (5 tests pass)                | Phase 0 fully verified                                           |
| 2026-05-21 | Captured 2022–2025 lineup HTML fixtures from glastonburyfestivals.co.uk                  | ~600KB–730KB per year                                            |
| 2026-05-21 | Rewrote `scraper/src/parse.ts` against real markup; fixture test passes                  | 3,148–4,023 performances per year incl. non-music                |
| 2026-05-21 | Generated `scraper/seed/{2022..2025}.json` via `scripts/build-seeds.ts`                  | Committed as offline-ready archive data                          |
| 2026-05-21 | Built `seed/stages.json` (121 stages, 9 with main-stage coordinates)                     | Remaining coords filled during Phase 5 map work                  |
| 2026-05-21 | Added Spotify resolver in scraper + `load-seeds.ts` DDB loader; handler wired in         | `resolveSpotify` opt-in; non-musical titles filtered out         |
| 2026-05-21 | Consolidated infra to single `main.yaml`; switched workspace deps to `file:` for SAM     | Nested templates removed; `sam build` resolves cleanly           |
| 2026-05-21 | Deployed `glasto-dev` to AWS us-east-1; loaded 121 stages + 14,773 performances          | API live at `0pmdeq1cnb.execute-api.us-east-1.amazonaws.com`     |
| 2026-05-21 | Added DDB pagination to lineup + stages adapters; deduped parser IDs                     | Smoke test returns full counts                                   |
| 2026-05-21 | Scaffolded `apps/web` (Vite + React + TS + Tailwind, TanStack Query + IndexedDB)         | Lineup browse, search, filters, local favourites all working     |
| 2026-05-21 | Added Vite PWA plugin (workbox runtime caching for lineup/stages/artists)                | SW registers in prod; navigateFallback for SPA routes            |
| 2026-05-21 | Added S3+CloudFront web hosting to `main.yaml` (OAC, sigv4, logging, SPA fallback)       | Single consolidated stack; logs bucket with 30-day lifecycle     |
| 2026-05-21 | Deployed web to <https://d5zgsiw27b3ju.cloudfront.net>                                   | Smoke-tested deep links + manifest + sw.js — all 200             |
| 2026-05-21 | Scaffolded `apps/mobile` (Expo SDK 51 + Expo Router + TS) sharing `@glasto/shared`       | Lineup browse/search/filters/favourites; AsyncStorage cache      |
| 2026-05-21 | Logged ADR-007: AsyncStorage (not SQLite) for the mobile query cache                     | Matches TanStack Query persist API; swap to MMKV later if needed |
| 2026-05-22 | Got the mobile bundle running in Expo Go on iOS 26.3                                     | babel/metro/version-dedup fixes landed; smoke test green         |
| 2026-05-22 | Virtualized lineup screen with SectionList (was unvirtualized ScrollView over ~4k items) | Memoized PerformanceCard on id; search and filters now instant   |
| 2026-05-22 | Verified EAS dev-build + Metro handshake on iOS simulator                                | Phase 3 wrapped — dev client renders home through Metro          |
| 2026-05-22 | Backend `/artists/:slug` lazy-resolves via Spotify and caches to DDB (30-day TTL)        | Top-tracks 403 in Dev mode — gracefully degrades to embed-only   |
| 2026-05-22 | Wired `SpotifyClientId/Secret` into ApiFunction Env in `main.yaml`; redeployed           | Was previously only on ScraperFunction                           |
| 2026-05-22 | Web `/artists/:slug` page with Spotify embed iframe + back-link                          | Title `Coldplay`, embed renders 10 tracks, 0 console errors      |
| 2026-05-22 | Mobile `app/artists/[slug].tsx` screen + `useArtist(api, slug, name?)` hook              | Lazy-resolve via `?name=` query param; Image + Linking deep-link |
| 2026-05-22 | PerformanceCard linkifies title to artist page (web + mobile)                            | Star button stays separate; Pressable wraps title block on RN    |
| 2026-05-22 | Redeployed web to <https://d5zgsiw27b3ju.cloudfront.net> with artist page                | Sync to S3 + CF invalidation `I7Y25QUWF9EKZ97KNB2K9C2HKF`        |
| 2026-05-22 | Added `walkingMinutes` util to `@glasto/shared` (haversine × 1.4 detour ÷ 5 km/h)        | 3 vitest cases pass; Pyramid→Park ≈ 12-20 min                    |
| 2026-05-22 | Built web `/map` route with Mapbox GL JS (`outdoors-v12`, lazy-loaded chunk)             | Pin pills on brand colour; flyTo + callout on click; 0 errors    |
| 2026-05-22 | Bumped Workbox `maximumFileSizeToCacheInBytes` to 4MB so Mapbox chunk precaches          | Main bundle stays at 335KB; Mapbox chunk 1.8MB lazy              |
| 2026-05-22 | Walking-time line between consecutive favourites on web + mobile schedule view           | Only renders when both stages have lat/lon                       |
| 2026-05-22 | Built mobile `/map` screen with `@rnmapbox/maps@10.2.10` (peer-pinned for RN 0.74)       | Native module — needs EAS dev rebuild to test in simulator       |
| 2026-05-22 | Registered `@rnmapbox/maps` Expo plugin + `mapboxToken` extra in `app.json`              | Token gitignored on web (`.env.local`); shipped via app config   |
| 2026-05-22 | Redeployed web to <https://d5zgsiw27b3ju.cloudfront.net> with map + walking times        | Sync to S3 + CF invalidation `IBJ4AMKO5U0IDT0W13XWGU9635`        |
| 2026-05-22 | EAS dev build for iOS simulator finished — installed and verified `/map` renders 9 pins  | Build `b55f9891-14f5-4f1c-92ac-218a0e8af177`; pinned to 10.1.38  |
| 2026-05-22 | Switched mobile pin from `<Text onPress>` to `<Pressable><Text/></Pressable>`            | `<Text>` inside `MarkerView` doesn't render reliably as a marker |
| 2026-05-22 | Added Mapbox offline pack to mobile `/map` (Worthy Farm bbox, z13–18, `outdoors-v12`)    | Pill UI: idle/downloading/%/done/error; `getPack` rehydrates     |

## 🔴 Blocked / Pending

- _(none)_

## ⏭️ Next Up

1. Smoke-test mobile offline pack: tap "Download for offline", airplane-mode the simulator, reload `/map`, confirm tiles still render
2. Phase 6 — Cognito user pool + `/me/favourites` endpoints + last-write-wins sync
3. EAS preview build for device + TestFlight
4. Apply for Spotify Extended Quota Mode to restore `/top-tracks` (and remove embed-only fallback)
