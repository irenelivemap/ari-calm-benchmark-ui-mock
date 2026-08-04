-- Removes only objects added by the 2026-08-04 launch-hardening migration.
-- Participant data and the original tables/policies remain untouched.
-- Anonymous read revocations are intentionally NOT rolled back: restoring
-- public access to participant data would reintroduce the launch blocker.

begin;

drop view if exists public.benchmark_answers_analysis;
drop index if exists public.benchmark_answers_session_round;
drop index if exists public.benchmark_progress_test_updated;
alter table public.benchmark_answers
  drop constraint if exists benchmark_answers_payload_matches_v2;
alter table public.benchmark_progress
  drop constraint if exists benchmark_progress_payload_matches_v2;

commit;
