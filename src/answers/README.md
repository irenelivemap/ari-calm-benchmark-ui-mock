# Answer Handling

Answers are collected from the question flow and sent through `answerSink`.

The UI saves the hidden route assignment with each answer:

```js
routeAssignment: {
  routeA: "fast" | "calm",
  routeB: "fast" | "calm"
}
```

The tester never sees this assignment. It exists so analysis can answer whether the calm route was chosen when it appeared as Route A or Route B.

The complete payload is documented in `../../docs/ANSWER_SCHEMA.md`.

Runtime validation, idempotent local persistence, progress upserts, and dashboard-ready JSONL export are implemented in `../data/calm-benchmark-data.js` and documented in `../../docs/DATA_SAVING.md`.
