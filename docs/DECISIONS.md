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

## ADR-008: Lazy-load Mapbox GL JS chunk on web

- **Date:** 2026-05-22
- **Status:** Accepted
- **Context:** `mapbox-gl` is ~1.8MB minified — including it in the main bundle would balloon initial page load and slow down lineup browsing (the primary flow). Workbox's default `maximumFileSizeToCacheInBytes` is 2MB, which the unified chunk also exceeds.
- **Decision:** Load the `MapPage` route via `React.lazy()` inside a `Suspense` boundary, and bump Workbox `maximumFileSizeToCacheInBytes` to 4MB so the lazy chunk is precached for offline use.
- **Alternatives considered:** Eager import (rejected — penalises non-map flows); `manualChunks` rollup splitting (didn't fix the precache size limit on its own).
- **Consequences:** Main bundle stays at 335KB / 103KB gzipped. First map open downloads the Mapbox chunk on demand, then it's cached for offline. Trade-off: a brief loading state on first `/map` navigation.

## ADR-009: `@rnmapbox/maps@10.1.38` pinned for React Native 0.74

- **Date:** 2026-05-22
- **Status:** Accepted (supersedes initial `10.2.10` pin)
- **Context:** Latest `@rnmapbox/maps@10.3.x` requires `react-native >= 0.79`; Expo SDK 51 ships RN 0.74.5. The `10.2.x` line ships an ESM build that imports `./Mapbox` without the `.js` extension under `"type": "module"`, which Node's strict ESM resolver rejects — `npx expo config` (called by EAS Build) fails with `ERR_MODULE_NOT_FOUND`. `10.1.38` has the same RN peer-dep range (`>= 0.69`) and a CJS-friendly module shape.
- **Decision:** Pin to `@rnmapbox/maps@10.1.38`.
- **Alternatives considered:** Patching the package's `lib/module/index.js` via `patch-package` (rejected — extra moving part); upgrading Expo SDK 51 → 52 to get RN 0.79 (rejected — out of scope).
- **Consequences:** Locks the Mapbox SDK version until we next bump Expo. Functional parity is fine — `MapView`, `Camera`, `MarkerView`, and `OfflineManager` all exist in 10.1.x.

## ADR-007: AsyncStorage (not SQLite) for the mobile TanStack Query cache

- **Date:** 2026-05-21
- **Status:** Accepted (supersedes the SQLite line in the original plan)
- **Context:** The mobile app needs an offline cache for the lineup payload (~3–4k items per year, ~1MB JSON). The plan originally specified `expo-sqlite`, but TanStack Query's persist client expects a key/value `AsyncStorage`-like interface, not a relational store.
- **Decision:** Use `@tanstack/query-async-storage-persister` backed by `@react-native-async-storage/async-storage`, mirroring the web app's IndexedDB-backed persister.
- **Alternatives considered:** Wrapping `expo-sqlite` in an AsyncStorage shim (extra code, no real benefit at this scale); `react-native-mmkv` (faster, but a native module that complicates Expo Go testing).
- **Consequences:** Mobile favourites and query cache use the same JSON-blob storage model as web — easier to reason about. If payload sizes outgrow AsyncStorage's practical limits (~6MB on iOS) we can swap in MMKV without changing the persister API.
