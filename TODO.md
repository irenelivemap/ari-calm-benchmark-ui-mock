# To Do

Working list from the live route-pairs and Street View integration (July 2026).

## Launch: shareable LinkedIn link

Goal: share `https://game.livemap.sh/routing/` publicly. In dependency order.

Blockers — the link does not exist until these are done (owner: infrastructure):

1. [ ] Build the container from this repo's `Dockerfile`, push it to the
       registry, and deploy it on the paas. Everything it needs is in
       `deploy/README.md`.
2. [ ] Point `game.livemap.sh` DNS at that deployment and terminate HTTPS at
       the ingress.
3. [ ] Set the deployment environment: `ROUTING_UPSTREAM` (internal routing
       service address) and `ARI_GOOGLE_MAPS_KEY`.
4. [ ] In the Google Cloud console, restrict the Maps key to
       `https://game.livemap.sh/*` (plus the local origins still in use).
       It currently answers from any origin.

Blocker — without this the campaign collects nothing (owner: backend):

5. [ ] Implement and deploy the benchmark data API from
       [`docs/DATA_SAVING.md`](docs/DATA_SAVING.md): idempotent
       `POST /{testId}/answers`, `PUT .../progress`. Natural home: alongside
       `/api/v1/field` in the routing service. Then set `ARI_DATA_API_BASE`
       and `DATA_UPSTREAM`. Until then every public answer stays in the
       tester's browser.

Quality gate before posting (owner: Irene, ~1-2 hours on the live URL):

6. [ ] The pending real-browser checks below (control order, MapLibre
       controls, mobile split, Street View flow, live Fast vs Google pass).
7. [ ] Full pass on a real phone via the deployed URL — LinkedIn traffic is
       mostly mobile.
8. [ ] Run the acceptance section of
       [`docs/INTEGRATION_CHECKLIST.md`](docs/INTEGRATION_CHECKLIST.md)
       against `https://game.livemap.sh/routing/`.
9. [ ] Validate the link preview with LinkedIn's Post Inspector (OG tags and
       the social image are already in place).

Decisions for the post itself:

10. [ ] Which URL to share: the chooser (`/routing/`) or one challenge
        directly (`/routing/fast-vs-google`). One decision surface converts
        better for cold traffic; the chooser shows the family.
11. [ ] Expectation-setting: community results are per-browser until an
        aggregated results endpoint exists; the post copy should not promise
        a live global leaderboard.
12. [ ] Watch Google Maps quota during the campaign (Directions + Street View
        + map loads per visitor); set a billing alert in the Cloud console.

## Handoff state (2026-07-15)

Everything below is on `main` and live-tested locally against a running
`livemap-routing` service unless marked as needing a check:

- Both challenges generate live random Zurich route pairs (`route-pair-generator.js`);
  fixtures remain the automatic fallback. Local end-to-end setup:
  build/run the routing service (port 8989), then `npm run start:live`.
- Street View: works from any map point; split layout (map left, panorama
  right; stacked on mobile) with a draggable, per-device-persistent divider;
  seam glides open/shut with an eased camera restore.
- Map controls: zoom/camera are provider-native everywhere; Fit and the
  text-only `Street View` pill are adopted into the provider's top-right
  control container.
- Production host support is prepared for `game.livemap.sh/routing`: clean
  challenge paths, environment-backed runtime configuration, a same-origin
  routing proxy, production-only UI rules, LinkedIn metadata, and an HTTP
  persistence outbox.

Needs a visual check on a real browser (not yet verified):

- [ ] Google map: control column order — tools box top-right, Google camera
      D-pad below it. If they collide, reposition via
      `google.maps.ControlPosition` in `map-adapter.js` `ensure()`.
- [ ] MapLibre map: native navigation control sits beneath Fit/pill; tools
      adopt correctly after the async style load (onboarding coachmarks
      reposition at 1.2s/2.6s to cover this).
- [ ] Street View split on mobile: divider drag, pill/hint placement, and
      the question card staying hidden until Back to map.

Production-readiness items that were already tracked stay in
[`docs/INTEGRATION_CHECKLIST.md`](docs/INTEGRATION_CHECKLIST.md); this list covers
the newer follow-ups.

## Street View rollout

- [ ] Restrict the shared Google Maps browser key by HTTP referrer in the Google
      Cloud console. It currently answers from any origin. Required public host:
      `https://game.livemap.sh/*`; keep only the local/preview origins still used.
      Owner: whoever manages the Google Cloud project / `LIVEMAP_GOOGLE_MAPS_KEY`.
- [x] Choose a tester-facing host architecture: prepare the benchmark for
      `game.livemap.sh/routing`, with runtime-injected configuration and a
      same-origin routing proxy. See `deploy/README.md`.
- [ ] Verify the Street View flow in a real browser once the key is configured:
      panorama opens from a route tap on both routes, exact camera and question
      state restore on `Back to map`, the mobile full-screen layer, the
      no-imagery state, and reduced-motion behavior.

## Live route pairs

- [ ] Verify the MapLibre map and random-pair flow in a real browser
      (`npm run start:live` next to a running routing service). The integration
      was verified headlessly against the live facade; a visual pass is pending.
- [x] Avoid a public CORS dependency by proxying routing calls through
      `game.livemap.sh`; GitHub Pages remains a fixture-backed preview only.
- [x] Wire the Fast vs Google Fast challenge to live data: `livemap_fast` from
      the routing facade plus Google routes from the Directions SDK at run time.
      Google geometry is never persisted — caches keep metrics and snapped
      endpoints only, and the snap-fairness gate (40 m) redraws unfair matchups.
- [ ] Browser pass of the live Fast vs Google flow (needs facade + Maps key):
      pair loads, both routes render on the Google base map, resume re-fetches
      the Google path, fixture fallback still works without a key.

## Housekeeping

- [ ] Keep the Google key out of git everywhere (repo rule). `?gmap=` links and
      env injection are the approved delivery paths.
- [ ] Revisit the sampling region and the 400–3000 m distance gate once real
      testers give feedback on pair difficulty and walk length.
- [ ] Implement and connect the shared benchmark data API before public launch.
      The frontend transport and retry outbox are ready; `ARI_DATA_API_BASE`
      must not remain empty for a LinkedIn campaign.
