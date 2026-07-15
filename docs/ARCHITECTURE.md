# Architecture

## System Shape

This is a static browser application with no build step and no runtime dependencies installed from npm. `index.html` loads CSS and browser scripts directly, mounts one shared benchmark shell, and injects the selected challenge configuration.

```text
index.html
  challenge chooser + intro + results + persistence wiring
        |
        v
src/app/calm-benchmark.js
  shared map-first benchmark shell and question state machine
        |
        +--> src/maps/map-adapter.js
        |      MapLibre (LiveMap style), Leaflet, or Google Maps adapter
        |
        +--> routePairProvider
        |      src/api/route-pair-generator.js against the routing facade,
        |      with mock fixtures as offline fallback
        |
        +--> answerSink / progressSink
               local repository now, production transport later

src/data/calm-benchmark-data.js
  validation + idempotent local repository + NDJSON export

src/results/calm-results.js
  shared pure aggregation for community and team result views
```

Historical `calm-*` filenames are retained to avoid breaking shared links and integrations. They now support every configured challenge.

## Entry Points

| Path | Behavior |
| --- | --- |
| `/` | Opens the saved challenge or the challenge chooser for a new browser. |
| `/?game=calm` | Opens Fast vs Calm directly. |
| `/?game=google` | Opens Fast vs Google Fast directly. |
| `/fresh.html` | Non-destructive new-player preview. Existing local data is ignored, not deleted. |
| `/demo.html` | Compatibility redirect for older shared links. |
| `/?view=results&preview=1` | Community results preview without the normal release lock. |
| `/?view=team-results` | Direct internal results prototype; not present in participant navigation. |

## Module Ownership

### `index.html`

Owns page-level composition and challenge selection:

- `CHALLENGE_CONFIGS`
- challenge chooser and intro copy
- local repository selection
- start/resume wiring
- community and team results rendering
- Google Maps script loading

Do not move challenge-specific question options into the shared shell. Keeping them in `CHALLENGE_CONFIGS` makes differences visible in one place.

### `src/app/calm-benchmark.js`

Owns the active comparison experience:

- round and question state
- hidden A/B assignment
- onboarding
- map controls and Street View mode
- answer/progress payload construction
- medals and round transitions

Its public browser interface is `window.AriCalmBenchmark`:

```js
AriCalmBenchmark.mount(root, options)
AriCalmBenchmark.createMockRoutePairProvider(pairs, label)
```

`mount` returns `getState`, `fitRoutes`, `loadRound`, and `unmount`.

### `src/maps/map-adapter.js`

Owns provider-specific map behavior behind one adapter interface. It chooses Google Maps when requested and available, then MapLibre GL with the LiveMap style pipeline imported from the `livemap-routing` runtime (with an OpenFreeMap fallback style), otherwise Leaflet. See [`../src/maps/README.md`](../src/maps/README.md).

### `src/api/route-pair-generator.js`

Owns random route-pair generation, imported from the `livemap-routing` guided blind bench: the central-Zurich sampling polygon, the 400–3000 m origin/destination distance gate, and the `POST {apiBase}/route` facade call that fetches both configured profiles in one request. Generated pairs are persisted per session so retries and resumed sessions load the identical pair, and the provider falls back to the mock fixtures when the facade is unreachable. Browser- and CommonJS-compatible so Node tests exercise the same implementation.

### `src/data/calm-benchmark-data.js`

Owns record normalization, validation, migration, idempotency, local persistence, verification, and NDJSON export. It is browser-compatible and CommonJS-compatible so Node tests can exercise the same implementation.

### `src/results/calm-results.js`

Owns pure result normalization and aggregation. It must not read DOM state or storage directly.

### `src/data/mock-*.js`

UI fixtures only. They model the route-pair contract and must never become the production route source.

## Runtime Flow

1. `index.html` resolves the challenge from `?game=`, saved selection, or the chooser.
2. It creates a challenge-specific local repository.
3. Start or Resume calls `AriCalmBenchmark.mount` with the challenge configuration and adapters.
4. The shell requests a route pair and randomizes its hidden assignment to Route A/B.
5. A completed comparison is validated and saved through `answerSink`.
6. An unfinished state is validated and upserted through `progressSink`.
7. Result views read the same challenge dataset and aggregate it through `AriCalmResults`.

## Extension Points

Production integration should replace adapters, not rewrite the question UI:

- `routePairProvider({ sessionId, roundIndex })`
- `answerSink(answer)`
- `progressSink(progress)`
- `mapProvider: "google" | "maplibre" | "leaflet"`

The Fast vs Calm challenge already wires `routePairProvider` to `AriRoutePairGenerator.createLivemapRoutePairProvider`. The routing API base resolves from `window.ARI_ROUTING_API`, then a stored `?api=` override, then same-origin `/api/v1/routing`.

Contracts are documented in [`DATA_CONTRACT.md`](DATA_CONTRACT.md), [`ANSWER_SCHEMA.md`](ANSWER_SCHEMA.md), and [`DATA_SAVING.md`](DATA_SAVING.md).

## Architectural Constraints

- The UI is blinded; provider identity never appears in tester-facing route labels.
- Route geometries use `[latitude, longitude]` tuples at the shell interface.
- Answer records are append-only and idempotent by `captureId`.
- Progress records are upserted by `sessionId`.
- Each challenge has a separate test ID and local storage key.
- The static/no-build shape is intentional for rapid sharing through GitHub Pages.
- Google Maps keys are runtime configuration and must never be committed.
