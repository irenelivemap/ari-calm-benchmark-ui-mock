# Calm Benchmark Launch Checklist

The canonical participant deployment is the Vercel site:
`https://ari-benchmark.vercel.app/`.

The earlier Vercel domains redirect to the canonical site. GitHub Pages remains a fallback.

Supabase project `xyrmytymcipyntdtsksu` is the active production persistence backend. The optional Node data API and the unconfigured `game.livemap.sh` host are not prerequisites for this launch.

## Required before inviting participants

- [x] Apply migrations through [`supabase/migrations/20260805_route_corpus_v2.sql`](supabase/migrations/20260805_route_corpus_v2.sql) and verify the [`supabase/postflight.sql`](supabase/postflight.sql) invariants.
- [x] Apply [`supabase/migrations/20260806_questionnaire_extensions.sql`](supabase/migrations/20260806_questionnaire_extensions.sql) and rerun [`supabase/postflight.sql`](supabase/postflight.sql) before deploying the matching questionnaire UI.
- [x] Make one clearly tagged production Calm submission; verify the answer, progress, and researcher-view projection in Supabase; then remove only the tagged QA rows.
- [x] Create a private, RLS-enabled `launch_backup` snapshot of both production tables before applying the migration (the Free Supabase plan has no scheduled backups).
- [ ] Confirm the Google Maps key is limited to the Maps JavaScript API and the exact participant origin.
- [ ] Confirm the MapTiler key is limited to the exact participant origin.
- [ ] Add quota alerts for both browser-key providers.

The live provider probe on 2026-08-07 confirmed that both keys work from `https://ari-benchmark.vercel.app/`, but a request carrying a foreign referrer was not rejected. The available Google Cloud account does not own the deployed Google key, and the MapTiler console is not signed in. Origin/API restrictions and quota alerts therefore remain provider-console tasks for the owners of the shared keys.

## Recorded study choices

- [x] This is an internal study and the evaluation owner has chosen to collect participant names rather than issue participant codes.
- [x] Organizational governance follow-up is tracked in [`docs/DATA_GOVERNANCE.md`](docs/DATA_GOVERNANCE.md) but is not treated as a technical deployment task in this repository.

## Automated launch gate

Run:

```bash
npm ci
npm test
npm run test:e2e
npm run smoke:production -- https://ari-benchmark.vercel.app/
npm audit
```

The automated suite must pass before a Vercel production deployment. GitHub Pages runs the same unit and Calm Playwright regression suites before publishing its fallback artifact.

## Verified in the 2026-08-05 QA pass

- [x] MapTiler renders the production Calm routes.
- [x] OpenFreeMap and Leaflet are bounded fallbacks; Leaflet tile failures surface a Retry state.
- [x] Google Street View opens from Calm routes and closes back to ordinary map mode.
- [x] A newly loaded first comparison survives reload before Q1 is answered.
- [x] A completed answer and its next progress checkpoint are stored atomically.
- [x] Delayed progress cannot move a participant backward.
- [x] Calm results use the current route-choice and rejection-reason taxonomies.
- [x] Participant results say `Your results`; team framing remains researcher-only.
- [x] Participant identity consolidates by normalized name across sessions and devices; identical names remain an accepted internal-study limitation.
- [x] App-owned touch targets, heading structure, and introductory secondary-text contrast were corrected.
- [x] Desktop and 390px mobile Calm flows are covered by browser regression tests.

## Verified in the 2026-08-07 launch pass

- [x] Renamed the canonical Vercel project/domain to `ari-benchmark` and confirmed earlier Vercel domains redirect to it.
- [x] Submitted a tagged answer through the canonical production domain and verified the exact Q1, Q2, and Q3 labels in Supabase.
- [x] Removed only the tagged QA answer and progress rows and confirmed that neither remains.
- [x] Confirmed anonymous direct reads expose no raw answers or progress.
- [x] Confirmed MapTiler, Street View configuration, participant maps, and Results maps load from the canonical domain.

## Future infrastructure, not a launch dependency

- Deploy the optional container at `game.livemap.sh` only if the team wants a custom host or live routing facade.
- Deploy the optional file-backed data API only if Supabase is intentionally replaced.
- Keep Fast vs Google work separate from the Calm participant launch checklist.
