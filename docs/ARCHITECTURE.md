# Architecture

## System Shape

This is a static browser application with no build step and no runtime dependencies installed from npm. `index.html` loads CSS and browser scripts directly, mounts one shared benchmark shell, and injects the selected challenge configuration.

```text
index.html
  Calm-focused intro + results + persistence wiring
        |
        v
src/app/calm-benchmark.js
  shared map-first benchmark shell and question state machine
        |
        +--> src/maps/map-adapter.js + map-loading.js
        |      MapLibre (MapTiler/OpenFreeMap), Leaflet, or Google Maps adapter
        |
        +--> routePairProvider
        |      src/api/route-pair-generator.js against the routing facade,
        |      with mock fixtures as offline fallback
        |
        +--> answerSink / progressSink
               local repository + Supabase or HTTP transport/outbox

src/data/calm-benchmark-data.js
  validation + idempotent local repository + NDJSON export

src/data/benchmark-transport.js
  production Supabase/HTTP delivery + retryable local outbox

src/app/runtime.js
  environment configuration + clean/legacy URL resolution

scripts/build-pages.mjs
  deployment-only static packaging + Google Maps browser-key injection

src/results/calm-results.js
  shared pure aggregation and participant-result question mapping
```

Historical `calm-*` filenames are retained to avoid breaking shared links and integrations. They now support every configured challenge.

## Entry Points

| Path | Behavior |
| --- | --- |
| `/` | Opens Calm Route Comparison directly. |
| `/?game=calm` | Opens Calm Route Comparison directly. |
| `/?game=google` | Opens Fast vs Google Fast directly. |
| `/routing/` | Production-path Calm Route Comparison entry. |
| `/routing/fast-vs-google` | Clean public Fast vs Google path. |
| `/routing/calm-route-comparison` | Clean public Calm Route Comparison path. |
| `/routing/fast-vs-calm` | Legacy Calm Route Comparison path. |
| `/fresh.html` | Non-destructive new-player preview. Existing local data is ignored, not deleted. |
| `/demo.html` | Compatibility redirect for older shared links. |
| `/?view=results&preview=1` | Community results preview that bypasses the Fast vs Google release lock. Calm results are available from the start. |
| `/?view=team-results` | Direct internal results prototype; not present in participant navigation. |

## Module Ownership

### `index.html`

Owns page-level composition and challenge selection:

- `CHALLENGE_CONFIGS`
- Calm-focused intro and dormant multi-challenge configuration
- local repository selection
- start/resume wiring
- community and team results rendering
- Google Maps script loading

Do not move challenge-specific question options into the shared shell. Keeping runtime options in `CHALLENGE_CONFIGS` makes challenge differences visible. Exact current wording is catalogued in `docs/QUESTIONNAIRE.md`; participant-result mappings in `src/results/calm-results.js` are covered by question-copy drift tests.

### `src/app/calm-benchmark.js`

Owns the active comparison experience:

- round and question state
- hidden A/B assignment, with legacy A/B/C records still readable
- onboarding
- map controls and Street View mode
- answer/progress payload construction
- medals and round transitions

Its public browser interface is `window.AriCalmBenchmark`:

```js
AriCalmBenchmark.mount(root, options)
AriCalmBenchmark.createMockRoutePairProvider(pairs, label)
AriCalmBenchmark.createSessionPairOrder(pairCount, sessionId)
```

`mount` returns `getState`, `fitRoutes`, `loadRound`, and `unmount`.

### `src/maps/map-adapter.js` and `src/maps/map-loading.js`

Own provider-specific map behavior behind one adapter interface. `map-loading.js` selects the browser-configured MapTiler `streets-v4` style, bounds each MapLibre startup attempt, and advances to OpenFreeMap after an error or timeout. `map-adapter.js` degrades to Leaflet when WebGL cannot start and reports total failure to the shared shell so it can show an in-map Retry state. Google Maps remains available when requested. See [`../src/maps/README.md`](../src/maps/README.md).

### `src/api/route-pair-generator.js`

Owns random route-pair generation, imported from the `livemap-routing` guided blind bench: the central-Zurich sampling polygon, the 400–3000 m origin/destination distance gate, and the `POST {apiBase}/route` facade call that fetches both configured profiles in one request. Generated pairs are persisted per session so retries and resumed sessions load the identical pair, and the provider falls back to the mock fixtures when the facade is unreachable. Browser- and CommonJS-compatible so Node tests exercise the same implementation.

