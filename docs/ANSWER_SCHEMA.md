# Calm Benchmark Answer Schema

The UI produces one answer payload per submitted round.

```ts
type CalmBenchmarkAnswer = {
  v: 1;
  type: "bench-ux";
  test: "calm_vs_fast";
  source: "calm-benchmark";

  // Stable identifiers. captureId is the idempotency key.
  captureId: string;
  benchmarkRunId: string;
  sessionId: string;
  sessionStartedAt: string;
  roundId: string;
  roundNumber: number;
  pairId: string;
  participantName: string;
  rater: string;

  // Hidden assignment. The tester does not see this.
  routeAssignment: {
    routeA: "fast" | "calm";
    routeB: "fast" | "calm";
  };
  routeAType: "fast" | "calm";
  routeBType: "fast" | "calm";
  labelMap: {
    A: "fast" | "calm";
    B: "fast" | "calm";
  };
  labels: {
    A: RouteSnapshot;
    B: RouteSnapshot;
  };

  origin: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; label?: string };

  q1Choice:
    | "route_a"
    | "route_b"
    | "either"
    | "neither"
    | "hard_to_judge";
  choice: CalmBenchmarkAnswer["q1Choice"];

  q2Separate?: "yes" | "no" | "not_sure";

  q3Issues: Array<
    | "not_enough_greenery_water"
    | "too_busy_or_crowded"
    | "lacks_nice_streets_surroundings"
    | "extra_time_distance_not_worth_it"
    | "too_similar"
    | "too_complex"
    | "other"
  >;
  reasons: CalmBenchmarkAnswer["q3Issues"];

  q3Note: string;
  note: string;
  clientTs: string;
  createdAt: string;
};

type RouteSnapshot = {
  routeId: string;
  routeType: "fast" | "calm";
  source: "google" | "model" | "saved" | "mock" | null;
  metadata: Record<string, unknown> | null;
};
```

The duplicate field names (`benchmarkRunId` / `sessionId`, `choice` / `q1Choice`, `reasons` / `q3Issues`) are deliberate. The first name in each pair keeps the answer feed compatible with the first ARI benchmark dashboard vocabulary, while the second remains explicit about the calm question flow.

`captureId` is stable for one session round and must be used as the server idempotency key. A retry returns the existing record instead of appending a second answer.

## Conditional Logic

Q1 is always asked.

Q2 is asked only when Q1 is:

- `route_a`
- `route_b`
- `either`

Q3 is asked only when Q1 is:

- `route_a`
- `route_b`
- `neither`

Each applicable question must be completed before the round can be submitted. `q3Note` is optional supporting context and may accompany any Q3 selection, including `other`.

## Recommended Backend Endpoint

```http
POST /api/v1/benchmarks/calm/answers
Idempotency-Key: {captureId}
Content-Type: application/json
```

Body:

```ts
CalmBenchmarkAnswer
```

The dashboard feed uses one answer per line:

```http
GET /api/v1/benchmarks/calm/answers
Accept: application/x-ndjson
```

See `DATA_SAVING.md` for progress storage, verification, and dashboard integration.

## Analysis Examples

To know whether the tester chose the calm route:

```js
const visibleChoiceToRouteType = {
  route_a: answer.routeAType,
  route_b: answer.routeBType
};

const choseCalm =
  answer.q1Choice === "route_a" && answer.routeAType === "calm" ||
  answer.q1Choice === "route_b" && answer.routeBType === "calm";
```

To identify routes that are not meaningfully different:

```js
const notWorthShowingSeparately =
  answer.q2Separate === "no" ||
  answer.q3Issues.includes("too_similar") ||
  answer.q1Choice === "either";
```
