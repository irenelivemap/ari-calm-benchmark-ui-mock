# Map Integration Surface

The benchmark UI should not depend on where the map comes from. It needs a map capable of:

- drawing Route A and Route B
- drawing start and destination markers
- panning and zooming
- fitting both routes into the closest useful comparison view
- detecting route-point interaction for Street View handoff

The current implementation lives in `src/maps/map-adapter.js`. It supports Leaflet for local/private use and Google Maps when `window.google.maps` is already loaded. When this moves into `livemap-routing`, this is the part that should be replaced or adapted to use the production map implementation from the existing benchmark.

## Required map actions

```js
drawRoutes(pair, assignment)
fitRoutes(fitPadding)
zoomIn()
zoomOut()
getRoutePointRect()
focusRoute(routeKey)
hasMap()
```

The adapter receives `onRoutePointClick` when it is created. The app owns the actual Street View URL handoff after the adapter reports that a route point was clicked.

## Coordinate rule

The UI route contract uses `[lat, lng]` tuples. If the production map uses GeoJSON-style `[lng, lat]`, convert once inside the map implementation rather than throughout the UI.
