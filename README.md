# ARI Route Benchmark UI

Static, map-first UI for blinded route-comparison research. The same benchmark shell currently supports:

- **Calm Route Comparison**: Calm Quiet compared with Calm Nature.
- **Fast vs Google Fast**: ARI Fast compared with Google Fast.
- **Fast vs Safe**: retained as a planned challenge, not currently participant-facing.

Testers see only Route A and Route B. The hidden provider assignment is stored with each answer for later analysis.

> **Production data status:** GitHub Pages is already connected to Supabase project `xyrmytymcipyntdtsksu`. The URL and public anon key in `runtime-config.js` are intentional browser configuration protected by row-level security. The Node data API is optional and is not required for the current deployment.

## Live Preview

- [Calm Route Comparison](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/)
- [Calm Route Comparison](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/?game=calm)
- [Fast vs Google Fast](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/?game=google)
- [Fresh-player preview](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/fresh.html)

## Local Setup

Node.js 18 or newer is required for the server and tests.

```bash
git clone https://github.com/irenelivemap/ari-calm-benchmark-ui-mock.git
cd ari-calm-benchmark-ui-mock
npm start
```

Open <http://127.0.0.1:8765/>.

The local server also previews the future public paths:

- <http://127.0.0.1:8765/routing/>
- <http://127.0.0.1:8765/routing/fast-vs-google>
- <http://127.0.0.1:8765/routing/fast-vs-calm>

Run the complete test suite:

```bash
npm test
```

There is no build step and no package installation is required.

## Entry Points

| URL | Use |
| --- | --- |
| `/` | Calm Route Comparison. |
| `/?game=calm` | Calm Route Comparison challenge. |
| `/?game=google` | Fast vs Google Fast challenge. |
| `/routing/` | Production-path preview of Calm Route Comparison. |
| `/routing/fast-vs-google` | Clean public Fast vs Google path. |
| `/routing/fast-vs-calm` | Legacy public alias for Calm Route Comparison. |
| `/fresh.html` | New-player QA preview without deleting saved browser data. |
| `/demo.html` | Compatibility redirect for previously shared links. |
| `/?view=results&preview=1` | Community-results preview that bypasses the Fast vs Google release lock. |
| `/?view=team-results` | Direct internal-results prototype. |

## Repository Map

```text
index.html                         Page shell, challenge config, intro, results, wiring
src/app/calm-benchmark.js          Shared active-benchmark UI and question state
src/maps/map-adapter.js            MapLibre, Leaflet, and Google Maps adapter
src/api/route-pair-generator.js    Random Zurich route pairs from the LiveMap routing facade
src/data/calm-benchmark-data.js    Validation, local persistence, export
src/data/benchmark-transport.js    Production HTTP delivery and offline outbox
src/app/runtime.js                 Runtime configuration and public URL handling
src/data/mock-*.js                 Demo route-pair fixtures
src/results/calm-results.js        Pure results aggregation
src/styles/calm-benchmark.css      Complete visual system
server/data-api.js                 File-backed benchmark persistence service
tests/                             Node tests for data and results behavior
docs/                              Product, design, architecture, and data contracts
deploy/                            Caddy + data API container configuration and handoff
```

The `calm-*` filenames are historical. They now power the full benchmark family and are retained for compatibility.

For a detailed module map and data flow, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). All documentation is indexed in [`docs/README.md`](docs/README.md).

## Common Changes

### Change challenge copy or questions

Start with the canonical current copy in `docs/QUESTIONNAIRE.md`, then update `CHALLENGE_CONFIGS` in `index.html`, any conditional route-label rendering in `src/app/calm-benchmark.js`, participant-result copy in `src/results/calm-results.js`, and the question-copy regression tests together. Challenge-specific test IDs, route types, options, follow-up rules, and result labels belong in `CHALLENGE_CONFIGS`.

### Change shared benchmark behavior

Edit `src/app/calm-benchmark.js`. This module owns the map-first round flow, onboarding, HUD, questions, Street View mode, progress payloads, and answer payloads.

### Change the map implementation

Use the adapter interface in `src/maps/map-adapter.js`. The shell accepts Leaflet or Google Maps and should not depend on provider-specific map objects.

### Connect real route data

Replace the mock `routePairProvider`; do not edit the fixtures into a production source. The route input is documented in [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md). `src/api/route-pair-generator.js` is the reference implementation against the LiveMap routing facade.

### Connect production persistence

GitHub Pages is connected to the existing Supabase project through the public anon key in `runtime-config.js`. Participants execute narrowly scoped write-only RPC functions; direct table access and anonymous reads are blocked. The app keeps local persistence as a safety layer and queues failed Supabase writes for retry. A self-hosted deployment may instead set `ARI_DATA_API_BASE`; `server/data-api.js` implements that optional transport. Keep both persistence contracts aligned with [`docs/ANSWER_SCHEMA.md`](docs/ANSWER_SCHEMA.md) and [`docs/DATA_SAVING.md`](docs/DATA_SAVING.md).

