# Task Log

## 🔵 Current Task

- **Task:** M9.3 POI map layer landed in code; next steps are deploy + smoke + 9.4 planning approval.
- **Started:** 2026-05-23
- **Context:** Pulled `Jonty/glastonbury-app-data` 2025 GeoJSON (33 categories, 1,107 features) into `scraper/seed/pois/2025/` + a flattened `scraper/seed/pois/2025.json`. New `Poi` zod type, `POI_CATEGORY_META` (icon + colour + default-on flag), `POI_CATEGORY_ORDER`. Backend `GET /v1/poi?year=YYYY` (Joi-validated, 24h cache header) backed by a new single-table `POI#YEAR / POI#CATEGORY#id` partition. Shared `usePois` hook + `getPois` API client. Web `MapPage` renders POI markers via `mapboxgl.Marker` HTML buttons, with a horizontal chip row toggling categories; selection persisted to `localStorage`. Mobile `app/map.tsx` mirrors with `MarkerView` + `Pressable` pins, chip `ScrollView`, and `AsyncStorage` persistence. 46/46 tests pass; tsc + eslint + prettier clean. **9.4 deferred** — drafted `docs/PLAN_9_4_ROUTING.md` covering map georeferencing (QGIS), path tracing, GeoJSON LineString output, client-side A\* routing, and mobile `expo-location` integration.

## ✅ Completed Tasks

