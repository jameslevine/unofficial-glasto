# Task Log

## 🔵 Current Task

- **Task:** Phase 2 — Web MVP scaffold (Vite + React + Tailwind)
- **Started:** 2026-05-21
- **Context:** Phase 1 is live in dev. API at `https://0pmdeq1cnb.execute-api.us-east-1.amazonaws.com/Prod` returns full paginated counts (3148/3667/3935/4023 + 121 stages). Ready to start the web app.

## ✅ Completed Tasks

| Date       | Task                                                                                     | Notes                                                         |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 2026-05-21 | Approved implementation plan                                                             | Mapbox over MapLibre per user preference                      |
| 2026-05-21 | Created `docs/` (ROADMAP, ARCHITECTURE, API_SCHEMA, TOOLS_AND_TECH, TASK_LOG, DECISIONS) | Documentation-first                                           |
| 2026-05-21 | Bootstrapped monorepo + tooling + scaffolds + first commit                               | Hooks bypassed on first commit because deps not yet installed |
| 2026-05-21 | Installed deps; ran prettier/eslint/tsc/vitest — all green (5 tests pass)                | Phase 0 fully verified                                        |
| 2026-05-21 | Captured 2022–2025 lineup HTML fixtures from glastonburyfestivals.co.uk                  | ~600KB–730KB per year                                         |
| 2026-05-21 | Rewrote `scraper/src/parse.ts` against real markup; fixture test passes                  | 3,148–4,023 performances per year incl. non-music             |
| 2026-05-21 | Generated `scraper/seed/{2022..2025}.json` via `scripts/build-seeds.ts`                  | Committed as offline-ready archive data                       |
| 2026-05-21 | Built `seed/stages.json` (121 stages, 9 with main-stage coordinates)                     | Remaining coords filled during Phase 5 map work               |
| 2026-05-21 | Added Spotify resolver in scraper + `load-seeds.ts` DDB loader; handler wired in         | `resolveSpotify` opt-in; non-musical titles filtered out      |
| 2026-05-21 | Consolidated infra to single `main.yaml`; switched workspace deps to `file:` for SAM     | Nested templates removed; `sam build` resolves cleanly        |
| 2026-05-21 | Deployed `glasto-dev` to AWS us-east-1; loaded 121 stages + 14,773 performances          | API live at `0pmdeq1cnb.execute-api.us-east-1.amazonaws.com`  |
| 2026-05-21 | Added DDB pagination to lineup + stages adapters; deduped parser IDs                     | Smoke test returns full counts                                |

## 🔴 Blocked / Pending

_None._

## ⏭️ Next Up

1. Scaffold `apps/web` (Vite + React + Tailwind) — Phase 2
2. Wire TanStack Query + IndexedDB persister against the deployed API
3. `apps/mobile` Expo scaffold — Phase 3
