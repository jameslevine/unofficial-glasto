# Bundle the festival's official map as a raster overlay

- **Status:** Accepted
- **Date:** 2026-05-25

The on-site map experience needs to feel specifically _like Glastonbury_, not like a generic Mapbox view. The festival publishes an official site map (PDF) each year that is the canonical visual representation of the site. We're bundling that map as a Mapbox raster source layered over the standard tiles, rather than building a custom Mapbox style or an AI-generated alternative. The raster ships per-year, georeferenced once, served via a server-side resource (so 2026's map can drop without an app-store update).

## Considered alternatives

- **Custom Mapbox style** — clean IP, infinite zoom fidelity, but loses the festival's specific cartographic personality (named fields, totem-style stage markers, hand-drawn feel).
- **AI-generated festival-style map** — clean IP, distinctive look, but cartographic accuracy can drift from the routing graph (the AI invents path positions). Parked as a future fallback if the festival's IP risk materialises.
- **No festival imagery, vector layers only** — cheapest and cleanest legally, but the map experience becomes generic.

## Consequences

- Carries IP exposure: the festival's site map is copyrighted artwork, and an unofficial public-store app redistributing it is a plausible takedown target. Accepted risk; AI-styled fallback is a known follow-up if a takedown lands.
- Map raster must be loadable as a remote/OTA resource — bundling it in the app binary would force a store re-submission whenever the festival publishes a new year's map.
- The same raster must be georeferenced with the same transform as the routing graph (see ADR-0012), so the visible map and the route line agree on where paths are.
