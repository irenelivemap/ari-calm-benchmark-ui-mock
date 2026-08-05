-- Bind v3 Calm answers and progress to the second curated route corpus.
-- Apply after 20260805_calm_launch_fixes.sql. Existing v1/v2 records remain
-- readable; only new v3 records are required to carry the exact corpus ID.

begin;

alter table public.benchmark_answers
  add constraint benchmark_answers_calm_corpus_v3 check (
    test <> 'calm_route_comparison'
    or case
      when coalesce(payload->>'v', '') ~ '^[0-9]+$' and (payload->>'v')::integer >= 3
        then payload->>'corpusVersion' = 'calm-curated-v2'
          and payload->>'corpusFingerprint' = '20c716cbb91a4fb09f6eb86c686afeab5dd099378886b6bd1cc548adeb366715'
      else true
    end
  ) not valid;

alter table public.benchmark_progress
  add constraint benchmark_progress_calm_corpus_v3 check (
    test <> 'calm_route_comparison'
    or case
      when coalesce(payload->>'v', '') ~ '^[0-9]+$' and (payload->>'v')::integer >= 3
        then payload->>'corpusVersion' = 'calm-curated-v2'
          and payload->>'corpusFingerprint' = '20c716cbb91a4fb09f6eb86c686afeab5dd099378886b6bd1cc548adeb366715'
      else true
    end
  ) not valid;

alter table public.benchmark_answers
  validate constraint benchmark_answers_calm_corpus_v3;

alter table public.benchmark_progress
  validate constraint benchmark_progress_calm_corpus_v3;

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
  a.payload,
  case when jsonb_typeof(a.payload->'q1KnowsBetter') = 'boolean'
    then (a.payload->>'q1KnowsBetter')::boolean end as q1_knows_better,
  nullif(a.payload->>'corpusVersion', '') as corpus_version,
  nullif(a.payload->>'corpusFingerprint', '') as corpus_fingerprint
from public.benchmark_answers a;

revoke all on public.benchmark_answers_analysis from anon, authenticated;
grant select on public.benchmark_answers_analysis to service_role;

commit;
