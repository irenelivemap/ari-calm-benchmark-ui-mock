-- Read-only verification after the launch-hardening migration.

begin transaction read only;

select conrelid::regclass as table_name, conname, convalidated
from pg_constraint
where conname in (
  'benchmark_answers_payload_matches_v2',
  'benchmark_progress_payload_matches_v2'
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

select test, schema_version, count(*)::bigint as answer_count
from public.benchmark_answers_analysis
group by test, schema_version
order by test, schema_version;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'benchmark_answers_analysis'
  and column_name = 'q1_knows_better';

rollback;
