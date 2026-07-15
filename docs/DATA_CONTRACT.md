# Route Pair Contract

The shared benchmark shell requests one route pair per comparison through `routePairProvider`.

## Common Shape

```ts
type LatLngTuple = [latitude: number, longitude: number];

type RouteType = "fast" | "calm" | "livemap_fast" | "google";

type RouteOption = {
  routeId: string;
  geometry: LatLngTuple[];
  source?: "google" | "model" | "saved" | "mock" | "livemap_fast";
  metadata?: {
    distanceMeters?: number;
    durationSeconds?: number;
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

Only the two route keys configured for the active challenge are required.

| Challenge | Required route keys | Test ID |
| --- | --- | --- |
| Fast vs Calm | `fast`, `calm` | `calm_vs_fast` |
| Fast vs Google Fast | `livemap_fast`, `google` | `ari_fast_vs_google` |

## Provider Interface

```js
async function routePairProvider({ sessionId, roundIndex }) {
  return benchmarkRoutePair;
}
```

`pairId` and both route IDs must be stable. Retrying a round should return the same logical pair unless the backend explicitly invalidates it.

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
- The two routes have different route types and stable route IDs.
- The shell randomizes provider routes into visible Route A / Route B slots.
- Provider identity, time, distance, and hidden scores are not displayed in the first question.
- Metadata is stored with the answer's route snapshots and may support later questions or analysis.

## Production Endpoint

A possible challenge-neutral endpoint is:

```http
GET /api/v1/benchmarks/{testId}/pairs?sessionId={sessionId}&round={roundIndex}
```

The backend may source route pairs from a saved corpus, generated origins/destinations, model output, Google routes, or curated research fixtures. The UI should not care which source produced them.
