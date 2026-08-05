# Data Governance Before Launch

This checklist separates implemented technical controls from decisions the evaluation team must own. Do not describe the study as launch-ready until the decision fields below are completed.

## Data collected

- Participant-provided name or team-issued code.
- Deterministic participant ID derived from the normalized entered name or team-issued code, plus a per-run session ID.
- Route choices, reasons, optional comments, pair assignment, and timestamps.
- No account password, email address, precise participant location, or device fingerprint is intentionally collected.

## Implemented controls

- The start form collects only the participant name or team-issued code before testing begins.
- Participant writes use the public Supabase anon role through two write-only RPC functions.
- Supabase row-level security blocks anonymous reads.
- Capture IDs make completed-answer writes idempotent.
- Current Calm records are validated against the 23-pair corpus in the browser. The reviewed `20260805_calm_launch_fixes.sql` migration applies equivalent database validation, enforces one answer per session round, and caps each Calm session at 23 answers.
- Research exports can be checked with `npm run audit:data -- <file>`.

## Organizational follow-up

The evaluation owner confirmed on 2026-08-05 that this is an internal study and participant names are acceptable. The remaining items are organizational responsibilities rather than technical deployment tasks in this repository.

| Decision | Owner value required before launch |
| --- | --- |
| Purpose and lawful basis | _To be completed_ |
| Whether names are necessary or participant codes are sufficient | Participant names accepted for this internal study (confirmed 2026-08-05) |
| Retention period | _To be completed_ |
| Contact for access, correction, and deletion requests | _To be completed_ |
| Authorized Supabase dashboard members | _To be completed_ |
| Backup / point-in-time recovery policy | _To be completed_ |
| Export storage location and access list | _To be completed_ |

## Technical launch gates

- [ ] Apply `supabase/migrations/20260805_calm_launch_fixes.sql` in the production Supabase project.
- [ ] Run `supabase/postflight.sql` and retain the output with the launch record.
- [ ] Perform one clearly tagged production Calm submission, verify answer and progress rows, export it, and run `npm run audit:data -- <export>`.
- [ ] Confirm dedicated Google and MapTiler browser keys are restricted to the exact participant origin and have quota alerts.

## Current production blocker discovered 2026-08-04

The 2026-08-04 audit initially found participant answer data exposed to the anon role. The launch-hardening migration removed that access, and `npm run smoke:production` now verifies zero anonymous rows exposed. The follow-up write-only RPC migration preserves participant delivery without reopening table reads.

## Raw-data rules

- Treat `benchmark_answers` as append-only source data.
- Do not correct analysis problems by editing raw participant answers.
- Record exclusions and transformations in analysis code or a derived dataset.
- Date and identify every export used for analysis.
- Store the schema version with every record and retain legacy records unchanged.
- Test restoration, not only backup creation.