| Date       | Task                                                                                                  | Notes                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 2026-05-21 | Approved implementation plan                                                                          | Mapbox over MapLibre per user preference                             |
| 2026-05-21 | Created `docs/` (ROADMAP, ARCHITECTURE, API_SCHEMA, TOOLS_AND_TECH, TASK_LOG, DECISIONS)              | Documentation-first                                                  |
| 2026-05-21 | Bootstrapped monorepo + tooling + scaffolds + first commit                                            | Hooks bypassed on first commit because deps not yet installed        |
| 2026-05-21 | Installed deps; ran prettier/eslint/tsc/vitest — all green (5 tests pass)                             | Phase 0 fully verified                                               |
| 2026-05-21 | Captured 2022–2025 lineup HTML fixtures from glastonburyfestivals.co.uk                               | ~600KB–730KB per year                                                |
| 2026-05-21 | Rewrote `scraper/src/parse.ts` against real markup; fixture test passes                               | 3,148–4,023 performances per year incl. non-music                    |
| 2026-05-21 | Generated `scraper/seed/{2022..2025}.json` via `scripts/build-seeds.ts`                               | Committed as offline-ready archive data                              |
| 2026-05-21 | Built `seed/stages.json` (121 stages, 9 with main-stage coordinates)                                  | Remaining coords filled during Phase 5 map work                      |
| 2026-05-21 | Added Spotify resolver in scraper + `load-seeds.ts` DDB loader; handler wired in                      | `resolveSpotify` opt-in; non-musical titles filtered out             |
| 2026-05-21 | Consolidated infra to single `main.yaml`; switched workspace deps to `file:` for SAM                  | Nested templates removed; `sam build` resolves cleanly               |
| 2026-05-21 | Deployed `glasto-dev` to AWS us-east-1; loaded 121 stages + 14,773 performances                       | API live at `0pmdeq1cnb.execute-api.us-east-1.amazonaws.com`         |
| 2026-05-21 | Added DDB pagination to lineup + stages adapters; deduped parser IDs                                  | Smoke test returns full counts                                       |
| 2026-05-21 | Scaffolded `apps/web` (Vite + React + TS + Tailwind, TanStack Query + IndexedDB)                      | Lineup browse, search, filters, local favourites all working         |
| 2026-05-21 | Added Vite PWA plugin (workbox runtime caching for lineup/stages/artists)                             | SW registers in prod; navigateFallback for SPA routes                |
| 2026-05-21 | Added S3+CloudFront web hosting to `main.yaml` (OAC, sigv4, logging, SPA fallback)                    | Single consolidated stack; logs bucket with 30-day lifecycle         |
| 2026-05-21 | Deployed web to <https://d5zgsiw27b3ju.cloudfront.net>                                                | Smoke-tested deep links + manifest + sw.js — all 200                 |
| 2026-05-21 | Scaffolded `apps/mobile` (Expo SDK 51 + Expo Router + TS) sharing `@glasto/shared`                    | Lineup browse/search/filters/favourites; AsyncStorage cache          |
| 2026-05-21 | Logged ADR-007: AsyncStorage (not SQLite) for the mobile query cache                                  | Matches TanStack Query persist API; swap to MMKV later if needed     |
| 2026-05-22 | Got the mobile bundle running in Expo Go on iOS 26.3                                                  | babel/metro/version-dedup fixes landed; smoke test green             |
| 2026-05-22 | Virtualized lineup screen with SectionList (was unvirtualized ScrollView over ~4k items)              | Memoized PerformanceCard on id; search and filters now instant       |
| 2026-05-22 | Verified EAS dev-build + Metro handshake on iOS simulator                                             | Phase 3 wrapped — dev client renders home through Metro              |
| 2026-05-22 | Backend `/artists/:slug` lazy-resolves via Spotify and caches to DDB (30-day TTL)                     | Top-tracks 403 in Dev mode — gracefully degrades to embed-only       |
| 2026-05-22 | Wired `SpotifyClientId/Secret` into ApiFunction Env in `main.yaml`; redeployed                        | Was previously only on ScraperFunction                               |
| 2026-05-22 | Web `/artists/:slug` page with Spotify embed iframe + back-link                                       | Title `Coldplay`, embed renders 10 tracks, 0 console errors          |
| 2026-05-22 | Mobile `app/artists/[slug].tsx` screen + `useArtist(api, slug, name?)` hook                           | Lazy-resolve via `?name=` query param; Image + Linking deep-link     |
| 2026-05-22 | PerformanceCard linkifies title to artist page (web + mobile)                                         | Star button stays separate; Pressable wraps title block on RN        |
| 2026-05-22 | Redeployed web to <https://d5zgsiw27b3ju.cloudfront.net> with artist page                             | Sync to S3 + CF invalidation `I7Y25QUWF9EKZ97KNB2K9C2HKF`            |
| 2026-05-22 | Added `walkingMinutes` util to `@glasto/shared` (haversine × 1.4 detour ÷ 5 km/h)                     | 3 vitest cases pass; Pyramid→Park ≈ 12-20 min                        |
| 2026-05-22 | Built web `/map` route with Mapbox GL JS (`outdoors-v12`, lazy-loaded chunk)                          | Pin pills on brand colour; flyTo + callout on click; 0 errors        |
| 2026-05-22 | Bumped Workbox `maximumFileSizeToCacheInBytes` to 4MB so Mapbox chunk precaches                       | Main bundle stays at 335KB; Mapbox chunk 1.8MB lazy                  |
| 2026-05-22 | Walking-time line between consecutive favourites on web + mobile schedule view                        | Only renders when both stages have lat/lon                           |
| 2026-05-22 | Built mobile `/map` screen with `@rnmapbox/maps@10.2.10` (peer-pinned for RN 0.74)                    | Native module — needs EAS dev rebuild to test in simulator           |
| 2026-05-22 | Registered `@rnmapbox/maps` Expo plugin + `mapboxToken` extra in `app.json`                           | Token gitignored on web (`.env.local`); shipped via app config       |
| 2026-05-22 | Redeployed web to <https://d5zgsiw27b3ju.cloudfront.net> with map + walking times                     | Sync to S3 + CF invalidation `IBJ4AMKO5U0IDT0W13XWGU9635`            |
| 2026-05-22 | EAS dev build for iOS simulator finished — installed and verified `/map` renders 9 pins               | Build `b55f9891-14f5-4f1c-92ac-218a0e8af177`; pinned to 10.1.38      |
| 2026-05-22 | Switched mobile pin from `<Text onPress>` to `<Pressable><Text/></Pressable>`                         | `<Text>` inside `MarkerView` doesn't render reliably as a marker     |
| 2026-05-22 | Added Mapbox offline pack to mobile `/map` (Worthy Farm bbox, z13–18, `outdoors-v12`)                 | Pill UI: idle/downloading/%/done/error; `getPack` rehydrates         |
| 2026-05-22 | Cognito user pool + Hosted UI + `/me/sync` endpoint deployed (last-write-wins via DDB)                | Domain `glasto-dev-563146874500.auth.us-east-1.amazoncognito.com`    |
| 2026-05-22 | Web Cognito Hosted UI auth (PKCE) + `useFavouritesSync` hook + sign-in/out chip                       | Tokens in localStorage; verifier in sessionStorage                   |
| 2026-05-22 | Mobile Cognito Hosted UI auth (PKCE via `expo-auth-session`, tokens in `expo-secure-store`)           | Sign-in chip on home; mirrors web sync hook                          |
| 2026-05-22 | Web auth derives redirect URI from `window.location.origin` (single build for localhost+CF)           | Removed `VITE_AUTH_REDIRECT_URI` env var dependency                  |
| 2026-05-22 | Cross-device sync verified end-to-end on deployed CloudFront site                                     | Browser A favourite → DDB → fresh Browser B picks it up on signin    |
| 2026-05-22 | M8.1 — added `ArtistSummary` type, `pickPreviewTrack` + `topGenres` utils, `useArtistSummary` hook    | 7 vitest cases pass; shared package rebuilt cleanly                  |
| 2026-05-22 | M8.1 — backend `GET /v1/artists/summary?year=YYYY` (BatchGet artists, server-picked previewUrl)       | Mounted before `/:slug`; 1h cache header; Joi-validated query        |
| 2026-05-22 | M8.1 — genre chip rows on web FilterBar (URL-syncable via `?g=`) + mobile lineup screen               | Multi-select OR within genres; ANDs with day/area/search             |
| 2026-05-22 | M8.2 — `buildSchedule` + `detectConflicts` shared utils with sweep-line + connected components        | 12 vitest cases pass (touching boundaries excluded; cross-midnight)  |
| 2026-05-22 | M8.2 — favourites store v3 migration on web + mobile (added `primaryByGroup` + `setPrimary`)          | Chained migrate v1→v2→v3; clear() resets primaryByGroup              |
| 2026-05-22 | M8.2 — web `ScheduleTimeline` + `ScheduleItemRow` swapped into `/favourites` ("My schedule")          | Gap labels, walking minutes, accent border + Primary/Secondary pills |
| 2026-05-22 | M8.2 — mobile `ScheduleRow` + `favourites.tsx` rewired to schedule view                               | Conflict accent border, Make-primary action; sticky day cards        |
| 2026-05-23 | M8.3 — web `useAudioPreview` zustand singleton wrapping a shared `HTMLAudioElement`                   | rAF tick for position; toggles on same-id; resets on metadata/end    |
| 2026-05-23 | M8.3 — mobile `useAudioPreview` zustand singleton wrapping `expo-av Audio.Sound`                      | Lazy `setAudioModeAsync`; AppState listener stops on background      |
| 2026-05-23 | M8.3 — `PlayPreviewButton` (web + mobile) with ▶/❚❚ + 30s progress, hides when no `previewUrl`        | sm/md sizes; `aria-pressed`/`accessibilityState` for screen readers  |
| 2026-05-23 | M8.3 — ▶ wired into web + mobile lineup cards, schedule rows, artist pages via `slugPreview` map      | No per-card artist fetches; preview URLs from `useArtistSummary`     |
| 2026-05-23 | M8.4 — shared `buildIcs` (RFC 5545 + Europe/London VTIMEZONE) + `buildGoogleCalendarUrl`              | 10 vitest cases: CRLF, fold ≤75 octets, TEXT escapes, BST/GMT rules  |
| 2026-05-23 | M8.4 — web `ExportButton` (Blob download) + per-row `AddToCalendarButton` (.ics + Google fallback)    | Click-outside dismiss; downloads via `URL.createObjectURL` + revoke  |
| 2026-05-23 | M8.4 — mobile `lib/ics.ts` (expo-file-system + expo-sharing) + per-row 📅 + per-page Export           | `text/calendar` MIME + `com.apple.ical.ics` UTI for native handlers  |
| 2026-05-23 | Deployed backend (`/v1/artists/summary` live) + web bundle to dev                                     | Inlined `pickPreviewTrack`; hardcoded `Schedule: rate(1 day)` in CFN |
| 2026-05-23 | M9.2 — `getNowNext` shared util + web/mobile `NowNextBanner` above schedule, ticks every 60s          | 7 vitest cases; respects `primaryByGroup` for active conflicts       |
| 2026-05-23 | M9.3 — POI ingest: 33 GeoJSON categories from Jonty/glastonbury-app-data → 1,107 POIs (2025)          | New `scraper/scripts/build-pois.ts` + `seed/pois/2025/*.geojson`     |
| 2026-05-23 | M9.3 — `Poi` shared type + `POI_CATEGORY_META`/`POI_CATEGORY_ORDER` (icon + colour + default-on)      | Single source of truth for layer metadata across web + mobile        |
| 2026-05-23 | M9.3 — Backend `GET /v1/poi?year=YYYY` + DDB adapter on new `POI#YEAR` partition                      | 24h cache header; Joi-validated query; mounted at `/v1/poi`          |
| 2026-05-23 | M9.3 — Web `MapPage` + mobile `/map` toggleable category chips, persisted (localStorage/AsyncStorage) | Defaults: toilets/water/food/medical/pharmacy/info/ATM/welfare on    |
| 2026-05-23 | M9.4 planning — drafted `docs/PLAN_9_4_ROUTING.md`                                                    | Image georeferencing + path tracing approach; 4-day estimate         |

## 🔴 Blocked / Pending

- _(none)_

## ⏭️ Next Up

1. Deploy backend (`/v1/poi` route + Lambda) and load POI seed (`npm run -w @glasto/scraper load:seeds`) into `glasto-dev`
2. Sync web bundle to S3 + CF invalidate so the deployed site picks up the POI layer
3. Rebuild EAS dev client (already done at `acbffa54-…`) — run audio + .ics + POI smoke tests on iOS sim
4. Approve / iterate on `docs/PLAN_9_4_ROUTING.md` (Mapbox map image rights, v1 path scope, devices)
5. Smoke-test mobile auth + sync end-to-end on iOS sim
6. Smoke-test mobile offline tile pack: download → airplane mode → reload `/map`
7. Phase 9 follow-ups: 9.1 push notifications, 9.5 battery saver, 9.6 my-pin
8. Apply for Spotify Extended Quota Mode to restore `/top-tracks`
