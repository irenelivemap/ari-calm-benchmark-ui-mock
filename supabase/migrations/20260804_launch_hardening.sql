-- Apply only after supabase/preflight.sql reports zero envelope inconsistencies.
-- This migration does not rewrite or delete participant data.

begin;

-- Defence in depth: the production audit found that anonymous SELECT access
-- had been enabled outside the canonical setup file. Remove table privileges
-- and any SELECT policies that include anon or PUBLIC before adding constraints.
revoke select, update, delete on public.benchmark_answers from anon, authenticated;
revoke select, delete on public.benchmark_progress from anon, authenticated;

do $policy_cleanup$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('benchmark_answers', 'benchmark_progress')
      and cmd = 'SELECT'
      and (roles && array['anon'::name, 'public'::name])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$policy_cleanup$;

do $constraint_setup$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.benchmark_answers'::regclass
      and conname = 'benchmark_answers_payload_matches_v2'
  ) then
    alter table public.benchmark_answers
      add constraint benchmark_answers_payload_matches_v2 check (
        jsonb_typeof(payload) = 'object'
        and payload->>'captureId' = capture_id
        and payload->>'sessionId' = session_id
        and payload->>'test' = test
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.benchmark_progress'::regclass
      and conname = 'benchmark_progress_payload_matches_v2'
  ) then
    alter table public.benchmark_progress
      add constraint benchmark_progress_payload_matches_v2 check (
        jsonb_typeof(payload) = 'object'
        and payload->>'sessionId' = session_id
        and payload->>'test' = test
      ) not valid;
  end if;
end
$constraint_setup$;

alter table public.benchmark_answers
  validate constraint benchmark_answers_payload_matches_v2;

alter table public.benchmark_progress
  validate constraint benchmark_progress_payload_matches_v2;

create index if not exists benchmark_answers_session_round
  on public.benchmark_answers (
    session_id,
    (case when coalesce(payload->>'roundNumber', '') ~ '^[0-9]+$'
      then (payload->>'roundNumber')::integer end)
  );

create index if not exists benchmark_progress_test_updated
  on public.benchmark_progress (test, updated_at desc);

create or replace view public.benchmark_answers_analysis
with (security_invoker = true)
as
select
  a.id,
  a.created_at as received_at,
  a.capture_id,
  a.session_id,
  a.test,
  a.participant_name,
  nullif(a.payload->>'participantId', '') as participant_id,
  nullif(a.payload->>'consentVersion', '') as consent_version,
  nullif(a.payload->>'consentedAt', '') as consented_at,
  a.pair_id,
  case when coalesce(a.payload->>'roundNumber', '') ~ '^[0-9]+$'
    then (a.payload->>'roundNumber')::integer end as round_number,
  a.payload->>'q1Choice' as q1_choice,
  a.payload->'q1Choices' as q1_choices,
  a.payload->'q2Reasons' as q2_reasons,
  nullif(a.payload->>'q2Note', '') as q2_note,
  a.payload->>'q3WorthShowing' as q3_worth_showing,
  a.payload->'q3Issues' as q3_issues,
  nullif(a.payload->>'q3Note', '') as q3_note,
  a.payload->'routeAssignment'->>'routeA' as route_a_type,
  a.payload->'routeAssignment'->>'routeB' as route_b_type,
  a.payload->'labels'->'A'->>'routeId' as route_a_id,
  a.payload->'labels'->'B'->>'routeId' as route_b_id,
  case when coalesce(a.payload->>'v', '') ~ '^[0-9]+$'
    then (a.payload->>'v')::integer else 1 end as schema_version,
  nullif(a.payload->>'createdAt', '') as client_created_at,
  a.payload
from public.benchmark_answers a;

revoke all on public.benchmark_answers_analysis from anon, authenticated;
grant select on public.benchmark_answers_analysis to service_role;

commit;
