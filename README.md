# ARI Route Benchmark UI

Static, map-first UI for blinded route-comparison research. The same benchmark shell currently supports:

- **Fast vs Calm**: ARI Fast compared with ARI Calm.
- **Fast vs Google Fast**: ARI Fast compared with Google Fast.
- **Fast vs Safe**: visible in the chooser as a planned challenge, not yet playable.

Testers see only Route A and Route B. The hidden provider assignment is stored with each answer for later analysis.

## Live Preview

- [Challenge chooser](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/)
- [Fast vs Calm](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/?game=calm)
- [Fast vs Google Fast](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/?game=google)
- [Fresh-player preview](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/fresh.html)

## Local Setup

Requirements:

- Node.js 18 or newer for tests.
- Python 3 for the zero-dependency local server.

```bash
git clone https://github.com/irenelivemap/ari-calm-benchmark-ui-mock.git
cd ari-calm-benchmark-ui-mock
npm start
```

Open <http://127.0.0.1:8765/>.

Run the complete test suite:

```bash
npm test
```

There is no build step and no package installation is required.

## Entry Points

| URL | Use |
| --- | --- |
| `/?game=calm` | Fast vs Calm challenge. |
| `/?game=google` | Fast vs Google Fast challenge. |
| `/fresh.html` | New-player QA preview without deleting saved browser data. |
| `/demo.html` | Compatibility redirect for previously shared links. |
| `/?view=results&preview=1` | Unlocked community-results preview. |
| `/?view=team-results` | Direct internal-results prototype. |

## Repository Map

```text
index.html                         Page shell, challenge config, intro, results, wiring
src/app/calm-benchmark.js          Shared active-benchmark UI and question state
src/maps/map-adapter.js            MapLibre, Leaflet, and Google Maps adapter
src/api/route-pair-generator.js    Random Zurich route pairs from the LiveMap routing facade
src/data/calm-benchmark-data.js    Validation, local persistence, export
src/data/mock-*.js                 Demo route-pair fixtures
src/results/calm-results.js        Pure results aggregation
src/styles/calm-benchmark.css      Complete visual system
tests/                             Node tests for data and results behavior
docs/                              Product, design, architecture, and data contracts
```

The `calm-*` filenames are historical. They now power the full benchmark family and are retained for compatibility.

For a detailed module map and data flow, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). All documentation is indexed in [`docs/README.md`](docs/README.md).

## Common Changes

### Change challenge copy or questions

Edit `CHALLENGE_CONFIGS` in `index.html`. Challenge-specific test IDs, route types, question options, follow-up rules, and result labels belong there.

### Change shared benchmark behavior

Edit `src/app/calm-benchmark.js`. This module owns the map-first round flow, onboarding, HUD, questions, Street View mode, progress payloads, and answer payloads.

### Change the map implementation

Use the adapter interface in `src/maps/map-adapter.js`. The shell accepts Leaflet or Google Maps and should not depend on provider-specific map objects.

### Connect real route data

Replace the mock `routePairProvider`; do not edit the fixtures into a production source. The route input is documented in [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md). `src/api/route-pair-generator.js` is the reference implementation against the LiveMap routing facade.

### Connect production persistence

Replace `answerSink` and `progressSink`. Keep the record shapes and idempotency rules in [`docs/ANSWER_SCHEMA.md`](docs/ANSWER_SCHEMA.md) and [`docs/DATA_SAVING.md`](docs/DATA_SAVING.md).

## Live Route Pairs

Both active challenges generate random route pairs the way the `livemap-routing` bench does: a random origin and destination is drawn inside the central-Zurich sampling polygon (400 m to 3000 m apart).

- **Fast vs Calm** requests `foot_fast` and `foot_calm` from the routing facade in one call.
- **Fast vs Google Fast** requests `foot_fast` from the facade and the Google walking route from the Directions SDK at run time, so it needs both a reachable facade and a configured Google Maps key. Matchups where the two engines snap the endpoints more than 40 m apart are redrawn (fairness gate). Google geometry is never persisted: cached rounds store only our route, metrics, and Google's snapped endpoints, and the Google path is re-fetched live on resume.

- Default endpoint: `POST /api/v1/routing/route` on the same origin.
- Point at another deployment once with `?api=https://host/api/v1/routing`; the base is kept in local storage.
- When the facade is unreachable (for example on GitHub Pages) or, for the Google challenge, no Maps key is configured, the challenge falls back to the mock fixtures and logs a console warning.
- Generated pairs are cached per session, so retrying or resuming a round loads the identical pair.
- For local end-to-end testing, run the livemap-routing service (GraphHopper on port 8989), then `npm run start:live`: it serves the UI and proxies `/api/v1/routing/*` to the service same-origin, so no CORS setup is needed.

## Map Providers

The base map is **MapLibre GL** with the LiveMap style (`map.paas.livemap.sh` + the LiveMap basemap), imported from the `livemap-routing` runtime. It falls back to a public OpenFreeMap style when the LiveMap endpoints are unreachable, and to Leaflet when MapLibre itself is not loaded.

A configured Google Maps key does not switch the base map for Fast vs Calm: it loads the Google SDK so the embedded **Street View** inspector works. The one exception is **Fast vs Google Fast** with live data, which renders on a Google base map because Google Directions content must be displayed on a Google map (Maps ToS). Hosts can also request a Google base map explicitly through `mapProvider: "google"` on `AriCalmBenchmark.mount`.

## Google Maps

The Google SDK is loaded only when a key is available, and is used for Street View imagery.

For private local testing, either:

- set `window.ARI_GOOGLE_MAPS_KEY` before the benchmark starts, or
- open `?gmap=YOUR_KEY` once; the app moves the key to local storage and removes it from the URL.

Never commit an API key.

## Project Rules

- Preserve blinding: provider names must not appear on Route A/B in the active test.
- Keep orange and green reserved for Route A and Route B.
- Use `fresh.html` instead of deleting browser data during ordinary visual QA.
- Update tests and relevant docs when changing question logic or stored records.
- Verify both active challenge URLs after shared UI changes.

New contributors should read [`CONTEXT.md`](CONTEXT.md). Coding agents should also read [`AGENTS.md`](AGENTS.md). Open follow-ups are tracked in [`TODO.md`](TODO.md).
