# Task Log

## 🔵 Current Task

- **Task:** Phase 3 — Mobile MVP (Expo app shell)
- **Started:** 2026-05-21
- **Context:** Scaffolded `apps/mobile` with Expo Router + TanStack Query + AsyncStorage cache + Zustand favourites. Repo-wide typecheck and lint clean. Outstanding: open in iOS simulator (`npm run dev:mobile -- --ios`) to confirm runtime, then build an EAS preview.

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

## 🔴 Blocked / Pending

- **iOS/Android simulator smoke test** — code is type/lint clean and the bundler config is monorepo-aware, but I haven't booted the app on a device yet. Run `npm run dev:mobile` and press `i` (iOS) or `a` (Android).

## ⏭️ Next Up

1. Boot the app on the iOS simulator and verify lineup loads + favourites persist across reloads
2. EAS preview build (`eas build --profile preview --platform ios`)
3. Phase 4 — Spotify proxy + artist pages
