# Supabase Launch Runbook

Supabase project `xyrmytymcipyntdtsksu` is the active persistence backend for the GitHub Pages deployment. The browser uses the public anon key in `runtime-config.js`; row-level security must allow inserts and deny anonymous reads.

Do not rerun `supabase-setup.sql` to update an existing database. `CREATE TABLE IF NOT EXISTS` does not modify existing tables.

## Safe order of operations

1. Open the Supabase SQL Editor for the production project.
2. Run `preflight.sql`. It is read-only.
3. Resolve every non-zero issue count documented as a blocker.
4. Export or snapshot the two benchmark tables.
5. Run `migrations/20260804_launch_hardening.sql`.
6. Run `migrations/20260804_write_only_rpc.sql`.
7. Run `postflight.sql` and save its output with the launch record.
8. If the migration must be reverted, run `rollback/20260804_launch_hardening.sql`.

The migration does not delete or rewrite participant records. It adds consistency constraints, supporting indexes, and a researcher-facing analysis view. `migrations/20260804_write_only_rpc.sql` then installs the write-only browser functions and revokes direct anon table access. The rollback removes these additions.

The 2026-08-04 read-only production smoke test detected anonymous answer reads. The migration therefore also revokes anonymous SELECT privileges and removes anon/PUBLIC SELECT policies. That security correction is intentionally not restored by the rollback.

## Required human decisions

- Confirm who may access the Supabase dashboard.
- Confirm the retention period and deletion contact.
- Decide whether participant names are necessary or participant codes are sufficient.
- Confirm backups or point-in-time recovery appropriate to the Supabase plan.
