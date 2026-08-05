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
- [x] Persist a participant identity that is stable across devices for the same normalized name or participant code.
- [x] Implement `routePairProvider` against the real route source.
- [x] Implement `answerSink` against production Supabase persistence.
- [x] Implement `progressSink` with atomic local completion and monotonic remote checkpoints.
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
- [x] Connect production persistence to the existing Supabase project through write-only anonymous RPCs.

## GitHub Pages

- [x] Configure the repository Actions secret `ARI_GOOGLE_MAPS_KEY`; the deployed participant site loads Google Street View.
- [ ] In the key owner's Google Cloud console, restrict the shared key to the Maps JavaScript API and the exact participant origin, then add a quota alert.
- [x] Configure the repository Actions secret `ARI_MAPTILER_KEY`; the deployed participant site loads the `streets-v4` style.
- [ ] In the key owner's MapTiler console, restrict the shared key to the exact participant origin, then add a quota alert.
- [x] Build the participant artifact without writing the Google key into Git history.
- [x] Publish GitHub Pages through GitHub Actions.
- [x] Run the `Deploy participant site` workflow and confirm `streetViewConfigured: true` with `npm run smoke:production`.

## Route Provider

- [ ] Return the route keys required by the active challenge.
- [ ] Use `[latitude, longitude]` geometry ordered from origin to destination.
- [ ] Provide stable `pairId` and route IDs.
- [ ] Return the same logical pair when retrying one session round.
- [ ] Include metadata needed for later analysis without exposing it in Q1.
- [ ] Validate that every geometry contains at least two valid points.

## Persistence

- [x] Validate browser answers and progress with `src/data/calm-benchmark-data.js`; apply `20260805_calm_launch_fixes.sql` and `20260805_route_corpus_v2.sql` for equivalent current-Calm and corpus validation in Supabase.
- [x] Make answer submission idempotent by `captureId`.
- [x] Upsert progress by `sessionId` without accepting backward checkpoints.
- [x] Preserve the hidden A/B assignment.
- [x] Preserve route snapshots and provider metadata.
- [x] Reject records whose `test` does not match the endpoint.
- [x] Add server-side `receivedAt` while preserving client timestamps.
- [x] Expose the private, service-role-only `benchmark_answers_analysis` view for analysis.
- [ ] If replacing Supabase with the optional data API, set `ARI_DATA_ADMIN_TOKEN` and `ARI_ALLOWED_ORIGINS`.
- [x] Confirm production refuses to start only when neither Supabase nor the optional data API is configured.
- [x] Record the internal-study decision to collect participant names; remaining organizational follow-up stays in `docs/DATA_GOVERNANCE.md`.
- [x] Run the read-only Supabase preflight, create a private pre-migration snapshot, apply the reviewed migration, and verify the postflight invariants.
- [x] Run `npm run smoke:production` after deployment and perform one explicitly authorized test submission; verify and remove the tagged QA rows afterward.

## Map Behavior

- [x] MapTiler is the primary basemap, with bounded OpenFreeMap and Leaflet startup plus tile-failure detection.
- [x] A total map startup failure shows the compact in-map Retry state; the participant never sees an unexplained blank canvas.

- [x] Draw active routes with the established green/indigo Route A/B colors.
- [x] Preserve pan, pinch, scroll, double-click, and zoom behavior.
- [x] Fit all active routes within the area not covered by the question panel.
- [x] Keep Fit independent from the tester's manual camera state until pressed.
- [x] Enable Street View point targeting only while the mode is active; near-route taps keep their route identity, other taps are neutral map points.
- [x] Restore the exact map camera and question state and turn Street View mode off when Street View closes.
- [x] Provide an in-app unavailable state instead of opening an external fallback tab.

## Acceptance Criteria

- [x] A new participant can start without team context.
- [x] A returning participant resumes the same session, pair, assignment, question step, and partial answer.
- [x] Route A/B assignment is randomized and remains blinded.
- [x] The active Calm challenge shows the current question flow.
- [x] Retrying or immediately reloading a completed comparison does not create a duplicate answer or stale progress.
- [x] Leaving mid-round saves progress without submitting an incomplete answer.
- [x] Personal and team results decode choices and the current Calm reason taxonomies from the hidden assignment correctly.
- [x] The participant Calm URL works on desktop and at the 390px mobile breakpoint.
- [x] App-owned controls use 44px touch targets, corrected secondary-text contrast, semantic headings, and reduced-motion behavior.
- [x] `npm test` and the Calm Playwright regression suite pass locally.
- [ ] `https://game.livemap.sh/routing/` loads without a path redirect loop.
- [ ] Both clean challenge URLs survive a direct page refresh.
- [ ] A real routing request succeeds through the same-origin public proxy.

## Challenge-specific Checks

### Calm Route Comparison

- [x] Participant-facing wording and follow-up rules match [`QUESTIONNAIRE.md`](QUESTIONNAIRE.md).
- [x] Assignable route keys are `calm_quiet` and `calm_nature`; every fixture also supplies a non-randomized `fast` reference route.
- [x] Route geometry and diagnostics are generated together from the ordered `calm-curated-v2` manifest, and answers/progress carry its exact fingerprint.
- [x] Route A/B and Both work well selections show the Calm preference-reasons Q2; the remaining neutral choices skip it.
- [x] Q1 offers Route A, Route B, Both work well, Both work poorly, and I'm not sure.
- [x] Route A, Route B, and Both work well require the value-vs-Fast Q3 and redraw the relevant Calm route(s) with Fast and all visible times.
- [x] Both work poorly ends after its rejection-reasons follow-up and never receives the value-vs-Fast Q3.
- [x] Both work poorly uses the dedicated one-or-both-routes rejection reasons and exclusive I'm not sure option.

### Fast vs Google Fast

- [ ] Route keys are `livemap_fast` and `google`.
- [ ] No Q2 is shown.
- [ ] Q3 is required only for Route A, Route B, or Both work poorly.
