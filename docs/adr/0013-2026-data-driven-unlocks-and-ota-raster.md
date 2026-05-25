# 2026 unlocks are data-driven; map raster ships via Expo OTA

- **Status:** Accepted
- **Date:** 2026-05-25

The 2026 festival lineup and site map are published by the festival on schedules we don't control (lineup typically March, map typically mid-June). We're treating both as **independent unlock gates** that the app reacts to dynamically rather than features that ship in an app-store update. Lineup unlocks when the API serves a 2026 lineup; routing + visible map unlock when the path graph and map raster are uploaded as server-side resources. Until each gate opens, the 2026 surface shows an explicit "details pending" state.

The map raster specifically ships as an **Expo OTA bundle**, not via an app-store re-submission. The festival typically publishes their site map ~10 days before gates — re-submitting through Apple/Google review at that point is too risky.

## Considered alternatives

- **App-store update for 2026 unlocks.** Rejected: timing is at the mercy of store review (1–7 days on Apple, up to 7 days for new apps on Google) at the worst possible time of year.
- **Ship 2025's lineup/map as a 2026 stand-in until real data arrives.** Rejected for the map: "approximately right" routing is the failure mode the routing feature exists to fix (paths drawn across fields that no longer exist, river crossings that aren't there). For lineup the question doesn't arise — a 2025 lineup labelled as 2026 would just be wrong.
- **Bundle the path graph in the app binary alongside the routing engine.** Rejected: same problem — graph updates would require store re-submission.

## Consequences

- The path graph and any per-year map raster must be loadable as remote resources, with offline caching after first load. Cannot be in-binary assets.
- Two independent flags govern the 2026 UI state: `lineup-available-2026` and `map-available-2026`. They light up at different times.
- The pre-festival week is intense regardless of how much we slack: when the festival publishes their map, there's a content-build sprint (georeference, hand-trace, validate, upload) compressed against gates opening.
- Year picker behaviour: defaults to most-recent-with-data rather than current calendar year, to avoid landing users on an empty 2026 surface.
- The "details pending" empty state is a first-class UI surface and needs design — not an afterthought, since it's what 2026 users see on first launch until the festival publishes.
