# Architecture

## System Shape

This is a static browser application with no production runtime dependencies installed from npm. `index.html` loads CSS and browser scripts directly, mounts one shared benchmark shell, and injects the selected challenge configuration. Playwright is a development-only dependency used for Calm launch regression tests.

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
        |      Calm: generated, fingerprinted 23-pair embedded corpus
        |      Fast vs Google: routing facade + Google Directions,
        |      with preview fixtures as an offline fallback
        |
        +--> answerSink / progressSink
               local repository + Supabase or HTTP transport/outbox

src/data/calm-benchmark-data.js
  validation + idempotent local repository + NDJSON export

src/data/supabase-transport.js
  hosted participant Supabase delivery + retryable local outbox

src/data/benchmark-transport.js
  optional self-hosted HTTP delivery + retryable local outbox

src/app/runtime.js
  environment configuration + clean/legacy URL resolution

scripts/build-pages.mjs
  deployment-only static packaging + Google Maps and MapTiler browser-key injection

src/results/calm-results.js
  shared pure aggregation and participant-result question mapping
```

Historical `calm-*` filenames are retained to avoid breaking shared links and integrations. They now support every configured challenge.

## Entry Points

| Path | Behavior |
| --- | --- |
| `/` | Opens Calm Route Comparison directly. |
| `/?game=calm` | Legacy explicit Calm query; equivalent to `/`. |
| `/?game=google` | Opens Fast vs Google Fast directly. |
| `/routing/` | Optional-container Calm entry and local production-path preview. |
| `/routing/fast-vs-google` | Optional-container Fast vs Google entry. |
| `/routing/calm-route-comparison` | Optional-container explicit Calm entry. |
| `/routing/fast-vs-calm` | Optional-container legacy Calm alias. |
| `/fresh.html` | Local-only non-destructive new-player preview. Existing local data is ignored, not deleted. |
| `/demo.html` | Compatibility redirect for older shared links. |
| `/?game=google&view=results&preview=1` | Local-only Fast vs Google results preview that bypasses its release lock. |
| `/?researcher=1&view=results` | Local-only Calm researcher results preview. |
| `/?researcher=1&view=route-profiles` | Local-only Calm route-diagnostics preview. |
| `/?view=team-results` | Local-only legacy internal-results prototype. |

## Module Ownership

### `index.html`

Owns page-level composition and challenge selection:

- `CHALLENGE_CONFIGS`
- Calm-focused intro and dormant multi-challenge configuration
- local repository selection
- start/resume wiring
- participant results and local-only researcher results rendering
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

Owns live route-pair generation for Fast vs Google, imported from the `livemap-routing` guided blind bench: the central-Zurich sampling polygon, the 400–3000 m origin/destination distance gate, and the routing-facade calls used to fetch ARI Fast before requesting Google Directions. Generated pairs are persisted per session so retries and resumed sessions load the identical pair, and that challenge falls back to preview fixtures when the live dependencies are unavailable. Browser- and CommonJS-compatible so Node tests exercise the same implementation.

### `src/data/calm-benchmark-data.js`

Owns record normalization, validation, migration, idempotency, local persistence, verification, and NDJSON export. It is browser-compatible and CommonJS-compatible so Node tests can exercise the same implementation.

### `src/data/benchmark-transport.js`

Owns the optional self-hosted HTTP delivery path. Answers use `POST` plus `Idempotency-Key`; progress uses an idempotent `PUT`. The hosted participant deployment instead calls two Supabase write-only RPCs with equivalent capture/session conflict handling and one privacy-limited aggregate RPC for Route Explorers. The feed includes a server-derived completion-order integer for participants who have finished all 23 distinct routes, without exposing the completion timestamp. Direct anon table access is disabled. Failed requests enter a local outbox and block forward progress until synchronized. Production fails closed when neither transport is configured. A self-hosted leaderboard must implement the same aggregate-only read contract before it is enabled.

### `src/app/runtime.js`

Owns environment defaults, `/routing/` base-path inference, clean challenge slugs, and compatibility with the existing `?game=` links. Production settings arrive through `runtime-config.js`, which the Caddy deployment renders from environment values.

### Hosted static deployments

The application remains a static, framework-free site. Vercel is the canonical participant host at `https://ari-benchmark.vercel.app/`; `vercel.json` packages the participant files through `scripts/build-pages.mjs`, injects the Production environment's browser keys, and applies the response-security policy. The build fails closed when either key is absent so a deployment cannot silently publish without Street View or its production basemap.

