# Unofficial Glasto

An offline-first companion app for Glastonbury Festival on web and mobile, backed by an AWS serverless API. Browse the lineup (music + non-music sessions), favourite acts, plan your schedule, see walking times between stages, and listen to artists on Spotify before you go.

> **Unofficial — fan-made.** Not affiliated with Glastonbury Festival.

## Quick start

```bash
nvm use            # Node 22
npm install        # workspace install

npm run dev:web        # Vite on http://localhost:5173
npm run dev:mobile     # Expo dev server
npm run dev:backend    # Local Express on :3000
```

## Repo layout

```
apps/
  web/         # Vite + React PWA
  mobile/      # Expo (React Native)
packages/
  shared/      # Shared types, Zod schemas, API client, query hooks
  ui/          # Cross-platform headless primitives
backend/       # Express monolith deployed as Lambda
scraper/       # Scheduled lineup scraper Lambda
infrastructure/ # CloudFormation (nested stacks)
docs/          # ROADMAP, ARCHITECTURE, API_SCHEMA, etc.
```

## Documentation

Read these first before contributing:

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased milestones and current status
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design
- [`docs/API_SCHEMA.md`](docs/API_SCHEMA.md) — REST API contract
- [`docs/TOOLS_AND_TECH.md`](docs/TOOLS_AND_TECH.md) — stack details
- [`docs/TASK_LOG.md`](docs/TASK_LOG.md) — current work
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architecture decisions

## Status

Phase 0 — Foundation.
