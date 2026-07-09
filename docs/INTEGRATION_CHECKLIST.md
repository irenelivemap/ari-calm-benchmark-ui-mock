# Integration Checklist

Use this checklist when moving the calm benchmark UI into `livemap-routing`.

## Frontend

- [ ] Add Leaflet CSS/JS or use the app's existing map bundle.
- [ ] Copy/adapt `src/styles/calm-benchmark.css`.
- [ ] Copy/adapt `src/app/calm-benchmark.js`.
- [ ] Create a route, for example `/bench/calm` or `/calm-benchmark`.
- [ ] Add a root element for the benchmark UI.
- [ ] Mount with `AriCalmBenchmark.mount(...)`.
- [ ] Pass the participant name from the start screen/session.
- [ ] Implement `routePairProvider`.
- [ ] Implement `answerSink`.
- [ ] Implement `progressSink` if testers should be able to save and leave mid-session.
- [ ] Verify map pan/zoom works.
- [ ] Verify `Fit routes` works.
- [ ] Verify Street View handoff works or replace with the app's real Street View control.
- [ ] Verify Save progress persists completed and current-round state.
- [ ] Verify the question panel can be minimized and expanded.
- [ ] Verify Exit test explains whether completed/current rounds are saved.
- [ ] Verify Route A / Route B remain blinded.
- [ ] Verify Q2/Q3 conditional display.
- [ ] Verify answer payload includes hidden route assignment.

## Backend / Routing Model

- [ ] Create route pair endpoint returning `CalmBenchmarkPair`.
- [ ] Ensure each pair includes both `fast` and `calm` geometries.
- [ ] Ensure geometry order is `[lat, lng]`.
- [ ] Ensure geometry is ordered origin to destination.
- [ ] Include stable `pairId`.
- [ ] Include stable route IDs for `fast` and `calm`.
- [ ] Do not expose route labels, scores, time, distance, or calm/fast status to the tester UI.
- [ ] Store submitted answers.
- [ ] Store route assignment from answer payload.
- [ ] Add result analysis for calm chosen vs fast chosen.

## Acceptance Criteria

- [ ] Tester can inspect both routes clearly on a large map.
- [ ] Tester can zoom and pan the map.
- [ ] Tester can fit both routes back into view.
- [ ] Tester can open Street View when they need more visual context.
- [ ] Tester can minimize the question panel to focus on the map.
- [ ] Tester can save progress before leaving the session.
- [ ] Tester can submit Q1.
- [ ] Q2 appears for Route A, Route B, or Either.
- [ ] Q3 appears for Route A, Route B, or Neither.
- [ ] Submitted answer can be used to identify whether the tester chose the calm route.
- [ ] UI still works if the calm route is assigned to Route A or Route B.
