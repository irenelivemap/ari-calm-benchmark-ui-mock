# Calm Benchmark Data Saving

The calm benchmark follows the same useful separation as the first ARI Fast vs Google benchmark:

1. The benchmark writes one appendable record per completed comparison.
2. A separate progress record preserves an unfinished session.
3. A dashboard reads newline-delimited answer records from a data endpoint or snapshot.

The browser demo uses the same contract through `src/data/calm-benchmark-data.js` and stores a versioned dataset in `localStorage`. Production should replace only the transport, not the record shape.

## Storage Model

```ts
type CalmBenchmarkDatasetV1 = {
  v: 1;
  type: "calm-benchmark-dataset";
  test: "calm_vs_fast";
  updatedAt: string;
  sessions: Record<string, SessionSummary>;
  progressBySessionId: Record<string, CalmBenchmarkProgressV1>;
  answers: CalmBenchmarkAnswerV1[];
};
```

Completed comparisons are append-only and idempotent by `captureId`. Repeating the same request must return the existing record rather than append a duplicate.

Progress is an upsert by `sessionId`. It preserves:

- original session ID and start time
- current round and completed count
- current route pair ID
- hidden A/B assignment
- current question step
- partial answers
- latest save timestamp

## Dashboard Compatibility

Answer records intentionally retain the field vocabulary used by the earlier dashboard:

- `type: "bench-ux"`
- `test: "calm_vs_fast"`
- `benchmarkRunId`
- `captureId`
- `rater`
- `choice`
- `reasons`
- `labels.A` / `labels.B`
- `labelMap.A` / `labelMap.B`
- `clientTs`

Calm-specific aliases such as `sessionId`, `q1Choice`, `q2Separate`, and `q3Issues` remain present so analysis does not have to infer the question flow.

The dashboard feed should be returned as NDJSON:

```http
GET /api/v1/benchmarks/calm/answers
Accept: application/x-ndjson
```

Each line is one `CalmBenchmarkAnswerV1` object. The static dashboard can cache a snapshot exactly as the ARI Fast dashboard does, while a refresh service reads the newest endpoint data.

## Production Endpoints

```http
POST /api/v1/benchmarks/calm/answers
Idempotency-Key: {captureId}
Content-Type: application/json
```

```http
PUT /api/v1/benchmarks/calm/sessions/{sessionId}/progress
Content-Type: application/json
```

```http
GET /api/v1/benchmarks/calm/sessions/{sessionId}/progress
```

The server should add `receivedAt` and preserve the client `createdAt` / `clientTs`. It must validate conditional questions before accepting a completed answer.

## Verification

In the demo browser console:

```js
ariCalmData.verify()
ariCalmData.snapshot()
ariCalmData.exportJsonl()
```

Automated checks:

```bash
node --test tests/calm-benchmark-data.test.js
```

Verification covers schema validity, conditional questions, duplicate submissions, partial progress, migration from the previous localStorage keys, and JSONL export.
