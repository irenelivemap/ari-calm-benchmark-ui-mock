# ARI Calm Benchmark UI Ingest Package

Intended private repo name: `irenelivemap/ari-calm-benchmark-ui-mock`.

This package is an implementation-ready frontend slice for the ARI calm-route benchmark.

It is intentionally separate from `livemap-routing` for now and should not be created as a GitHub fork. Nothing here modifies the team repo or the deployed `tbt-routing` app. The goal is to give the routing engineer a clean UI integration target: provide fast/calm route geometries in the expected contract, and the UI can render the blinded A/B test.

## Repository Structure

- `demo.html`
  Standalone demo page. Opens on the tester intro/start page, then launches the map-first benchmark.

- `src/app/calm-benchmark.js`
  Framework-agnostic UI module. Exposes `AriCalmBenchmark.mount(root, options)`. Supports a Google Maps adapter when `window.google.maps` is loaded, with Leaflet fallback for private/local use.

- `src/styles/calm-benchmark.css`
  Styles for the map-first layout, question panel, controls, and Leaflet hardening.

- `src/data/mock-route-pairs.js`
  Demo-only route pair data. Replace this with `routePairProvider` in the product.

- `src/api/`
  Integration notes for route loading, answer saving, and progress saving.

- `src/maps/`
  Integration notes for replacing the demo map implementation with the product map.

- `src/answers/`
  Notes on answer handling and hidden route assignment.

- `docs/DATA_CONTRACT.md`
  Route pair contract the backend/model should return.

- `docs/ANSWER_SCHEMA.md`
  Answer payload produced by the UI.

- `docs/DESIGN.md`
  Design-system rules for layout, color, map controls, onboarding, HUD, and responsive behavior.

- `docs/PRODUCT.md`
  Product intent, tester task, and success criteria.

- `docs/INTEGRATION_CHECKLIST.md`
  Practical checklist for moving this UI into `livemap-routing`.

## How to Run Locally

From this folder:

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8787/demo.html
```

## How to Ingest Into the Product

1. Copy/adapt `src/app/calm-benchmark.js` and `src/styles/calm-benchmark.css` into the frontend/static app.
2. Load Leaflet before mounting the benchmark UI.
3. Create a route in the app, for example `/bench/calm` or `/calm-benchmark`.
4. Add a root element:

```html
<div id="calm-benchmark-root"></div>
```

5. Mount the UI:

```js
AriCalmBenchmark.mount(document.getElementById('calm-benchmark-root'), {
  participantName,
  totalRounds: 10,
  mapProvider: window.google?.maps ? 'google' : 'leaflet',
  routePairProvider: async ({ sessionId, roundIndex }) => {
    return fetch(`/api/calm-benchmark/pairs?sessionId=${sessionId}&round=${roundIndex}`)
      .then(response => response.json());
  },
  answerSink: async answer => {
    await fetch('/api/calm-benchmark/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answer)
    });
  },
  progressSink: async progress => {
    await fetch('/api/calm-benchmark/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress)
    });
  }
});
```

## Integration Principle

The UI is blinded.

The model/backend knows which route is `fast` and which route is `calm`. The tester sees only `Route A` and `Route B`. The UI stores the hidden assignment in the answer payload so analysis can later determine whether the calm route was preferred or perceived as meaningfully different.

## Google Maps Mode

The tester UI does not expose Google Maps setup. In a deployed app, the runtime should load Google Maps before mounting the benchmark, the same way `livemap-routing/runtime/js/bench.js` does.

For private local development, `demo.html` can still use Google Maps without storing a key in the repo:

- set `window.ARI_GOOGLE_MAPS_KEY` before starting the benchmark, or
- open `demo.html?gmap=YOUR_KEY` once; the key is moved into localStorage and removed from the URL.

If no key is available, the demo uses the Leaflet fallback.

## Map Requirements

This UI expects real route geometries as latitude/longitude points. It handles:

- drawing both routes
- start/end markers
- pan and zoom
- fit-to-routes
- Street View handoff from a clicked route point
- optional progress save on exit
- a minimizable question panel for map inspection
- first-round onboarding and explicit exit confirmation
- full-screen map-first desktop layout

The routing engineer does not need to implement the questions or UI behavior. They only need to provide route pairs in the route-pair contract and connect the map/data sinks described in `src/api/` and `src/maps/`.