To exercise the full loop locally, start the data API with `ARI_DATA_ADMIN_TOKEN=dev-secret ARI_ALLOWED_ORIGINS=http://127.0.0.1:8765 node server/data-api.js`, then run `ARI_DATA_API_BASE=/api/v1/benchmarks npm start` in another terminal. The dev server proxies `/api/v1/benchmarks/*` to the local data API and injects the base into runtime configuration.

## Production Deployment

The prepared container serves the future public experience at `https://game.livemap.sh/routing/`. It uses clean challenge paths, hides development controls, reads the Google key from runtime configuration, and proxies routing requests same-origin. See [`deploy/README.md`](deploy/README.md) for the minimal infrastructure handoff.

The LinkedIn preview image is [`assets/ari-route-arcade-social.png`](assets/ari-route-arcade-social.png). Its editable source is [`tools/social-preview.html`](tools/social-preview.html).

## Live Route Pairs

Both active challenges use the same route-pair provider contract, but their current route sources differ:

- **Calm Route Comparison** currently uses 23 curated Calm Quiet and Calm Nature fixture pairs in `src/data/mock-route-pairs.js`. Each session receives pairs 1–10 in a shuffled order, followed by pairs 11–23 in a second shuffled order; the session ID keeps both groups stable across refresh and resume.
- **Fast vs Google Fast** requests `foot_fast` from the facade and the Google walking route from the Directions SDK at run time, so it needs both a reachable facade and a configured Google Maps key. Matchups where the two engines snap the endpoints more than 40 m apart are redrawn (fairness gate). Google geometry is never persisted: cached rounds store only our route, metrics, and Google's snapped endpoints, and the Google path is re-fetched live on resume.

- Default endpoint: `POST /api/v1/routing/route` on the same origin.
- In preview mode, point at another deployment once with `?api=https://host/api/v1/routing`; the base is kept in local storage. Production disables query-based configuration.
- When the facade is unreachable (for example on GitHub Pages) or, for the Google challenge, no Maps key is configured, the challenge falls back to the mock fixtures and logs a console warning.
- Generated pairs are cached per session, so retrying or resuming a round loads the identical pair.
- For local end-to-end testing, run the livemap-routing service (GraphHopper on port 8989), then `npm run start:live`: it serves the UI and proxies `/api/v1/routing/*` to the service same-origin, so no CORS setup is needed.

## Map Providers

The base map is **MapLibre GL** with the LiveMap style (`map.paas.livemap.sh` + the LiveMap basemap), imported from the `livemap-routing` runtime. It falls back to a public OpenFreeMap style when the LiveMap endpoints are unreachable, and to Leaflet when MapLibre itself is not loaded.

A configured Google Maps key does not switch the base map for Fast vs Calm: it loads the Google SDK so the embedded **Street View** inspector works. The one exception is **Fast vs Google Fast** with live data, which renders on a Google base map because Google Directions content must be displayed on a Google map (Maps ToS). Hosts can also request a Google base map explicitly through `mapProvider: "google"` on `AriCalmBenchmark.mount`.

## Google Maps

The Google SDK is loaded only when a key is available, and is used for Street View imagery.

For private local testing, either:

- start the local server with `ARI_GOOGLE_MAPS_KEY` in its environment, or
- open `?gmap=YOUR_KEY` once on `file://`, `localhost`, or `127.0.0.1`; the app moves the key to local storage and removes it from the URL. Production URLs never accept this override.

The GitHub Pages participant site is deployed by `.github/workflows/deploy-pages.yml`. It reads the repository secret `ARI_GOOGLE_MAPS_KEY`, injects it only into the published static artifact, and refuses to deploy without it. The source `runtime-config.js` intentionally keeps `googleMapsKey` empty.

In Google Cloud, restrict the browser key to the Maps JavaScript API and the website referrer `https://irenelivemap.github.io/*`. Cross-origin browser requests commonly send only the origin, so do not rely on the repository path as the restriction. The browser receives this key by design; its protection comes from the API and website restrictions rather than secrecy in the generated JavaScript.

Never commit an API key.

## Project Rules

- Preserve blinding: provider names must not appear on Route A/B in the active test.
- Keep orange and green reserved for Route A and Route B.
- Use `fresh.html` instead of deleting browser data during ordinary visual QA.
- Update tests and relevant docs when changing question logic or stored records.
- Never introduce participant-facing question copy without updating `docs/QUESTIONNAIRE.md` and the question-copy drift test.
- Verify both active challenge URLs after shared UI changes.

New contributors should read [`CONTEXT.md`](CONTEXT.md). Coding agents should also read [`AGENTS.md`](AGENTS.md). Open follow-ups are tracked in [`TODO.md`](TODO.md).
