# Benchmark Data Saving

The benchmark separates completed answers from resumable progress:

1. A completed comparison appends one idempotent answer record.
2. An unfinished session upserts one progress record.
3. Results read the same challenge dataset and never maintain a second answer source.

The browser implements this contract in `src/data/calm-benchmark-data.js` with local storage. GitHub Pages sends the same validated records through the write-only Supabase RPCs used by `src/data/supabase-transport.js`; direct anon table access and reads are blocked. A self-hosted deployment can instead supply `dataApiBase` and use `src/data/benchmark-transport.js`. Researcher reads happen in the Supabase dashboard or through an authenticated server-side feed.

## Challenge Datasets

Challenges do not share progress or answers.

| Challenge | Test ID | Local storage key |
| --- | --- | --- |
| Calm Route Comparison | `calm_route_comparison` | `ari-calm-route-comparison-dataset-calm-curated-v2` |
| Fast vs Google Fast | `ari_fast_vs_google` | `ari-fast-google-benchmark-dataset-v1` |

The `Reset test data` control is a local-development aid enabled only when runtime configuration sets `showReset: true`. Production removes it from the DOM and never exposes it to participants.

## Dataset Shape

```ts
type BenchmarkDatasetV2 = {
  v: 2;
  type: "calm-benchmark-dataset"; // Historical type retained for compatibility.
  test: "calm_route_comparison" | "ari_fast_vs_google";
  updatedAt: string;
  sessions: Record<string, SessionSummary>;
  progressBySessionId: Record<string, BenchmarkProgressV2 | BenchmarkProgressV3>;
  answers: Array<BenchmarkAnswerV2 | BenchmarkAnswerV3>;
};
```

The dataset envelope retains version 2 for compatibility; the current Calm corpus stores version 3 answer and progress records inside it.

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

In `index.html`, these adapters always call the active challenge's local repository first. A completed answer and the checkpoint after it are committed in one local dataset write, and a newly loaded pair is saved before the participant answers Q1. Production additionally calls the configured Supabase or HTTP transport. Localhost and `file://` previews never select the production Supabase transport automatically. Failed requests enter the selected transport's local outbox; production keeps the participant on the current comparison and exposes the sync failure until delivery succeeds. A production build with neither transport configured fails closed and cannot start data collection.

Queued answers deduplicate by `captureId`. Queued progress deduplicates by test and session, so only the newest unsent state survives. A newer successful progress write removes any older queued version before the outbox flushes.

Legacy Calm records remain readable for historical analysis, but the participant app does not import legacy answers or progress into `calm-curated-v2`. Versioned answers and progress carry `corpusVersion` and `corpusFingerprint`; the local dataset and transport outbox also use a corpus-specific namespace. Result aggregation consolidates only records from the active corpus, using the normalized entered name or participant code. New participant IDs are deterministic across devices; team-issued codes are required to distinguish different people who share a name.

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

The feed and progress-read endpoints require `Authorization: Bearer <ARI_DATA_ADMIN_TOKEN>`. Participant browsers never receive this token. Production writes are restricted to `ARI_ALLOWED_ORIGINS` and rate-limited by the reference API.

The answer feed is newline-delimited JSON, one completed answer per line. Records retain the first benchmark's compatibility vocabulary:

- `type: "bench-ux"`
- `benchmarkRunId`
- `captureId`
- `rater`
- `choice`
- `reasons`
- `labels.A` / `labels.B` / optional `labels.C`
- `labelMap.A` / `labelMap.B` / optional `labelMap.C`
- `clientTs`

Current aliases such as `sessionId`, `participantName`, `q1Choice`, and `q3Issues` remain present.

For Calm answers, the optional `q1BetterRouteNote` travels in both partial progress and the final answer payload. It is stored only when `q1KnowsBetter` is `true`, is limited to 500 characters, and is exposed to researchers as `q1_better_route_note` in the private Supabase analysis view.

The existing `q3Note` field stores the conditional Fast-alternative response for current Calm records and `q3NoteKind: "fast_alternative"` labels that meaning explicitly. It is autosaved with partial progress and accepted in a final answer only when `q3WorthShowing` is `a_lot`, `somewhat`, or `a_little`. Rejection details use `q3NoteKind: "supporting_detail"`; historical records without a kind retain the field's previous generic meaning.

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
