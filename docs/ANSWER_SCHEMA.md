# Benchmark Answer Schema

The shared benchmark shell produces one answer record per completed comparison. Challenge configuration changes the allowed choices and follow-up questions, not the common record envelope.

## Completed Answer

```ts
type RouteType =
  | "calm_quiet"
  | "calm_nature"
  | "human" // legacy Calm records only
  | "livemap_fast"
  | "google"
  | "fast" // Current Calm reference route; never assigned to A/B.
  | "calm"; // legacy

type Q1Choice =
  | "route_a"
  | "route_b"
  | "route_c" // legacy
  | "all_three_work_well" // legacy
  | "none_work_well"
  | "either"
  | "neither"
  | "hard_to_judge"
  | "both_work_well"
  | "both_work_poorly"
  | "multiple_routes" // legacy
  | "not_sure";

type Q2Reason =
  | "quieter_or_less_busy_streets"
  | "more_trees_or_green_space"
  | "more_near_water"
  | "more_beautiful_streets_or_surroundings"
  | "less_need_to_watch_traffic"
  | "takes_less_time"
  | "easier_to_follow"
  | "familiar_route_or_area"
  | "other"
  | "not_sure";

type Q3Issue =
  // Calm Route Comparison
  | "not_enough_greenery_water"
  | "too_busy_or_crowded"
  | "lacks_nice_streets_surroundings"
  | "extra_time_distance_not_worth_it"
  | "too_similar"
  | "too_complex"
  | "streets_too_busy_or_noisy"
  | "not_enough_trees_or_green_space"
  | "not_enough_route_near_water"
  | "not_enough_beautiful_or_pleasant_surroundings"
  | "too_much_attention_traffic"
  | "takes_too_long"
  | "hard_to_follow"
  | "prefer_another_known_route"
  | "other"
  | "not_sure"
  // Fast vs Google Fast
  | "longer_time"
  | "unnecessary_detour"
  | "misses_shortcut"
  | "crossing_friction"
  | "misses_nicer_route"
  | "may_not_be_walkable"
  // Accepted legacy values from the first Fast benchmark
  | "longer_distance"
  | "unclear_shortcut"
  | "lacks_amenities"
  | "more_elevation"
  | "more_stairs"
  | "more_turns";

type BenchmarkAnswerV2 = {
  v: 2;
  type: "bench-ux";
  test: "calm_route_comparison" | "ari_fast_vs_google";
  source: "calm-route-comparison" | "fast-google-benchmark";

  captureId: string;          // Idempotency key.
  benchmarkRunId: string;     // Compatibility alias of sessionId.
  sessionId: string;
  sessionStartedAt: string;   // ISO timestamp.
  roundId: string;
  roundNumber: number;        // One-based.
  pairId: string;
  participantName: string;
  participantId: string;       // Deterministic for the same normalized name/code and challenge.
  rater: string;              // Compatibility alias of participantName.

  routeAssignment: {
    routeA: RouteType;
    routeB: RouteType;
    routeC?: RouteType;
  };
  routeAType: RouteType;
  routeBType: RouteType;
  routeCType: RouteType | null;
  labelMap: {
    A: RouteType;
    B: RouteType;
    C?: RouteType;
  };
  labels: {
    A: RouteSnapshot;
    B: RouteSnapshot;
    C?: RouteSnapshot;
  };

  origin: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; label?: string };

  q1Choice: Q1Choice;
  choice: Q1Choice;            // Compatibility alias of q1Choice.
  q1Choices: Q1Choice[];       // One current selection; legacy records may contain several.
  q1KnowsBetter: boolean;      // Optional Q1 flag: participant knows a better Calm route.
  q1BetterRouteNote: string;   // Optional route description; only valid when q1KnowsBetter is true.
  q2Separate: "yes" | "no" | "not_sure" | null; // Legacy non-current challenge field.
  q2Reasons: Q2Reason[];       // Why Route A, Route B, or both worked well.
  q2Note: string;              // Optional supporting detail after any Q2 reason is selected.
  q2Other?: string;            // Legacy detail field from the first Calm Q2 implementation.
  q3WorthShowing?: "a_lot" | "somewhat" | "a_little" | "not_at_all" | "not_sure" | null;
                                  // Current Calm value-vs-Fast answer. Omitted by historical records.
  q3Issues: Q3Issue[];
  reasons: Q3Issue[];          // Compatibility alias of q3Issues.
  q3Note: string;
  q3NoteKind: "fast_alternative" | "supporting_detail" | null;
  note: string;                // Compatibility alias.
  metricsShown: boolean;       // Route time/distance metrics were visible during the comparison.
  fastRouteShown: boolean;     // Fast was drawn as the reference route during the value question.
  fastRoute: RouteSnapshot | null; // Exact Fast reference and timing supplied for this round.

  clientTs: string;
  createdAt: string;
};

type RouteSnapshot = {
  routeId: string;
  routeType: RouteType;
  source: string | null;
  metadata: Record<string, unknown> | null;
};

type BenchmarkAnswerV3 = Omit<BenchmarkAnswerV2, "v"> & {
  v: 3;
  corpusVersion: "calm-curated-v2";
  corpusFingerprint: string; // Lowercase SHA-256 of the ordered route and diagnostics sources.
};
```