GitHub Pages is the fallback. `.github/workflows/deploy-pages.yml` runs the test suite, packages the same participant-facing files, and substitutes repository secrets into the artifact's `runtime-config.js`. The tracked source configuration stays key-free. Serving the repository root directly is not a valid production build because the tracked runtime placeholders are intentionally empty.

### `src/results/calm-results.js`

Owns pure result normalization and aggregation. It must not read DOM state or storage directly.

### Embedded corpus and preview fixtures

`src/data/mock-route-pairs.js` and `src/data/mock-route-diagnostics.js` have historical filenames but contain the generated, fingerprinted `calm-curated-v2` study corpus. They are production inputs for the Calm challenge and must only be regenerated from the paired GeoJSON/diagnostics exports. `src/data/mock-fast-google-route-pairs.js` and `src/data/mock-team-results.js` remain preview fixtures and never enter production research data.

## Runtime Flow

1. `index.html` opens Calm Route Comparison by default. Explicit Google paths remain available for compatibility and internal development.
2. It creates a challenge-specific local repository.
3. Start or Resume calls `AriCalmBenchmark.mount` with the challenge configuration and adapters.
4. The shell verifies that the Calm route and diagnostics artifacts carry the same corpus version and SHA-256 fingerprint, then requests a route pair. The curated corpus shuffles pairs 1–10 as the first group and pairs 11–23 as the second group. Both orders derive from the session and remain stable on resume; every pair still receives a randomized hidden assignment to Route A/B.
5. A completed comparison and its following progress checkpoint are validated and written locally in one atomic dataset update, then delivered through the configured Supabase or HTTP transport.
6. An unfinished state is persisted as soon as a pair loads, locally upserted, and remotely sent through the same retryable transport. Monotonic guards prevent delayed checkpoints from moving a session backward.
7. Participant `My results` reads the same challenge dataset and aggregates it through `AriCalmResults`. Local researcher mode may additionally show sample/saved participant records and route diagnostics; production researcher access is through Supabase rather than the participant browser.

## Extension Points

Production integration should replace adapters, not rewrite the question UI:

- `routePairProvider({ sessionId, roundIndex })`
- `answerSink(answer)`
- `progressSink(progress)`
- `mapProvider: "google" | "maplibre" | "leaflet"`

Calm Route Comparison uses the versioned `calm-curated-v2` corpus of 23 Calm Quiet, Calm Nature, and Fast routes in `src/data/mock-route-pairs.js`. `scripts/calm-route-corpus-manifest.mjs` owns the source-round mapping and `scripts/build-calm-route-corpus.mjs` validates and regenerates route geometry and diagnostics together. Pairs 1–10 are shuffled within the first group; pairs 11–23 are independently shuffled within the second group. Both orders derive from the session ID, so participants receive different permutations while refreshes and resumed sessions preserve the same sequence. Fast vs Google Fast uses `AriRoutePairGenerator.createLivemapGoogleRoutePairProvider` (facade `foot_fast` + Google Directions at run time, never persisting Google geometry). The routing API base resolves from `window.ARI_ROUTING_API`, then a stored `?api=` override, then same-origin `/api/v1/routing`.

Contracts are documented in [`DATA_CONTRACT.md`](DATA_CONTRACT.md), [`ANSWER_SCHEMA.md`](ANSWER_SCHEMA.md), and [`DATA_SAVING.md`](DATA_SAVING.md).

## Architectural Constraints

- The UI is blinded; provider identity never appears in tester-facing route labels.
- Route geometries use `[latitude, longitude]` tuples at the shell interface.
- Answer records are append-only and idempotent by `captureId`.
- Progress records are upserted by `sessionId`.
- Each challenge has a separate test ID and local storage key.
- Versioned Calm answers and progress carry `corpusVersion` and `corpusFingerprint`; Results excludes records from any other corpus.
- The static/no-build shape is intentional for reliable deployment to Vercel and the GitHub Pages fallback.
- Google Maps keys are runtime configuration and must never be committed.
- Production fails closed only when neither the configured Supabase connection nor `ARI_DATA_API_BASE` is available; the UI never collects browser-only production answers.
