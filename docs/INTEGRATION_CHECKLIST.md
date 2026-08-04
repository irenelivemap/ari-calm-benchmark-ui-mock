# Production Integration Checklist

Use this checklist when connecting the shared benchmark UI to `livemap-routing` or another production host. Do not modify the external host repository from this prototype unless that work is explicitly requested.

## Choose the Challenge

- [ ] Confirm the challenge test ID and route types.
- [ ] Confirm the exact question copy, choices, and follow-up rules.
- [ ] Add or update the profile in `CHALLENGE_CONFIGS` in `index.html`.
- [ ] Keep provider names hidden from active Route A/B labels.

## Frontend

- [x] Load the benchmark CSS and browser modules.
- [x] Provide a root element for `AriCalmBenchmark.mount(...)`.
- [x] Persist a stable same-device participant ID; pass a host identity when cross-device identity is required.
- [x] Implement `routePairProvider` against the real route source.
- [ ] Implement `answerSink` against production persistence.
- [ ] Implement `progressSink` when sessions must resume across devices or browsers.
- [x] Select or replace the map adapter.
- [x] Remove the design-phase `Reset test data` control in production mode.
- [x] Keep the internal team-results route out of participant navigation in production mode.

## Public Host

- [x] Prepare `/routing/`, `/routing/fast-vs-google`, and `/routing/calm-route-comparison` (with `/routing/fast-vs-calm` as a legacy alias).
- [x] Proxy routing calls through the public host at `/api/v1/routing`.
- [x] Disable query-based API, Google key, reset, and QA overrides in production.
- [x] Add LinkedIn/Open Graph metadata and a social preview image.
- [ ] Deploy the prepared container with the infrastructure team's deployment permissions.
- [ ] Point `game.livemap.sh` DNS at that deployment.
- [ ] Provide a browser-restricted Google Maps key for `https://game.livemap.sh/*`.
- [x] Connect production persistence to the existing Supabase project with insert-only anonymous access.

## Route Provider

- [ ] Return the route keys required by the active challenge.
- [ ] Use `[latitude, longitude]` geometry ordered from origin to destination.
- [ ] Provide stable `pairId` and route IDs.
- [ ] Return the same logical pair when retrying one session round.
- [ ] Include metadata needed for later analysis without exposing it in Q1.
- [ ] Validate that every geometry contains at least two valid points.

## Persistence

- [ ] Validate answers and progress with the same rules as `src/data/calm-benchmark-data.js`.
- [ ] Make answer submission idempotent by `captureId`.
- [ ] Upsert progress by `sessionId`.
- [ ] Preserve the hidden A/B assignment.
- [ ] Preserve route snapshots and provider metadata.
- [ ] Reject records whose `test` does not match the endpoint.
- [ ] Add server-side `receivedAt` while preserving client timestamps.
- [ ] Expose an authenticated NDJSON or equivalent answer feed for analysis.
- [ ] If replacing Supabase with the optional data API, set `ARI_DATA_ADMIN_TOKEN` and `ARI_ALLOWED_ORIGINS`.
- [x] Confirm production refuses to start only when neither Supabase nor the optional data API is configured.
- [ ] Complete every owner decision in `docs/DATA_GOVERNANCE.md`, especially retention, deletion contact, and whether names are necessary.
- [ ] Run the read-only Supabase preflight, apply the reviewed migration, and save the postflight results.
- [ ] Run `npm run smoke:production` after deployment and perform one explicitly authorized test submission.

## Map Behavior

- [ ] Draw active routes with the existing orange/green Route A/B colors.
- [ ] Preserve pan, pinch, scroll, double-click, and zoom behavior.
- [ ] Fit all active routes within the area not covered by the question panel.
- [ ] Keep Fit independent from the tester's manual camera state until pressed.
- [ ] Enable Street View point targeting only while the mode is active; near-route taps keep their route identity, other taps are neutral map points.
- [ ] Restore the exact map camera and question state after Street View closes.
- [ ] Provide an in-app unavailable state instead of opening an external fallback tab.

## Acceptance Criteria

- [ ] A new participant can start without team context.
- [ ] A returning participant resumes the same session, pair, assignment, question step, and partial answer.
- [ ] Route A/B assignment is randomized and remains blinded.
- [ ] The active challenge shows the correct question flow.
- [ ] Retrying a completed comparison does not create a duplicate answer.
- [ ] Leaving mid-round saves progress without submitting an incomplete answer.
- [ ] Community and team results decode choices from the hidden assignment correctly.
- [ ] Both active challenge URLs work on desktop and mobile.
- [ ] Keyboard focus, contrast, touch targets, and reduced motion meet `DESIGN.md`.
- [ ] `npm test` passes.
- [ ] `https://game.livemap.sh/routing/` loads without a path redirect loop.
- [ ] Both clean challenge URLs survive a direct page refresh.
- [ ] A real routing request succeeds through the same-origin public proxy.

## Challenge-specific Checks

### Calm Route Comparison

- [x] Assignable route keys are `calm_quiet` and `calm_nature`; every fixture also supplies a non-randomized `fast` reference route.
- [x] Route A/B and Both work well selections show the Calm preference-reasons Q2; the remaining neutral choices skip it.
- [x] Q1 offers Route A, Route B, Both work well, Both work poorly, and I'm not sure.
- [x] Route A, Route B, and Both work well require the value-vs-Fast Q3 and redraw the relevant Calm route(s) with Fast and all visible times.
- [x] Both work poorly ends after its rejection-reasons follow-up and never receives the value-vs-Fast Q3.
- [x] Both work poorly uses the dedicated one-or-both-routes rejection reasons and exclusive I'm not sure option.

### Fast vs Google Fast

- [ ] Route keys are `livemap_fast` and `google`.
- [ ] No Q2 is shown.
- [ ] Q3 is required only for Route A, Route B, or Both work poorly.
