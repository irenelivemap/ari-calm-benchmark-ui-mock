# API Integration Surface

This folder describes the data-facing functions that turn the demo into the real benchmark.

The UI is mounted with three injectable functions:

```js
AriCalmBenchmark.mount(root, {
  routePairProvider,
  answerSink,
  progressSink
});
```

## `routePairProvider`

Loads one blinded-comparison source pair for the current round.

```js
async function routePairProvider({ sessionId, roundIndex }) {
  return CalmBenchmarkPair;
}
```

The returned shape is documented in `../../docs/DATA_CONTRACT.md`.

## `answerSink`

Persists a completed round answer.

```js
async function answerSink(answer) {
  // POST to the benchmark answer endpoint.
}
```

The payload shape is documented in `../../docs/ANSWER_SCHEMA.md`.

## `progressSink`

Optionally persists incomplete session progress when the tester exits before finishing.

```js
async function progressSink(progress) {
  // POST or PUT current session progress.
}
```

In the demo, `demo.html` stores answers/progress in `localStorage`. In the product, these functions should call the existing benchmark backend.
