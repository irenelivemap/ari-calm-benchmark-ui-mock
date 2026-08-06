# Data Governance Before Launch

This document separates implemented technical controls from decisions owned outside the repository. The current launch is an internal team study; the evaluation owner has accepted participant-name collection and chose not to make the remaining organizational policy items technical launch blockers.

## Data collected

- Participant-provided name or team-issued code.
- Deterministic participant ID derived from the normalized entered name or team-issued code, plus a per-run session ID.
- Route choices, reasons, optional comments, pair assignment, and timestamps.
- No account password, email address, precise participant location, or device fingerprint is intentionally collected.

## Implemented controls

- The start form collects only the participant name or team-issued code before testing begins.
- Participant writes use the public Supabase anon role through two write-only RPC functions. The only participant-readable team feed is the Route Explorers aggregate RPC, limited to participant name/code, stable participant ID, unique current-corpus route count, and a completion-order integer for participants who reached all 23 routes. The underlying completion timestamp remains private.
- Supabase row-level security blocks anonymous reads.
- Capture IDs make completed-answer writes idempotent.
- Current Calm records are validated against the 23-pair corpus and current questionnaire in the browser. The reviewed `20260805_calm_launch_fixes.sql` migration applies equivalent baseline database validation, enforces one answer per session round, and caps each Calm session at 23 answers. `20260806_questionnaire_extensions.sql` extends the database validation for the two current branch-specific surroundings reasons, the optional better-route note, and the conditional Fast-alternative note.
- Research exports can be checked with `npm run audit:data -- <file>`.

## Organizational follow-up

The evaluation owner confirmed on 2026-08-05 that this is an internal study and participant names are acceptable. The remaining items are organizational responsibilities rather than technical deployment tasks in this repository.

| Decision | Owner value required before launch |
| --- | --- |
| Purpose and lawful basis | Internal Calm-routing preference research; formal organizational wording remains outside this repository. |
| Whether names are necessary or participant codes are sufficient | Participant names accepted for this internal study (confirmed 2026-08-05) |
| Retention period | Team decision outside the technical launch gate. |
| Contact for access, correction, and deletion requests | Team decision outside the technical launch gate. |
| Authorized Supabase dashboard members | Supabase project owners manage access. |
| Backup / point-in-time recovery policy | A private, RLS-enabled `launch_backup` snapshot was created before migration; ongoing policy remains a team decision. |
| Export storage location and access list | Team decision outside the technical launch gate. |

## Technical launch gates

- [x] Apply migrations through `supabase/migrations/20260805_route_corpus_v2.sql` in the production Supabase project.
- [x] Run `supabase/postflight.sql` and verify the production invariants.
- [x] Apply `supabase/migrations/20260806_questionnaire_extensions.sql`, `20260806_route_explorers.sql`, and `20260806_route_explorer_completion_order.sql`, then rerun `supabase/postflight.sql` before deploying the matching participant UI (completed 2026-08-06).
- [x] Perform one clearly tagged production Calm submission, verify answer/progress/analysis rows, and remove only the tagged QA rows.
- [ ] Confirm dedicated Google and MapTiler browser keys are restricted to the exact participant origin and have quota alerts.

## Resolved production finding from 2026-08-04

The 2026-08-04 audit initially found participant answer data exposed to the anon role. The launch-hardening migration removed that access, and `npm run smoke:production` now verifies zero anonymous rows exposed. The follow-up write-only RPC migration preserves participant delivery without reopening table reads. The later Route Explorers function is a security-definer aggregate: it does not grant table access and cannot return answers, comments, sessions, timestamps, or pair identifiers. It returns only the ordinal finish position needed to break full-completion ties.

## Raw-data rules

- Treat `benchmark_answers` as append-only source data.
- Do not correct analysis problems by editing raw participant answers.
- Record exclusions and transformations in analysis code or a derived dataset.
- Date and identify every export used for analysis.
- Store the schema version with every record and retain legacy records unchanged.
- Test restoration, not only backup creation.
