-- Read-only verification after the launch-hardening migration.

begin transaction read only;

select conrelid::regclass as table_name, conname, convalidated
from pg_constraint
where conname in (
  'benchmark_answers_payload_matches_v2',
  'benchmark_progress_payload_matches_v2',
  'benchmark_answers_calm_corpus_v3',
  'benchmark_progress_calm_corpus_v3'
)
order by conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname = 'benchmark_answers_session_round_unique';

select schemaname, viewname, viewowner
from pg_views
where schemaname = 'public' and viewname = 'benchmark_answers_analysis';

select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('benchmark_answers', 'benchmark_progress')
order by tablename, policyname;

select relname, relrowsecurity
from pg_class
where oid in ('public.benchmark_answers'::regclass, 'public.benchmark_progress'::regclass)
order by relname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('benchmark_answers', 'benchmark_progress', 'benchmark_answers_analysis')
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;

-- This must return zero rows. Any anon/PUBLIC SELECT policy is a blocker.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('benchmark_answers', 'benchmark_progress')
  and cmd = 'SELECT'
  and (roles && array['anon'::name, 'public'::name]);

select
  test,
  schema_version,
  coalesce(corpus_version, 'legacy-or-unversioned') as corpus_version,
  coalesce(corpus_fingerprint, 'legacy-or-unversioned') as corpus_fingerprint,
  count(*)::bigint as answer_count
from public.benchmark_answers_analysis
group by test, schema_version, corpus_version, corpus_fingerprint
order by test, schema_version, corpus_version;

select
  test,
  coalesce(payload->>'v', '1') as schema_version,
  coalesce(payload->>'corpusVersion', 'legacy-or-unversioned') as corpus_version,
  coalesce(payload->>'corpusFingerprint', 'legacy-or-unversioned') as corpus_fingerprint,
  count(*)::bigint as progress_count
from public.benchmark_progress
group by test, payload->>'v', payload->>'corpusVersion', payload->>'corpusFingerprint'
order by test, schema_version, corpus_version;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'benchmark_answers_analysis'
  and column_name in ('q1_knows_better', 'q1_better_route_note', 'q3_note_kind', 'corpus_version', 'corpus_fingerprint')
order by ordinal_position;

select
  position(
    'more_beautiful_streets_or_surroundings'
    in pg_get_functiondef('public.submit_benchmark_answer(jsonb)'::regprocedure)
  ) > 0 as allows_selected_route_surroundings_reason,
  position(
    'not_enough_beautiful_or_pleasant_surroundings'
    in pg_get_functiondef('public.submit_benchmark_answer(jsonb)'::regprocedure)
  ) > 0 as allows_neither_surroundings_reason,
  position(
    'q1BetterRouteNote'
    in pg_get_functiondef('public.submit_benchmark_answer(jsonb)'::regprocedure)
  ) > 0 as validates_better_route_note,
  position(
    'q3Note is allowed only after a positive Q3 answer'
    in pg_get_functiondef('public.submit_benchmark_answer(jsonb)'::regprocedure)
  ) > 0 as validates_fast_alternative_note;

select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('anon', 'public.get_calm_route_explorers()', 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_calm_route_explorers';

select
  count(*)::integer as route_explorers,
  coalesce(max(routes_compared), 0)::integer as highest_route_count,
  coalesce(max(completion_order), 0)::integer as latest_completion_order
from public.get_calm_route_explorers();

rollback;
