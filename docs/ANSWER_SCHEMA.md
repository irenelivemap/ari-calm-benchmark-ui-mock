# Calm Benchmark Answer Schema

The UI produces one answer payload per submitted round.

```ts
type CalmBenchmarkAnswer = {
  sessionId: string;
  roundId: string;
  pairId: string;
  participantName: string;

  // Hidden assignment. The tester does not see this.
  routeAssignment: {
    routeA: "fast" | "calm";
    routeB: "fast" | "calm";
  };
  routeAType: "fast" | "calm";
  routeBType: "fast" | "calm";

  q1Choice:
    | "route_a"
    | "route_b"
    | "either"
    | "neither"
    | "hard_to_judge";

  q2Separate?: "yes" | "no" | "not_sure";

  q3Issues: Array<
    | "no_issue"
    | "not_calm_enough"
    | "too_similar"
    | "extra_time_distance_not_worth_it"
    | "too_busy"
    | "not_enough_greenery_water"
    | "not_pleasant_interesting"
    | "too_complex"
    | "not_comfortable"
    | "better_route_missing"
    | "need_more_information"
    | "other"
  >;

  q3Note: string;
  note: string;
  createdAt: string;
};
```

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

The UI currently submits once Q1 has an answer. The backend can choose to require Q2/Q3 more strictly, but that should be a product decision.

## Recommended Backend Endpoint

```http
POST /api/calm-benchmark/answers
Content-Type: application/json
```

Body:

```ts
CalmBenchmarkAnswer
```

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