The duplicate names (`benchmarkRunId` / `sessionId`, `choice` / `q1Choice`, `reasons` / `q3Issues`) preserve compatibility with the first ARI benchmark dashboard while keeping the current question flow explicit. For current Calm records, `q1Choice` and the single entry in `q1Choices` match. Historical three-route and multi-select records remain readable.

## Challenge Rules

The exact participant-facing wording and conditional flow are catalogued in [`QUESTIONNAIRE.md`](QUESTIONNAIRE.md). This document defines how those answers are stored and validated.

### Calm Route Comparison

Q1 choices:

- `route_a`
- `route_b`
- `both_work_well`
- `none_work_well`
- `hard_to_judge`

`route_c`, `multiple_routes`, and `all_three_work_well` are accepted only for legacy three-route records.

Follow-ups:

| Q1 choice | Q2 | Q3 |
| --- | --- | --- |
| `route_a`, `route_b` | Preference reasons required | `q3WorthShowing` required |
| `both_work_well` | Preference reasons required | `q3WorthShowing` required |
| `none_work_well` | Empty | Rejection reasons required; `q3WorthShowing` empty |
| `hard_to_judge` | Empty | Empty |

For Route A, Route B, and Both work well, the Q3 map redraws the selected Calm route(s) with the round's Fast reference and displays every visible route's rounded time. Fast remains a reference route only: it is never assigned to Route A or Route B. Historical Calm records without `q3WorthShowing` retain their previous validation behavior.

For current Calm records, `q3Note` with `q3NoteKind: "fast_alternative"` answers **When would you choose Fast instead of a Calm route? (Optional)**. It may contain up to 500 characters only when `q3WorthShowing` is `a_lot`, `somewhat`, or `a_little`; the UI clears it if the participant changes to `not_at_all` or `not_sure`. Rejection-branch detail uses `q3NoteKind: "supporting_detail"`. Historical records without `q3NoteKind` retain their original generic `q3Note` meaning.

For `none_work_well`, the Q3 prompt asks what made the participant choose neither route and uses the dedicated one-or-both-routes rejection reasons. `not_sure` is exclusive, and an optional note appears after any reason is selected.

When Calm Q2 is required, at least one `q2Reasons` value must be selected. `not_sure` is exclusive with the concrete reasons. After any reason is selected, `q2Note` may contain optional supporting detail. Historical records may use `q2Other` for detail entered after selecting `other`; records saved before Calm Q2 was introduced may omit these additive fields and remain readable.

When `q1KnowsBetter` is `true`, `q1BetterRouteNote` may contain up to 500 characters describing the route the participant has in mind. It must be empty when `q1KnowsBetter` is `false`. The field is additive, so historical records without it normalize to an empty string.

### Fast vs Google Fast

Q1 choices:

- `route_a`
- `route_b`
- `both_work_well`
- `both_work_poorly`
- `not_sure` (I'm not sure)

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
type BenchmarkProgressV2 = {
  v: 2;
  type: "bench-progress";
  test: BenchmarkAnswerV2["test"];
  source: BenchmarkAnswerV2["source"];
  benchmarkRunId: string;
  sessionId: string;
  participantName: string;
  participantId: string;
  sessionStartedAt: string;
  roundIndex: number;          // Zero-based current round.
  completedRounds: number;
  goalCheckpointPending: boolean; // True while the final-completion state is active.
  pairId: string | null;
  routeAssignment: BenchmarkAnswerV2["routeAssignment"] | null;
  questionStep: "q1" | "q2" | "q3";
  partialAnswer: Partial<BenchmarkAnswerV2> | null;
  savedAt: string;
};

type BenchmarkProgressV3 = Omit<BenchmarkProgressV2, "v" | "partialAnswer"> & {
  v: 3;
  corpusVersion: BenchmarkAnswerV3["corpusVersion"];
  corpusFingerprint: BenchmarkAnswerV3["corpusFingerprint"];
  partialAnswer: Partial<BenchmarkAnswerV3> | null;
};
```

Version 1 and historical version 2 records remain readable for analysis. The participant app produces strict v3 Calm records for `calm-curated-v2`: they must reference one of the 23 corpus pairs, use a round from 1–23, carry matching route IDs, capture IDs, participant metadata, corpus version/fingerprint, and satisfy every current conditional question. Version 1/2 records are not combined with the v3 corpus in Results.

## Idempotency

`captureId` is stable for one session round and must be used as the server idempotency key. Retrying the same completed comparison returns the existing record instead of appending a duplicate.

## Analysis Example

Decode a visible route choice without exposing provider identity to the tester:

```js
function selectedRouteType(answer) {
  if (answer.q1Choice === 'route_a') return answer.labelMap.A;
  if (answer.q1Choice === 'route_b') return answer.labelMap.B;
  if (answer.q1Choice === 'route_c') return answer.labelMap.C; // legacy
  return null;
}
```

See [`DATA_SAVING.md`](DATA_SAVING.md) for persistence and production transport.
