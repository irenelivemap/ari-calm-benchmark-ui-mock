# Map Integration Surface

The benchmark UI should not depend on where the map comes from. It needs a map capable of:

- drawing Route A and Route B
- drawing start and destination markers
- panning and zooming
- fitting both routes into the closest useful comparison view
- detecting route-point interaction for Street View handoff

The current implementation keeps Leaflet and Google Maps rendering inside `src/app/calm-benchmark.js` to preserve the standalone demo. When this moves into `livemap-routing`, this is the part that should be replaced with the production map implementation used by the existing benchmark.

## Required map actions

```js
showRoutes({ routeA, routeB, origin, destination })
fitRoutes()
zoomIn()
zoomOut()
onRoutePointClick(callback)
openStreetView(point)
focusRoute(routeKey)
clearRouteFocus()
```

## Coordinate rule

The UI route contract uses `[lat, lng]` tuples. If the production map uses GeoJSON-style `[lng, lat]`, convert once inside the map implementation rather than throughout the UI.
