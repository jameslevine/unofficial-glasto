# Task Log

## 🔵 Current Task

- **Task:** Phase 1 — Data pipeline + API
- **Started:** 2026-05-21
- **Context:** Scraper now extracts performances from the real `glastonburyfestivals.co.uk` HTML. Seed JSON committed for 2022–2025 (≈14,700 performances total). Next: wire Spotify resolution at ingest, finalise CFN templates, deploy `/lineup/:year` and `/stages`.

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

## 🔴 Blocked / Pending

_None._

## ⏭️ Next Up

1. Add a one-shot loader that batch-writes `seed/{year}.json` into DynamoDB on first deploy
2. Wire Spotify Client Credentials resolution into the scraper (search artist by title; cache `spotifyId` on Artist record)
3. Add `infrastructure/cognito.yaml` and `infrastructure/s3-cloudfront.yaml`
4. Deploy backend (`api.yaml`, `dynamodb.yaml`, `scraper.yaml`) to dev environment and smoke-test `/v1/lineup/2024`
5. Scaffold `apps/web` (Vite + React + Tailwind) — Phase 2
