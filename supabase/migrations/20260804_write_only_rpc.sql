-- Write-only browser API for the production Supabase project.
-- Direct anon table access stays revoked; these functions validate the envelope,
-- perform idempotent writes, and never return participant records.

begin;

create or replace function public.submit_benchmark_answer(p_record jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  affected integer;
  capture text := p_record->>'captureId';
  session text := p_record->>'sessionId';
  test_id text := p_record->>'test';
begin
  if jsonb_typeof(p_record) is distinct from 'object'
    or coalesce(capture, '') = ''
    or coalesce(session, '') = ''
    or test_id not in ('calm_route_comparison', 'calm_vs_fast', 'ari_fast_vs_google')
    or length(capture) > 200
    or length(session) > 200
    or pg_column_size(p_record) > 1048576
  then
    raise exception 'Invalid benchmark answer envelope' using errcode = '22023';
  end if;

  insert into public.benchmark_answers (
    capture_id, session_id, test, participant_name, pair_id, payload
  ) values (
    capture,
    session,
    test_id,
    nullif(left(p_record->>'participantName', 80), ''),
    nullif(left(p_record->>'pairId', 200), ''),
    p_record
  )
  on conflict (capture_id) do nothing;

  get diagnostics affected = row_count;
  return jsonb_build_object('status', case when affected = 1 then 'saved' else 'duplicate' end);
end
$function$;

create or replace function public.save_benchmark_progress(p_record jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  session text := p_record->>'sessionId';
  test_id text := p_record->>'test';
  saved_at timestamptz;
begin
  if jsonb_typeof(p_record) is distinct from 'object'
    or coalesce(session, '') = ''
    or test_id not in ('calm_route_comparison', 'calm_vs_fast', 'ari_fast_vs_google')
    or length(session) > 200
    or pg_column_size(p_record) > 1048576
  then
    raise exception 'Invalid benchmark progress envelope' using errcode = '22023';
  end if;

  begin
    saved_at := coalesce(nullif(p_record->>'savedAt', '')::timestamptz, now());
  exception when others then
    raise exception 'Invalid progress timestamp' using errcode = '22023';
  end;

  insert into public.benchmark_progress (session_id, test, payload, updated_at)
  values (session, test_id, p_record, saved_at)
  on conflict (session_id) do update
    set test = excluded.test,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    where public.benchmark_progress.updated_at <= excluded.updated_at;

  return jsonb_build_object('status', 'saved');
end
$function$;

revoke all on function public.submit_benchmark_answer(jsonb) from public;
revoke all on function public.save_benchmark_progress(jsonb) from public;
grant execute on function public.submit_benchmark_answer(jsonb) to anon;
grant execute on function public.save_benchmark_progress(jsonb) to anon;

revoke all on public.benchmark_answers from anon, authenticated;
revoke all on public.benchmark_progress from anon, authenticated;

drop policy if exists "anon insert answers" on public.benchmark_answers;
drop policy if exists "anon upsert progress" on public.benchmark_progress;
drop policy if exists "anon update progress" on public.benchmark_progress;

commit;
