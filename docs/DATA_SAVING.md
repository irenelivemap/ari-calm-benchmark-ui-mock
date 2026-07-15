# Benchmark Data Saving

The benchmark separates completed answers from resumable progress:

1. A completed comparison appends one idempotent answer record.
2. An unfinished session upserts one progress record.
3. Results read the same challenge dataset and never maintain a second answer source.

The browser implements this contract in `src/data/calm-benchmark-data.js` with local storage. When runtime configuration supplies `dataApiBase`, `src/data/benchmark-transport.js` also delivers the same validated records to production endpoints.

## Challenge Datasets

Challenges do not share progress or answers.

| Challenge | Test ID | Local storage key |
| --- | --- | --- |
| Fast vs Calm | `calm_vs_fast` | `ari-calm-benchmark-dataset-v1` |
| Fast vs Google Fast | `ari_fast_vs_google` | `ari-fast-google-benchmark-dataset-v1` |

The `Reset test data` control currently clears both datasets. It exists for the single-tester design phase and must be removed before production research.

## Dataset Shape

```ts
type BenchmarkDatasetV1 = {
  v: 1;
  type: "calm-benchmark-dataset"; // Historical type retained for compatibility.
  test: "calm_vs_fast" | "ari_fast_vs_google";
  updatedAt: string;
  sessions: Record<string, SessionSummary>;
  progressBySessionId: Record<string, BenchmarkProgressV1>;
  answers: BenchmarkAnswerV1[];
};
```

Completed answers are append-only and idempotent by `captureId`. Progress is an upsert by `sessionId`.

## Save Interfaces

The benchmark shell receives persistence adapters when mounted:

```js
AriCalmBenchmark.mount(root, {
  answerSink: async answer => {
    // Persist one completed answer.
  },
  progressSink: async progress => {
    // Upsert the current unfinished session.
  }
});
```

In `index.html`, these adapters always call the active challenge's local repository first. Production additionally calls the HTTP transport. Failed requests enter `ari-benchmark-http-outbox-v1` and retry without interrupting the participant.

Queued answers deduplicate by `captureId`. Queued progress deduplicates by test and session, so only the newest unsent state survives. A newer successful progress write removes any older queued version before the outbox flushes.

## Production Endpoints

`server/data-api.js` is the reference implementation of these endpoints (packaged by `deploy/data-api.Dockerfile`): file-backed, zero-dependency, validating with the same module the browser uses.

```http
POST /api/v1/benchmarks/{testId}/answers
Idempotency-Key: {captureId}
Content-Type: application/json
```

```http
PUT /api/v1/benchmarks/{testId}/sessions/{sessionId}/progress
Content-Type: application/json
```

```http
GET /api/v1/benchmarks/{testId}/sessions/{sessionId}/progress
```

```http
GET /api/v1/benchmarks/{testId}/answers
Accept: application/x-ndjson
```

The server should:

- validate the challenge's conditional questions
- enforce idempotency by `captureId`
- upsert progress by `sessionId`
- preserve `clientTs` and add a server `receivedAt`
- preserve the hidden route assignment and route snapshots
- reject records whose `test` does not match the endpoint

## Dashboard Feed

The answer feed is newline-delimited JSON, one completed answer per line. Records retain the first benchmark's compatibility vocabulary:

- `type: "bench-ux"`
- `benchmarkRunId`
- `captureId`
- `rater`
- `choice`
- `reasons`
- `labels.A` / `labels.B`
- `labelMap.A` / `labelMap.B`
- `clientTs`

Current aliases such as `sessionId`, `participantName`, `q1Choice`, and `q3Issues` remain present.

## Verification

The browser exposes helpers for the active challenge:

```js
ariCalmData.verify()
ariCalmData.snapshot()
ariCalmData.exportJsonl()
```

`ariCalmData` is a historical global name. Its methods always target the challenge selected when the page loaded.

Automated checks:

```bash
npm test
```

Tests cover validation, challenge-specific conditional questions, duplicate submissions, partial progress, legacy migration, NDJSON export, and results aggregation.

See [`ANSWER_SCHEMA.md`](ANSWER_SCHEMA.md) for record fields.
