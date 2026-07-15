# Benchmark Answer Schema

The shared benchmark shell produces one answer record per completed comparison. Challenge configuration changes the allowed choices and follow-up questions, not the common record envelope.

## Completed Answer

```ts
type RouteType = "fast" | "calm" | "livemap_fast" | "google";

type Q1Choice =
  | "route_a"
  | "route_b"
  | "either"
  | "neither"
  | "hard_to_judge"
  | "both_work_well"
  | "both_work_poorly"
  | "not_sure";

type Q3Issue =
  // Fast vs Calm
  | "not_enough_greenery_water"
  | "too_busy_or_crowded"
  | "lacks_nice_streets_surroundings"
  | "extra_time_distance_not_worth_it"
  | "too_similar"
  | "too_complex"
  | "other"
  // Fast vs Google Fast
  | "longer_time"
  | "longer_distance"
  | "misses_shortcut"
  | "unclear_shortcut"
  | "misses_nicer_route"
  | "lacks_amenities"
  // Accepted legacy values from the first Fast benchmark
  | "more_elevation"
  | "more_stairs"
  | "more_turns"
  | "crossing_friction";

type BenchmarkAnswerV1 = {
  v: 1;
  type: "bench-ux";
  test: "calm_vs_fast" | "ari_fast_vs_google";
  source: "calm-benchmark" | "fast-google-benchmark";

  captureId: string;          // Idempotency key.
  benchmarkRunId: string;     // Compatibility alias of sessionId.
  sessionId: string;
  sessionStartedAt: string;   // ISO timestamp.
  roundId: string;
  roundNumber: number;        // One-based.
  pairId: string;
  participantName: string;
  rater: string;              // Compatibility alias of participantName.

  routeAssignment: {
    routeA: RouteType;
    routeB: RouteType;
  };
  routeAType: RouteType;
  routeBType: RouteType;
  labelMap: {
    A: RouteType;
    B: RouteType;
  };
  labels: {
    A: RouteSnapshot;
    B: RouteSnapshot;
  };

  origin: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; label?: string };

  q1Choice: Q1Choice;
  choice: Q1Choice;            // Compatibility alias of q1Choice.
  q2Separate: "yes" | "no" | "not_sure" | null;
  q3Issues: Q3Issue[];
  reasons: Q3Issue[];          // Compatibility alias of q3Issues.
  q3Note: string;
  note: string;                // Compatibility alias.

  clientTs: string;
  createdAt: string;
};

type RouteSnapshot = {
  routeId: string;
  routeType: RouteType;
  source: string | null;
  metadata: Record<string, unknown> | null;
};
```

The duplicate names (`benchmarkRunId` / `sessionId`, `choice` / `q1Choice`, `reasons` / `q3Issues`) preserve compatibility with the first ARI benchmark dashboard while keeping the current question flow explicit.

## Challenge Rules

### Fast vs Calm

Q1 choices:

- `route_a`
- `route_b`
- `either` (Both work well)
- `neither` (Neither works)
- `hard_to_judge`

Follow-ups:

| Q1 choice | Q2 | Q3 |
| --- | --- | --- |
| `route_a`, `route_b` | Required | Required |
| `either` | Required | Empty |
| `neither` | Empty | Required |
| `hard_to_judge` | Empty | Empty |

### Fast vs Google Fast

Q1 choices:

- `route_a`
- `route_b`
- `both_work_well`
- `both_work_poorly`
- `not_sure` (I don't know)

Follow-ups:

| Q1 choice | Q2 | Q3 |
| --- | --- | --- |
| `route_a`, `route_b` | Empty | Required |
| `both_work_poorly` | Empty | Required |
| `both_work_well`, `not_sure` | Empty | Empty |

When Q3 is required, at least one issue must be selected. `q3Note` is optional supporting text.

## Progress Record

Unfinished sessions use the same answer shape as a partial record:

```ts
type BenchmarkProgressV1 = {
  v: 1;
  type: "bench-progress";
  test: BenchmarkAnswerV1["test"];
  source: BenchmarkAnswerV1["source"];
  benchmarkRunId: string;
  sessionId: string;
  participantName: string;
  sessionStartedAt: string;
  roundIndex: number;          // Zero-based current round.
  completedRounds: number;
  pairId: string | null;
  routeAssignment: BenchmarkAnswerV1["routeAssignment"] | null;
  questionStep: "q1" | "q2" | "q3";
  partialAnswer: Partial<BenchmarkAnswerV1> | null;
  savedAt: string;
};
```

## Idempotency

`captureId` is stable for one session round and must be used as the server idempotency key. Retrying the same completed comparison returns the existing record instead of appending a duplicate.

## Analysis Example

Decode a visible route choice without exposing provider identity to the tester:

```js
function selectedRouteType(answer) {
  if (answer.q1Choice === 'route_a') return answer.labelMap.A;
  if (answer.q1Choice === 'route_b') return answer.labelMap.B;
  return null;
}
```

See [`DATA_SAVING.md`](DATA_SAVING.md) for persistence and production transport.
