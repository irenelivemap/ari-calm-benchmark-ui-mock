# ARI Route Benchmark UI

Static, map-first UI for blinded route-comparison research. The same benchmark shell currently supports:

- **Calm Route Comparison**: Calm Quiet compared with Calm Nature.
- **Fast vs Google Fast**: ARI Fast compared with Google Fast.
- **Fast vs Safe**: retained as a planned challenge, not currently participant-facing.

Testers see only Route A and Route B. The hidden provider assignment is stored with each answer for later analysis.

> **Production data status:** GitHub Pages is already connected to Supabase project `xyrmytymcipyntdtsksu`. The URL and public anon key in `runtime-config.js` are intentional browser configuration protected by row-level security. The Node data API is optional and is not required for the current deployment.

## Live Preview

- [Calm Route Comparison — participant site](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/)
- [Fast vs Google Fast — compatibility entry](https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/?game=google)

## Local Setup

Node.js 20 or newer is required for the server and tests.

```bash
git clone https://github.com/irenelivemap/ari-calm-benchmark-ui-mock.git
cd ari-calm-benchmark-ui-mock
npm ci
npm start
```

Open <http://127.0.0.1:8765/>.

The local server also previews the future public paths:

- <http://127.0.0.1:8765/routing/>
- <http://127.0.0.1:8765/routing/fast-vs-google>
- <http://127.0.0.1:8765/routing/fast-vs-calm>

Install the development-only browser-test dependency and run the complete launch gate:

```bash
npm ci
npm check
```

The participant application still has no build step or npm runtime dependency. Playwright is used only for automated Calm browser tests.

## Entry Points

| URL | Use |
| --- | --- |
| `/` | Calm Route Comparison. |
| `/?game=calm` | Legacy explicit Calm query; equivalent to `/`. |
| `/?game=google` | Fast vs Google Fast challenge. |
| `/routing/` | Local preview of the optional container's Calm entry. |
| `/routing/fast-vs-google` | Local preview of the optional container's Fast vs Google entry. |
| `/routing/fast-vs-calm` | Local preview of the legacy Calm alias. |
| `/fresh.html` | Local-only new-player QA preview that does not delete saved browser data. |
| `/demo.html` | Compatibility redirect for previously shared links. |
| `/?game=google&view=results&preview=1` | Local-only Fast vs Google results preview that bypasses its release lock. |
| `/?game=calm&sample=1&view=results` | Local-only participant Results preview with varied Route Explorers progress across 15 mock participants. |
| `/?researcher=1&view=results` | Local-only Calm researcher preview with sample/saved-data controls. |
| `/?researcher=1&view=route-profiles` | Local-only route-diagnostics preview. |
| `/?view=team-results` | Local-only legacy internal-results prototype. |

## Repository Map

```text
index.html                         Page shell, challenge config, intro, results, wiring
src/app/calm-benchmark.js          Shared active-benchmark UI and question state
src/maps/map-adapter.js            MapLibre, Leaflet, and Google Maps adapter
src/api/route-pair-generator.js    Random Zurich route pairs from the LiveMap routing facade
src/data/calm-benchmark-data.js    Validation, local persistence, export
src/data/supabase-transport.js     GitHub Pages Supabase delivery and offline outbox
src/data/benchmark-transport.js    Optional self-hosted HTTP delivery and offline outbox
src/app/runtime.js                 Runtime configuration and public URL handling
src/data/mock-route-pairs.js       Generated, versioned 23-pair Calm corpus (historical filename)
src/data/mock-fast-google-*.js     Fast/Google preview fixtures
src/data/mock-team-results.js      Researcher-preview fixture
src/results/calm-results.js        Pure results aggregation
src/styles/calm-benchmark.css      Complete visual system
server/data-api.js                 File-backed benchmark persistence service
tests/                             Node tests for data and results behavior
tests-e2e/                         Calm browser regression tests
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

For a new live challenge, replace its fixture provider through the `routePairProvider` interface. Calm is already bound to the generated, fingerprinted 23-pair corpus in `src/data/mock-route-pairs.js`; despite its historical filename, that file is the current study corpus and must be regenerated rather than hand-edited. The route input is documented in [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md). `src/api/route-pair-generator.js` is the live Fast vs Google implementation against the LiveMap routing facade.

### Connect production persistence

The hosted participant site is connected to the existing Supabase project through the public anon key in `runtime-config.js`. Participants execute two narrowly scoped write-only RPC functions plus one privacy-limited Route Explorers RPC; direct table access and anonymous raw-answer reads are blocked. The aggregate feed returns only participant name/code, stable participant ID, unique current-corpus route count, and a completion-order integer for 23-route finishers. The app atomically stores each completed answer with its following checkpoint, rejects backward progress, and queues failed Supabase writes for retry. Apply `20260806_questionnaire_extensions.sql`, `20260806_route_explorers.sql`, and `20260806_route_explorer_completion_order.sql` before deploying the matching participant UI. Use the Supabase runbook when preparing or updating an environment. A self-hosted deployment may instead set `ARI_DATA_API_BASE`; `server/data-api.js` implements that optional write transport and must add an equivalent privacy-limited progress endpoint before enabling the shared leaderboard. Keep both persistence contracts aligned with [`docs/ANSWER_SCHEMA.md`](docs/ANSWER_SCHEMA.md) and [`docs/DATA_SAVING.md`](docs/DATA_SAVING.md).

To exercise the full loop locally, start the data API with `ARI_DATA_ADMIN_TOKEN=dev-secret ARI_ALLOWED_ORIGINS=http://127.0.0.1:8765 node server/data-api.js`, then run `ARI_DATA_API_BASE=/api/v1/benchmarks npm start` in another terminal. The dev server proxies `/api/v1/benchmarks/*` to the local data API and injects the base into runtime configuration.

