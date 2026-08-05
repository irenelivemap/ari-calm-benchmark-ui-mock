-- READ-ONLY launch preflight for project xyrmytymcipyntdtsksu.
-- Run this before the launch-hardening migration. It changes no data or schema.

begin transaction read only;

select 'answer_rows' as metric, count(*)::bigint as value from public.benchmark_answers
union all
select 'progress_rows', count(*)::bigint from public.benchmark_progress
union all
select 'answer_sessions', count(distinct session_id)::bigint from public.benchmark_answers
union all
select 'answer_participants', count(distinct nullif(payload->>'participantId', ''))::bigint
from public.benchmark_answers;

-- Every value below must be zero before applying the migration.
with issues as (
  select 'answer_payload_not_object' as issue, count(*)::bigint as affected_rows
  from public.benchmark_answers where jsonb_typeof(payload) is distinct from 'object'
  union all
  select 'answer_capture_id_mismatch', count(*)::bigint
  from public.benchmark_answers where payload->>'captureId' is distinct from capture_id
  union all
  select 'answer_session_id_mismatch', count(*)::bigint
  from public.benchmark_answers where payload->>'sessionId' is distinct from session_id
  union all
  select 'answer_test_mismatch', count(*)::bigint
  from public.benchmark_answers where payload->>'test' is distinct from test
  union all
  select 'progress_payload_not_object', count(*)::bigint
  from public.benchmark_progress where jsonb_typeof(payload) is distinct from 'object'
  union all
  select 'progress_session_id_mismatch', count(*)::bigint
  from public.benchmark_progress where payload->>'sessionId' is distinct from session_id
  union all
  select 'progress_test_mismatch', count(*)::bigint
  from public.benchmark_progress where payload->>'test' is distinct from test
)
select * from issues order by issue;

-- Current v2 Calm records should satisfy all of these conditions.
select
  count(*) filter (where nullif(payload->>'participantId', '') is null) as missing_participant_id,
  count(*) filter (where coalesce(payload->>'pairId', '') !~ '^calm-route-comparison-[0-9]{2}-round-[0-9]+$') as invalid_pair_id,
  count(*) filter (where case
    when coalesce(payload->>'roundNumber', '') ~ '^[0-9]+$'
      then (payload->>'roundNumber')::integer not between 1 and 23
    else true
  end) as invalid_round_number
from public.benchmark_answers
where test = 'calm_route_comparison'
  and payload->>'source' = 'calm-route-comparison'
  and case
    when coalesce(payload->>'v', '') ~ '^[0-9]+$' then (payload->>'v')::integer
    else 1
  end >= 2;

-- Session-level integrity. Every value should be zero for completed sessions.
with sessions as (
  select
    session_id,
    count(*) as answer_count,
    count(distinct payload->>'captureId') as capture_count,
    count(distinct payload->>'pairId') as pair_count,
    count(distinct payload->>'roundNumber') as round_count,
    min(case when payload->>'roundNumber' ~ '^[0-9]+$' then (payload->>'roundNumber')::integer end) as min_round,
    max(case when payload->>'roundNumber' ~ '^[0-9]+$' then (payload->>'roundNumber')::integer end) as max_round
  from public.benchmark_answers
  where test = 'calm_route_comparison'
  group by session_id
)
select
  count(*) filter (where answer_count > 23) as sessions_over_23,
  count(*) filter (where answer_count <> capture_count) as sessions_with_duplicate_capture,
  count(*) filter (where answer_count <> pair_count) as sessions_with_duplicate_pair,
  count(*) filter (where answer_count <> round_count) as sessions_with_duplicate_round,
  count(*) filter (where answer_count = 23 and (min_round <> 1 or max_round <> 23)) as malformed_complete_sessions
from sessions;

-- Progress must never claim more completed rounds than saved answers.
select count(*) as progress_ahead_of_answers
from public.benchmark_progress p
left join (
  select session_id, count(*) as answer_count
  from public.benchmark_answers
  group by session_id
) a using (session_id)
where case
    when coalesce(p.payload->>'completedRounds', '') ~ '^[0-9]+$'
      then (p.payload->>'completedRounds')::integer
    else 0
  end > coalesce(a.answer_count, 0);

select test, coalesce(payload->>'v', 'legacy') as schema_version, count(*)::bigint
from public.benchmark_answers
group by test, coalesce(payload->>'v', 'legacy')
order by test, schema_version;

rollback;
