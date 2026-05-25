# Routing graph traced from the festival map, not satellite imagery

- **Status:** Accepted
- **Date:** 2026-05-25

The on-site routing feature needs a path graph (LineStrings + a node graph) that the A\* router can traverse. We're tracing this graph by hand from the festival's official site map, not from satellite imagery. The festival's _temporary_ infrastructure — internal walkways, stage approaches, fenced corridors — only exists during festival weeks, isn't visible from satellites, and isn't in OpenStreetMap. The festival map is the only source that captures it.

## Considered alternatives

- **Satellite imagery only (Mapbox satellite tiles).** Cleanest legal provenance — the same posture OSM editors use for derivative geodata. Rejected because the temporary paths are the entire point of the routing feature and they're not visible from space.
- **OpenStreetMap / Overpass `highway=footway`.** Coverage of Worthy Farm's internal paths is patchy and seasonal — outside festival weeks the paths don't exist in OSM. Routes routinely cut across fields.
- **Hybrid: satellite-primary, festival map only as a reference for stages.** Stronger IP posture, but fails the same coverage gap as pure satellite — the temporary paths still need a source, and the festival map is still that source.

## Consequences

- The graph is a derivative of the festival's copyrighted map. The output is our own data format (GeoJSON LineStrings encoding facts about path positions), which is the same boundary OSM editors stand behind when tracing aerial photos — but the source-material posture is weaker than tracing from satellite.
- Per-year retracing: festival layouts shift annually, so each festival year needs its own graph. 2022–2025 are tractable now from published maps; 2026 is gated on the festival publishing their site map (mid-June typically).
- The graph must share a georeferencing transform with the visible map raster (see ADR-0011) so the route line lands on top of the visible paths.
- Hand-tracing accuracy is bounded by the festival map's stylisation — the map isn't to scale, so residual error is higher than the original plan-doc target. Acceptable for v1; the route is a guideline, not a survey.
