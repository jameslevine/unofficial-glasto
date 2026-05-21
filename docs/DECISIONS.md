# Architecture Decision Records

## ADR-001: Monorepo with separate `apps/web` and `apps/mobile`

- **Date:** 2026-05-21
- **Status:** Accepted
- **Context:** Need to ship both web and mobile experiences sharing types, API client, and query hooks.
- **Decision:** Use npm workspaces monorepo with `apps/web` (Vite) and `apps/mobile` (Expo) as siblings, plus `packages/shared` for cross-platform code.
- **Alternatives considered:**
  - **Expo universal app:** less boilerplate, but constrains web (no real `<iframe>` Spotify embeds, harder PWA story).
  - **PWA-only:** faster to MVP but no native offline tile pack on mobile.
- **Consequences:** Two build pipelines and two test suites, but each platform gets idiomatic tooling and the shared package keeps logic DRY.

## ADR-002: AWS Lambda + DynamoDB backend (vs bundled JSON)

- **Date:** 2026-05-21
- **Status:** Accepted
- **Context:** Lineup data needs to update without app store releases (especially during the festival), and we want optional cross-device sync.
- **Decision:** Backend API on Lambda + DynamoDB, with the client caching aggressively for offline use.
- **Alternatives considered:** Bundled JSON only (rejected: requires app release for any update); fetched-once JSON from S3 (rejected: no path to favourites sync without an API anyway).
- **Consequences:** Higher initial setup cost; pays off once we add Cognito sync and live updates.

## ADR-003: Mapbox over MapLibre

- **Date:** 2026-05-21
- **Status:** Accepted
- **Context:** Map is a hero feature; visual quality matters for the festival vibe.
- **Decision:** Use Mapbox GL JS (web) + `@rnmapbox/maps` (mobile) with a custom Mapbox Studio style.
- **Alternatives considered:** MapLibre + self-hosted MBTiles — free, more setup, less polished out of the box.
- **Consequences:** Tiered pricing above free quota; need to track costs and rate-limit. Native mobile offline pack is well-supported; web offline requires a Service Worker tile cache (not natively supported by Mapbox GL JS).

## ADR-004: Optional Cognito sign-in (anonymous-first)

- **Date:** 2026-05-21
- **Status:** Accepted
- **Context:** Festival utility apps shouldn't force sign-up.
- **Decision:** App is fully usable anonymously with local-only favourites. Cognito sign-in is optional and unlocks cross-device sync.
- **Consequences:** Sync logic must handle merging local-only history into a server account at first sign-in.

## ADR-005: Re-implement glastoscrape logic in TypeScript instead of forking

- **Date:** 2026-05-21
- **Status:** Accepted
- **Context:** [Jonty/glastoscrape](https://github.com/Jonty/glastoscrape) is a Python scraper with no licence specified, but it covers the official site comprehensively (including non-music sessions).
- **Decision:** Re-implement the parsing logic in TypeScript using Cheerio so it runs in the same Lambda runtime, and keep our scraper in this monorepo.
- **Alternatives considered:** Calling the Python scraper from a Lambda layer (more moving parts); using a forked Python Lambda runtime (no benefit).
- **Consequences:** Need to do the URL/HTML reverse-engineering ourselves; trade-off accepted for licence clarity and runtime simplicity.

## ADR-006: Single-table DynamoDB design

- **Date:** 2026-05-21
- **Status:** Accepted
- **Context:** Performance, Artist, Stage, User, Favourite entities — five types, all small, with predictable access patterns.
- **Decision:** Single table with one GSI per the schema in `ARCHITECTURE.md`.
- **Consequences:** All access goes through adapters. Cost-efficient, scales well; trade-off is more rigid query patterns (acceptable here).