## Production Deployment

The active participant deployment is GitHub Pages at `https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/`. The prepared container and `game.livemap.sh` remain optional future infrastructure; see [`deploy/README.md`](deploy/README.md).

The linked Vercel project is a deployment mirror. [`vercel.json`](vercel.json) runs the same fail-closed participant build as GitHub Pages, so both `ARI_GOOGLE_MAPS_KEY` and `ARI_MAPTILER_KEY` must exist in the Vercel Production environment before a production deployment can succeed.

The LinkedIn preview image is [`assets/ari-route-arcade-social.png`](assets/ari-route-arcade-social.png). Its editable source is [`tools/social-preview.html`](tools/social-preview.html).

## Live Route Pairs

Both active challenges use the same route-pair provider contract, but their current route sources differ:

- **Calm Route Comparison** uses the versioned `calm-curated-v2` corpus of 23 curated Calm Quiet, Calm Nature, and Fast routes in `src/data/mock-route-pairs.js`. Each session receives pairs 1–10 in a shuffled order, followed by pairs 11–23 in a second shuffled order; the session ID keeps both groups stable across refresh and resume. Regenerate the route and diagnostics artifacts together with `node scripts/build-calm-route-corpus.mjs /path/to/paired-exports`.
- **Fast vs Google Fast** requests `foot_fast` from the facade and the Google walking route from the Directions SDK at run time, so it needs both a reachable facade and a configured Google Maps key. Matchups where the two engines snap the endpoints more than 40 m apart are redrawn (fairness gate). Google geometry is never persisted: cached rounds store only our route, metrics, and Google's snapped endpoints, and the Google path is re-fetched live on resume.

- Default endpoint: `POST /api/v1/routing/route` on the same origin.
- In preview mode, point at another deployment once with `?api=https://host/api/v1/routing`; the base is kept in local storage. Production disables query-based configuration.
- Fast vs Google falls back to its fixtures and logs a console warning when the facade is unreachable or no Google Maps key is configured. Calm always uses its embedded, versioned study corpus.
- Generated pairs are cached per session, so retrying or resuming a round loads the identical pair.
- For local end-to-end testing, run the livemap-routing service (GraphHopper on port 8989), then `npm run start:live`: it serves the UI and proxies `/api/v1/routing/*` to the service same-origin, so no CORS setup is needed.

## Map Providers

The production base map is **MapLibre GL** with the same MapTiler `streets-v4` style used by the ARI app. Map startup is bounded: if MapTiler fails or stalls, the adapter tries the public OpenFreeMap style, then falls back to Leaflet when WebGL is unavailable. Leaflet tile loading is also bounded and monitored. If no engine can load usable tiles, participant and result maps show an in-app Retry state instead of an empty canvas.

A configured Google Maps key does not switch the base map for Fast vs Calm: it loads the Google SDK so the embedded **Street View** inspector works. The one exception is **Fast vs Google Fast** with live data, which renders on a Google base map because Google Directions content must be displayed on a Google map (Maps ToS). Hosts can also request a Google base map explicitly through `mapProvider: "google"` on `AriCalmBenchmark.mount`.

## MapTiler

For private local testing, set `ARI_MAPTILER_KEY` before running `npm start`. Without a key, local previews intentionally use the OpenFreeMap fallback.

The GitHub Pages workflow reads the repository secret `ARI_MAPTILER_KEY`, injects it only into the published artifact, and refuses to deploy without it. Use a browser key restricted to the participant origins, including `https://irenelivemap.github.io/*` and the final production domain. The browser receives this key by design; its protection comes from MapTiler origin restrictions rather than secrecy in generated JavaScript.

## Google Maps

The Google SDK is loaded only when a key is available, and is used for Street View imagery.

For private local testing, either:

- start the local server with `ARI_GOOGLE_MAPS_KEY` in its environment, or
- open `?gmap=YOUR_KEY` once on `file://`, `localhost`, or `127.0.0.1`; the app moves the key to local storage and removes it from the URL. Production URLs never accept this override.

The GitHub Pages participant site is deployed by `.github/workflows/deploy-pages.yml`. It reads the repository secrets `ARI_GOOGLE_MAPS_KEY` and `ARI_MAPTILER_KEY`, injects them only into the published static artifact, and refuses to deploy without either one. The source `runtime-config.js` intentionally keeps both browser-key fields empty.

In Google Cloud, restrict the browser key to the Maps JavaScript API and the website referrer `https://irenelivemap.github.io/*`. Cross-origin browser requests commonly send only the origin, so do not rely on the repository path as the restriction. The browser receives this key by design; its protection comes from the API and website restrictions rather than secrecy in the generated JavaScript.

Never commit an API key.

## Project Rules

- Preserve blinding: provider names must not appear on Route A/B in the active test.
- Keep orange and green reserved for Route A and Route B.
- Use `fresh.html` instead of deleting browser data during ordinary visual QA.
- Update tests and relevant docs when changing question logic or stored records.
- Prefer unique participant codes when names may repeat; normalized names/codes consolidate the same person across devices and sessions.
- Never introduce participant-facing question copy without updating `docs/QUESTIONNAIRE.md` and the question-copy drift test.
- Verify both active challenge URLs after shared UI changes.

New contributors should read [`CONTEXT.md`](CONTEXT.md). Coding agents should also read [`AGENTS.md`](AGENTS.md). Open follow-ups are tracked in [`TODO.md`](TODO.md).
