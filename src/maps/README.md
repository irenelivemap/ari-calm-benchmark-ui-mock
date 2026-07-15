# Map Adapter

The shared benchmark UI should not depend on where the map comes from. It needs a map capable of:

- drawing Route A and Route B
- drawing start and destination markers
- panning and zooming
- fitting both routes into the closest useful comparison view
- enabling route-point targeting only while Street View mode is active
- preserving and restoring the exact map camera around Street View inspection

The current implementation lives in `map-adapter.js`. It supports MapLibre GL with the LiveMap style pipeline imported from the `livemap-routing` runtime (falling back to a public OpenFreeMap style), Leaflet for local/private use, and Google Maps when `window.google.maps` is already loaded. Production integration should replace or adapt this module while preserving the interface below.

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

The adapter receives `onRoutePointClick` when it is created. Normal map gestures remain unchanged until the app calls `setStreetViewEnabled(true)`. While active, the adapter exposes a forgiving route hit area and reports `{ lat, lng, routeKey }` to the app. The shared shell owns the embedded Street View viewer and always disables the mode when the viewer closes.

## Coordinate rule

The UI route contract uses `[lat, lng]` tuples. If the production map uses GeoJSON-style `[lng, lat]`, convert once inside the map implementation rather than throughout the UI.
