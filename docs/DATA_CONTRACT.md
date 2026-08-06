# Route Pair Contract

The shared benchmark shell requests one route pair per comparison through `routePairProvider`.

## Common Shape

```ts
type LatLngTuple = [latitude: number, longitude: number];

type RouteType =
  | "calm_quiet"
  | "calm_nature"
  | "fast" // Current Calm reference route; never assigned to A/B.
  | "human" // legacy Calm records only
  | "livemap_fast"
  | "google";

type RouteOption = {
  routeId: string;
  geometry: LatLngTuple[];
  source?: RouteType | "model" | "saved" | "mock";
  metadata?: {
    distanceMeters?: number;
    durationSeconds?: number;
    fastDurationSeconds?: number;
    [key: string]: unknown;
  };
};

type BenchmarkRoutePair = {
  pairId: string;
  scenario?: string;
  origin: {
    lat: number;
    lng: number;
    label?: string;
  };
  destination: {
    lat: number;
    lng: number;
    label?: string;
  };
  routes: Record<RouteType, RouteOption>;
};
```

The required comparison and reference routes are challenge-specific:

| Challenge | Assignable route keys | Additional reference route | Test ID |
| --- | --- | --- | --- |
| Calm Route Comparison | `calm_quiet`, `calm_nature` | `fast` | `calm_route_comparison` |
| Fast vs Google Fast | `livemap_fast`, `google` | None | `ari_fast_vs_google` |

## Provider Interface

```js
async function routePairProvider({ sessionId, roundIndex }) {
  return benchmarkRoutePair;
}
```

`pairId` and every route ID must be stable. Retrying a round should return the same logical pair unless the backend explicitly invalidates it.

`src/api/route-pair-generator.js` implements the two-route live contract used by Fast vs Google. Calm Route Comparison uses the `calm-curated-v2` corpus of 23 curated Calm Quiet / Calm Nature rounds in `src/data/mock-route-pairs.js`, converted from GeoJSON `[longitude, latitude]` coordinates to this contract's `[latitude, longitude]` tuples. The paired route and diagnostics exports are validated and generated together with `scripts/build-calm-route-corpus.mjs`. Pairs 1–10 are shuffled first; pairs 11–23 are shuffled independently and follow them. Round 24 is rejected rather than wrapping to a repeated pair.

The generated array carries `corpusVersion`, `corpusFingerprint`, and the ordered source-round mapping. Versioned sessions and answers copy the version and fingerprint so the Results layer never resolves an answer against a different geometry release.

## Example: Fast vs Google Fast

```json
{
  "pairId": "zurich-hb-bellevue-01",
  "origin": {
    "lat": 47.37818,
    "lng": 8.54018,
    "label": "Zuerich HB"
  },
  "destination": {
    "lat": 47.36665,
    "lng": 8.54437,
    "label": "Bellevue"
  },
  "routes": {
    "livemap_fast": {
      "routeId": "ari-fast-01",
      "source": "livemap_fast",
      "metadata": {
        "distanceMeters": 1680,
        "durationSeconds": 1210
      },
      "geometry": [
        [47.37818, 8.54018],
        [47.37573, 8.54122],
        [47.36665, 8.54437]
      ]
    },
    "google": {
      "routeId": "google-fast-01",
      "source": "google",
      "metadata": {
        "distanceMeters": 1740,
        "durationSeconds": 1240
      },
      "geometry": [
        [47.37818, 8.54018],
        [47.37618, 8.53762],
        [47.36665, 8.54437]
      ]
    }
  }
}
```

## Invariants

- Geometry is ordered from origin to destination.
- Geometry uses `[latitude, longitude]`, not GeoJSON `[longitude, latitude]`.
- Each geometry contains at least two valid points.
- Routes have different route types and stable route IDs.
- The shell randomizes provider routes into visible Route A / Route B slots. The data reader retains compatibility with historical Route C records.
- Provider identity and hidden scores are never displayed. Fast vs Google shows rounded per-route distance because its provider duration models are not comparable. Calm Route Comparison shows each route's rounded walking time and the extra time against the Fast route supplied for the same round. Each answer records whether route metrics were visible via `metricsShown`.
- Metadata is stored with the answer's route snapshots and may support later questions or analysis.

## Production Endpoint

A possible challenge-neutral endpoint is:

```http
GET /api/v1/benchmarks/{testId}/pairs?sessionId={sessionId}&round={roundIndex}
```

The backend may source route pairs from a saved corpus, generated origins/destinations, model output, Google routes, or curated research fixtures. The UI should not care which source produced them.
