# Map Integration Surface

The benchmark UI should not depend on where the map comes from. It needs a map capable of:

- drawing Route A and Route B
- drawing start and destination markers
- panning and zooming
- fitting both routes into the closest useful comparison view
- enabling route-point targeting only while Street View mode is active
- preserving and restoring the exact map camera around Street View inspection

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
setStreetViewEnabled(enabled)
setStreetViewPosition(point, routeKey)
clearStreetViewPosition()
getViewState()
restoreViewState(viewState)
```

The adapter receives `onRoutePointClick` when it is created. Normal map gestures remain unchanged until the app calls `setStreetViewEnabled(true)`. While active, the adapter exposes a forgiving route hit area and reports `{ lat, lng, routeKey }` to the app. The app owns the embedded Street View viewer and always disables the mode when the viewer closes.

## Coordinate rule

The UI route contract uses `[lat, lng]` tuples. If the production map uses GeoJSON-style `[lng, lat]`, convert once inside the map implementation rather than throughout the UI.
