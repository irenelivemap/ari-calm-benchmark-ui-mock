# Calm Benchmark Route Pair Contract

The UI expects one route pair per round.

The backend/model should return a `CalmBenchmarkPair` object.

```ts
type LatLngTuple = [number, number]; // [lat, lng]

type CalmBenchmarkPair = {
  pairId: string;
  scenario: string;
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
  routes: {
    fast: {
      routeId: string;
      geometry: LatLngTuple[];
      source?: "google" | "model" | "saved" | "mock";
      metadata?: Record<string, unknown>;
    };
    calm: {
      routeId: string;
      geometry: LatLngTuple[];
      source?: "model" | "saved" | "mock";
      metadata?: Record<string, unknown>;
    };
  };
};
```

## Example

```json
{
  "pairId": "zurich-limmat-evening-01",
  "scenario": "An evening walk home along the Limmat, no particular rush.",
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
    "fast": {
      "routeId": "fast-demo-01",
      "source": "model",
      "geometry": [
        [47.37818, 8.54018],
        [47.37692, 8.54072],
        [47.37573, 8.54122]
      ]
    },
    "calm": {
      "routeId": "calm-demo-01",
      "source": "model",
      "geometry": [
        [47.37818, 8.54018],
        [47.37742, 8.53874],
        [47.37618, 8.53762]
      ]
    }
  }
}
```

## Important Rules

- Geometry must be ordered from origin to destination.
- Geometry must use latitude/longitude coordinates, not `[lng, lat]`.
- The UI can accept extra route metadata, but it will not display time, distance, calm score, or route type to the tester.
- The UI randomizes the assignment to `Route A` / `Route B`.
- The answer payload includes the hidden assignment so analysis can recover which visible route was fast/calm.

## Future Backend Endpoint Shape

Recommended:

```http
GET /api/calm-benchmark/pairs?sessionId={sessionId}&round={roundIndex}
```

Response:

```ts
CalmBenchmarkPair
```

The endpoint can source pairs from:

- saved route corpus
- generated origin/destination pairs
- model-produced calm alternatives
- manually curated test cases