### `src/data/calm-benchmark-data.js`

Owns record normalization, validation, migration, idempotency, local persistence, verification, and NDJSON export. It is browser-compatible and CommonJS-compatible so Node tests can exercise the same implementation.

### `src/data/benchmark-transport.js`

Owns the optional self-hosted HTTP delivery path. Answers use `POST` plus `Idempotency-Key`; progress uses an idempotent `PUT`. GitHub Pages instead calls two Supabase write-only RPCs with equivalent capture/session conflict handling. Direct anon table access is disabled. Failed requests enter a local outbox and block forward progress until synchronized. Production fails closed when neither transport is configured.

### `src/app/runtime.js`

Owns environment defaults, `/routing/` base-path inference, clean challenge slugs, and compatibility with the existing `?game=` links. Production settings arrive through `runtime-config.js`, which the Caddy deployment renders from environment values.

### GitHub Pages deployment

The application remains a static, framework-free site. `.github/workflows/deploy-pages.yml` runs the test suite, copies only the participant-facing static files through `scripts/build-pages.mjs`, and substitutes the repository secrets `ARI_GOOGLE_MAPS_KEY` and `ARI_MAPTILER_KEY` into the artifact's copy of `runtime-config.js`. The tracked source configuration stays key-free. The build fails closed when either secret is absent so a deployment cannot silently publish without Street View or its production basemap.

### `src/results/calm-results.js`

Owns pure result normalization and aggregation. It must not read DOM state or storage directly.

### `src/data/mock-*.js`

UI fixtures only. They model the route-pair contract and must never become the production route source.

## Runtime Flow

1. `index.html` opens Calm Route Comparison by default. Explicit Google paths remain available for compatibility and internal development.
2. It creates a challenge-specific local repository.
3. Start or Resume calls `AriCalmBenchmark.mount` with the challenge configuration and adapters.
4. The shell requests a route pair. Curated fixtures shuffle pairs 1–10 as the first group and pairs 11–23 as the second group. Both orders derive from the session and remain stable on resume; every pair still receives a randomized hidden assignment to Route A/B.
5. A completed comparison is validated and saved locally, then delivered through the configured Supabase or HTTP transport.
6. An unfinished state is locally upserted and remotely sent through the same retryable transport.
7. Result views read the same challenge dataset and aggregate it through `AriCalmResults`.

## Extension Points

Production integration should replace adapters, not rewrite the question UI:

- `routePairProvider({ sessionId, roundIndex })`
- `answerSink(answer)`
- `progressSink(progress)`
- `mapProvider: "google" | "maplibre" | "leaflet"`

Calm Route Comparison uses 23 curated Calm Quiet and Calm Nature fixture rounds in `src/data/mock-route-pairs.js`. Pairs 1–10 are shuffled within the first group; pairs 11–23 are independently shuffled within the second group. Both orders derive from the session ID, so participants receive different permutations while refreshes and resumed sessions preserve the same sequence. Fast vs Google Fast uses `AriRoutePairGenerator.createLivemapGoogleRoutePairProvider` (facade `foot_fast` + Google Directions at run time, never persisting Google geometry). The routing API base resolves from `window.ARI_ROUTING_API`, then a stored `?api=` override, then same-origin `/api/v1/routing`.

Contracts are documented in [`DATA_CONTRACT.md`](DATA_CONTRACT.md), [`ANSWER_SCHEMA.md`](ANSWER_SCHEMA.md), and [`DATA_SAVING.md`](DATA_SAVING.md).

## Architectural Constraints

- The UI is blinded; provider identity never appears in tester-facing route labels.
- Route geometries use `[latitude, longitude]` tuples at the shell interface.
- Answer records are append-only and idempotent by `captureId`.
- Progress records are upserted by `sessionId`.
- Each challenge has a separate test ID and local storage key.
- The static/no-build shape is intentional for rapid sharing through GitHub Pages.
- Google Maps keys are runtime configuration and must never be committed.
- Production fails closed only when neither the configured Supabase connection nor `ARI_DATA_API_BASE` is available; the UI never collects browser-only production answers.
