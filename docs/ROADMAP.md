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

### Phase 1 — Data Pipeline + API 🟡 In Progress

- [x] DynamoDB single-table CloudFormation
- [x] Express + Lambda backend with `/lineup/:year`, `/stages`
- [x] TypeScript scraper for `glastonburyfestivals.co.uk`
- [x] Seed data committed for 2022–2025
- [x] Spotify Client Credentials integration at ingest
- [x] DDB seed loader (`scripts/load-seeds.ts`) for first deploy
- [ ] Deploy to dev env and smoke-test `/v1/lineup/2024`

### Phase 2 — Web MVP 🔴 Not Started

- [ ] Vite + React app shell
- [ ] Lineup browse, search, day/stage filters
- [ ] Local favourites
- [ ] Service Worker + offline cache via Vite PWA plugin
- [ ] Deployed to S3 + CloudFront

### Phase 3 — Mobile MVP 🔴 Not Started

- [ ] Expo app shell with Expo Router
- [ ] Reuse `packages/shared` query hooks
- [ ] SQLite-persisted query cache
- [ ] EAS preview build

### Phase 4 — Spotify + Artist Pages 🔴 Not Started

- [ ] `/artists/:slug` and `/artists/:slug/spotify` endpoints
- [ ] Artist detail screen with embed + deep-link
- [ ] Offline fallback (cached metadata + deep-link)

### Phase 5 — Map + Walking Times 🔴 Not Started

- [ ] Mapbox custom style
- [ ] Stage pins on web + mobile
- [ ] Walking time estimates between favourites
- [ ] Web Service Worker tile cache + mobile offline pack

### Phase 6 — Cognito + Sync 🔴 Not Started

- [ ] Cognito user pool
- [ ] `/me/favourites` endpoints
- [ ] Local-first sync with last-write-wins
- [ ] Cross-device favourites verified

### Phase 7 — Polish + 2026 Readiness 🔴 Not Started

- [ ] WCAG 2.1 AA pass
- [ ] Performance budgets (LCP < 2s, INP < 200ms)
- [ ] i18n scaffolding (en, future-ready for more languages)
- [ ] Scheduled scraper validated against the 2026 lineup announcement

## Future / Stretch

- Routed walking times (real paths, not great-circle)
- Notifications: "your favourite starts in 15 min"
- Friends/group features (share schedules)
- Live updates during festival (artist cancellations, set changes)
- Native widgets (iOS/Android home-screen schedule)

## Considerations for Scalability

- Single-table DynamoDB is cost-efficient up to massive scale; GSIs cover known access patterns.
- Lambda + API Gateway scales horizontally; concerns are Spotify rate limits (180 req/min) — mitigated by caching at ingest.
- Map costs grow with users (Mapbox tiered pricing); rate-limit map opens and consider switching to MapLibre + self-hosted tiles if usage explodes.
