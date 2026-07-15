# To Do

Working list from the live route-pairs and Street View integration (July 2026).

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
      Cloud console. It currently answers from any origin. Suggested allowlist:
      `*.livemap.sh`, `irenelivemap.github.io`, `127.0.0.1:8765`.
      Owner: whoever manages the Google Cloud project / `LIVEMAP_GOOGLE_MAPS_KEY`.
- [ ] Decide the tester-facing hosting for Street View sessions:
      keep GitHub Pages with one-time `?gmap=` key links, or deploy the benchmark
      next to the `livemap-routing` runtime so the key is env-injected
      (`LIVEMAP_GOOGLE_MAPS_KEY` → config pattern) and links stay key-free.
      Deploying next to the runtime also gives live route pairs in production
      because the routing facade becomes same-origin.
- [ ] Verify the Street View flow in a real browser once the key is configured:
      panorama opens from a route tap on both routes, exact camera and question
      state restore on `Back to map`, the mobile full-screen layer, the
      no-imagery state, and reduced-motion behavior.

## Live route pairs

- [ ] Verify the MapLibre map and random-pair flow in a real browser
      (`npm run start:live` next to a running routing service). The integration
      was verified headlessly against the live facade; a visual pass is pending.
- [ ] If the benchmark stays on GitHub Pages long-term, either add CORS headers
      for `irenelivemap.github.io` to the routing facade deployment or accept
      that live pairs remain a local/deployed-host feature.
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
