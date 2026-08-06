# Supabase Launch Runbook

Supabase project `xyrmytymcipyntdtsksu` is the active persistence backend for the GitHub Pages deployment. The browser uses the public anon key in `runtime-config.js` to call two write-only RPC functions. Row-level security and grants deny anonymous table reads and direct table writes.

The active project has already been migrated through `20260805_route_corpus_v2.sql` and verified with `postflight.sql`. The application source now also requires `20260806_questionnaire_extensions.sql`; apply and verify that migration before deploying the matching participant UI. The full sequence below is for a new environment or a reviewed rebuild.

Do not rerun `supabase-setup.sql` to update an existing database. `CREATE TABLE IF NOT EXISTS` does not modify existing tables.

## Safe order of operations

1. Open the Supabase SQL Editor for the production project.
2. Run `preflight.sql`. It is read-only.
3. Resolve every non-zero issue count documented as a blocker.
4. Export or snapshot the two benchmark tables.
5. Run `migrations/20260804_launch_hardening.sql`.
6. Run `migrations/20260804_write_only_rpc.sql`.
7. Run `migrations/20260805_calm_launch_fixes.sql`.
8. Run `migrations/20260805_route_corpus_v2.sql`.
9. Run `migrations/20260806_questionnaire_extensions.sql`.
10. Run `postflight.sql` and save its output with the launch record.
11. If the original launch-hardening migration must be reverted, run `rollback/20260804_launch_hardening.sql`. Do not use that rollback after collecting live participant data without reviewing its effect on the later migrations.

The migrations do not delete or rewrite participant records. The 2026-08-04 files add baseline consistency constraints, supporting indexes, a researcher-facing analysis view, and write-only browser functions. `migrations/20260805_calm_launch_fixes.sql` adds current 23-pair Calm questionnaire validation, one-answer-per-session-round enforcement, monotonic progress updates, and the current `q1_knows_better` analysis field. `migrations/20260805_route_corpus_v2.sql` binds new v3 records to the exact `calm-curated-v2` fingerprint and exposes that identity in the private analysis view. `migrations/20260806_questionnaire_extensions.sql` extends the write-only answer validator with the two branch-specific surroundings reasons, the optional better-route note, and the conditional Fast-alternative note, then exposes the better-route note in the private analysis view; it does not change tables or existing answers.

The 2026-08-04 read-only production smoke test detected anonymous answer reads. The migration therefore also revokes anonymous SELECT privileges and removes anon/PUBLIC SELECT policies. That security correction is intentionally not restored by the rollback.

`postflight.sql` is read-only. Its final result sets group saved answers and progress by schema version and route-corpus fingerprint, making any legacy/current mix visible without deleting historical research data.

## Operational ownership

- Confirm who may access the Supabase dashboard.
- Confirm the retention period and deletion contact.
- Participant names were accepted for the current internal study on 2026-08-05; revisit that decision for a different audience or study.
- Confirm backups or point-in-time recovery appropriate to the Supabase plan.
