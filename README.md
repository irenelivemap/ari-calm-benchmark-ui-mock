# ARI Calm Benchmark UI Ingest Package

Intended private repo name: `irenelivemap/ari-calm-benchmark-ui-mock`.

This package is an implementation-ready frontend slice for the ARI calm-route benchmark.

It is intentionally separate from `livemap-routing` for now and should not be created as a GitHub fork. Nothing here modifies the team repo or the deployed `tbt-routing` app. The goal is to give the routing engineer a clean UI integration target: provide fast/calm route geometries in the expected contract, and the UI can render the blinded A/B test.

## Files

- `demo.html`  
  Standalone demo page. Opens on the tester intro/start page, then launches the map-first benchmark.

- `calm-benchmark.js`  
  Framework-agnostic UI module. Exposes `AriCalmBenchmark.mount(root, options)`. Supports a Google Maps adapter when `window.google.maps` is loaded, with Leaflet fallback for private/local use.

- `calm-benchmark.css`  
  Styles for the map-first layout, question panel, controls, and Leaflet hardening.

- `DATA_CONTRACT.md`  
  Route pair contract the backend/model should return.

- `ANSWER_SCHEMA.md`  
  Answer payload produced by the UI.

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

1. Copy `calm-benchmark.js` and `calm-benchmark.css` into the frontend/static app.
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
  }
});
```

## Integration Principle

The UI is blinded.

The model/backend knows which route is `fast` and which route is `calm`. The tester sees only `Route A` and `Route B`. The UI stores the hidden assignment in the answer payload so analysis can later determine whether the calm route was preferred or perceived as meaningfully different.

## Google Maps Mode

`demo.html` can use Google Maps without storing a key in the repo:

- open the "Use Google Maps basemap" disclosure on the start card and paste a browser key, or
- open `demo.html?gmap=YOUR_KEY` once; the key is moved into localStorage and removed from the URL.

If no key is available, the demo uses the Leaflet fallback. The production integration can load Google Maps the same way `livemap-routing/runtime/js/bench.js` does, then mount this UI with `mapProvider: 'google'`.

## Map Requirements

This UI expects real route geometries as latitude/longitude points. It handles:

- drawing both routes
- start/end markers
- pan and zoom
- fit-to-routes
- Google-like tile view toggle
- large map-first desktop layout

The routing engineer does not need to implement the questions or UI behavior. They only need to provide route pairs in the route-pair contract.
