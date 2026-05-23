# Plan: 9.4 — GPS Walking Routes from Glastonbury Map Images

## Status

📋 **Planning** — no implementation yet. Build deferred until the approach is approved.

## Goal

When a user taps "Route to next favourite" on the mobile map, draw an accurate walking line from their current GPS position to the destination stage following the festival's actual paths (not great-circle).

## Why this is a real project

The off-the-shelf options don't work at Worthy Farm:

- **Mapbox Directions API (walking profile)** uses OpenStreetMap. OSM coverage of Worthy Farm's internal trackways is patchy and seasonal — outside festival weeks the paths don't exist. Routes routinely cut across fields or down nonexistent paths.
- **OSM Overpass / `highway=footway`** has the same coverage gap. Some major drag-routes are mapped, most are not.
- **Great-circle line** (the v1 we deferred) is misleading on a site with rivers, fences, and one-way crowd-flow systems. A straight line from West Holts to Pyramid suggests crossing the railway track.

The festival publishes accurate path maps annually as raster images. The plan is to extract those paths into vector data we can use as a routing graph.

## Source images

Reference: `https://glastopedia.com/festivals/maps`

We need:

1. The most recent **plan-view** (not isometric) festival map at the highest resolution available.
2. At least 6–8 known control points on the image whose real lat/lon we already have (from `seed/stages.json` and the new POI GeoJSON files in `Jonty/glastonbury-app-data/data/2025/geojson/`). Stages and SITE_ENTRANCES_AND_EXITS are good control points.

## Approach

### Phase A — Image georeferencing (one-off, ~half a day)

1. Acquire a plan-view festival map image at sufficient resolution to read path widths.
2. Open in **QGIS** (free, mature for this) → use the **Georeferencer** tool.
3. Place 8–10 control points pinning known on-map landmarks to known lat/lon coordinates.
4. Apply a polynomial (order 1 = affine) or thin-plate-spline transform. Affine should be sufficient — the festival map is roughly orthogonal.
5. Export as a GeoTIFF or as raw lat/lon transformation parameters (`a, b, c, d, e, f` of the affine matrix).
6. Validate: pick 3 control points NOT used in the fit, compute residual error. Target: < 5 metres at the centre, < 10 metres at the edges.

### Phase B — Path tracing (the bulk of the work, ~1–2 days)

Two viable methods:

**B.1 — Hand-traced in QGIS** (recommended for v1)

- Create a `LineString` layer in QGIS over the georeferenced raster.
- Trace each major path as a polyline, snapping line endpoints together to form a graph.
- Tag each segment with metadata: `surface` (path/road), `oneway`, `lit`, `wheelchair_accessible`.
- Export as GeoJSON `FeatureCollection<LineString>`.
- Estimated path count: ~100–150 segments for the main ring, secondary tracks, and stage approaches.

**B.2 — Semi-automated raster trace**

- Use Python + OpenCV to threshold path-coloured pixels, skeletonise, then convert to vector via `rasterio` + `shapely`.
- Faster bulk extraction but produces noisy data needing heavy cleanup.
- Defer to v2 unless B.1 takes longer than expected.

### Phase C — Output format and storage

```
scraper/seed/paths/2026/walking-paths.geojson
```

Schema:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "path-001",
        "surface": "path",
        "oneway": false,
        "lit": true,
        "wheelchair_accessible": true,
        "year_verified": 2025
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [[-2.5871, 51.1539], [-2.5872, 51.1540], ...]
      }
    }
  ]
}
```

Stored as a static file shipped with the app (offline-first). No backend route needed for v1 — the full path network is small (< 100KB after gzip).

### Phase D — Routing engine

For ~150 segments, full server-side routing is overkill. Run a client-side A\* or Dijkstra over the graph.

- New shared package: `packages/shared/src/routing/`
  - `build-graph.ts` — load GeoJSON, snap endpoints within 2m tolerance, build adjacency map.
  - `find-route.ts` — Dijkstra from `userLatLon` (snapped to nearest segment) to `destinationLatLon`.
  - `route-distance.ts` — sum segment lengths via haversine.

For ~150 segments + ~300 nodes, a single A\* call runs in < 5ms — no need for a worker thread.

### Phase E — Mobile UI integration

`apps/mobile/app/map.tsx`:

- Add `expo-location` permission request at point of use ("Show route to [stage]?")
- On grant: get position, call `findRoute(userLatLon, stage.latLon)`
- Render result as `<Mapbox.ShapeSource>` + `<Mapbox.LineLayer>` with brand colour, 4px wide, 80% opacity.
- Show ETA pill: route distance × 1.0 / 5 km/h (paths only — no detour multiplier).
- Recompute every 15s while route is active (battery-aware).

### Phase F — Web (deferred)

The web app on a phone doesn't have reliable continuous GPS. Defer routing UI on web entirely or scope it to "show this fixed route from any stage to any other" (no GPS).

## Open Questions

1. **Map source consent** — glastopedia.com hosts archive images; verify their licence permits derivative geodata. The festival's own published path data (if any) may already be openly licensed.
2. **Year-on-year drift** — the festival re-pegs the same paths each year but layouts shift slightly. Plan to re-georeference + retrace once per year, not assume 2026 == 2025.
3. **Crowd flow / one-way routes** — the festival enforces one-way bridges/lanes during peak hours. v1 ignores this; v2 could add `oneway_during: ['fri-evening', 'sat-evening']` and respect it in the routing cost.
4. **Stage-side accuracy** — final 50m to a stage is often through crowds, not on a path. Routing endpoint should be the nearest path node, with the last leg shown as a dashed line.

## Risks

| Risk                                          | Mitigation                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Georeferencing residual error > 10m           | Use TPS instead of affine; add more control points                                                                                              |
| Hand-tracing taking far longer than estimated | Start with main paths only (top 30 routes between major stages); ship; iterate                                                                  |
| Map images covered by copyright restrictions  | Contact glastopedia / festival before publishing the derivative GeoJSON; alternatively trace from satellite imagery which has clearer licensing |
| Mobile A\* perceived as slow on older devices | Pre-bake route table for stage-to-stage at build time; fall back to live A\* only when GPS origin is mid-path                                   |

## What ships in v1

1. `walking-paths.geojson` covering the ~50 most-used routes between major stages.
2. `findRoute(from, to)` shared util.
3. Mobile-only "Route to next favourite" button + polyline render.
4. Static (no live GPS) version of the route on web for accessibility/discovery.

Web GPS routing, one-way enforcement, and re-routing on path closure are out of scope.

## Effort estimate

| Phase                        | Effort                                   |
| ---------------------------- | ---------------------------------------- |
| A — Georeferencing           | 0.5 day                                  |
| B — Hand-tracing main routes | 1.5 days                                 |
| C — Seed file + lint         | 0.5 day                                  |
| D — Routing util + tests     | 1 day                                    |
| E — Mobile integration       | 0.5 day                                  |
| **Total**                    | **~4 days, mostly cartography not code** |

## Decision needed before we build

1. Confirm we have rights to derive geodata from glastopedia map images (or pivot to satellite + festival site-plan PDFs).
2. Confirm scope of v1: ~50 main routes (recommended) vs. the full path network.
3. Confirm device targets — older Android devices may need the pre-baked route table fallback.
