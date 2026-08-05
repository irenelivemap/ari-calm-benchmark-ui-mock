# Data Governance Before Launch

This checklist separates implemented technical controls from decisions the evaluation team must own. Do not describe the study as launch-ready until the decision fields below are completed.

## Data collected

- Participant-provided name or team-issued code.
- Generated same-device participant ID and per-run session ID.
- Route choices, reasons, optional comments, pair assignment, and timestamps.
- No account password, email address, precise participant location, or device fingerprint is intentionally collected.

## Implemented controls

- The start form collects only the participant name or team-issued code before testing begins.
- Participant writes use the public Supabase anon role through two write-only RPC functions.
- Supabase row-level security blocks anonymous reads.
- Capture IDs make completed-answer writes idempotent.
- Current Calm records are validated against the 23-pair corpus before delivery.
- Research exports can be checked with `npm run audit:data -- <file>`.

## Decisions required from the evaluation owner

| Decision | Owner value required before launch |
| --- | --- |
| Purpose and lawful basis | _To be completed_ |
| Whether names are necessary or participant codes are sufficient | _To be completed_ |
| Retention period | _To be completed_ |
| Contact for access, correction, and deletion requests | _To be completed_ |
| Authorized Supabase dashboard members | _To be completed_ |
| Backup / point-in-time recovery policy | _To be completed_ |
| Export storage location and access list | _To be completed_ |

## Current production blocker discovered 2026-08-04

The 2026-08-04 audit initially found participant answer data exposed to the anon role. The launch-hardening migration removed that access, and `npm run smoke:production` now verifies zero anonymous rows exposed. The follow-up write-only RPC migration preserves participant delivery without reopening table reads.

## Raw-data rules

- Treat `benchmark_answers` as append-only source data.
- Do not correct analysis problems by editing raw participant answers.
- Record exclusions and transformations in analysis code or a derived dataset.
- Date and identify every export used for analysis.
- Store the schema version with every record and retain legacy records unchanged.
- Test restoration, not only backup creation.
