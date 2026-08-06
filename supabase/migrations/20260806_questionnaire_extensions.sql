-- Add the current Calm questionnaire extensions: branch-specific surroundings
-- reasons, the optional better-route description attached to the Q1 flag,
-- and the conditional Fast-alternative note after positive Q3 answers.
-- Apply after 20260805_route_corpus_v2.sql. This replaces only the write-only
-- answer RPC validation; tables, existing answers, and the route corpus stay unchanged.

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
  participant text := p_record->>'participantName';
  pair_id text := p_record->>'pairId';
  q1 text := p_record->>'q1Choice';
  round_number integer;
  pair_number integer;
begin
  if jsonb_typeof(p_record) is distinct from 'object'
    or coalesce(capture, '') = ''
    or coalesce(session, '') = ''
    or coalesce(participant, '') = ''
    or coalesce(test_id, '') not in ('calm_route_comparison', 'calm_vs_fast', 'ari_fast_vs_google')
    or length(capture) > 200
    or length(session) > 200
    or length(participant) > 80
    or length(coalesce(pair_id, '')) > 200
    or pg_column_size(p_record) > 65536
  then
    raise exception 'Invalid benchmark answer envelope' using errcode = '22023';
  end if;

  if test_id = 'calm_route_comparison' then
    if coalesce(p_record->>'source', '') <> 'calm-route-comparison'
      or coalesce(p_record->>'type', '') <> 'bench-ux'
      or coalesce(p_record->>'v', '') !~ '^[0-9]+$'
      or (p_record->>'v')::integer < 2
      or coalesce(p_record->>'participantId', '') = ''
      or length(p_record->>'participantId') > 200
      or coalesce(p_record->>'roundNumber', '') !~ '^([1-9]|1[0-9]|2[0-3])$'
      or coalesce(pair_id, '') !~ '^calm-route-comparison-(0[1-9]|1[0-9]|2[0-3])-round-([1-9]|1[0-9]|2[0-3])$'
      or jsonb_typeof(p_record->'q1KnowsBetter') is distinct from 'boolean'
      or coalesce(q1, '') not in ('route_a', 'route_b', 'both_work_well', 'none_work_well', 'hard_to_judge')
    then
      raise exception 'Invalid current Calm answer identity' using errcode = '22023';
    end if;

    round_number := (p_record->>'roundNumber')::integer;
    pair_number := substring(pair_id from 'calm-route-comparison-([0-9]+)-')::integer;
    if substring(pair_id from 'round-([0-9]+)$')::integer <> round_number
      or capture <> session || '-round-' || round_number::text
      or p_record->>'roundId' is distinct from capture
      or p_record->>'benchmarkRunId' is distinct from session
    then
      raise exception 'Calm answer round identity is inconsistent' using errcode = '22023';
    end if;

    if jsonb_typeof(p_record->'routeAssignment') is distinct from 'object'
      or (p_record->'routeAssignment') - 'routeA'::text - 'routeB'::text <> '{}'::jsonb
      or coalesce(p_record->'routeAssignment'->>'routeA', '') not in ('calm_quiet', 'calm_nature')
      or coalesce(p_record->'routeAssignment'->>'routeB', '') not in ('calm_quiet', 'calm_nature')
      or p_record->'routeAssignment'->>'routeA' = p_record->'routeAssignment'->>'routeB'
    then
      raise exception 'Invalid Calm route assignment' using errcode = '22023';
    end if;

    if p_record->'labels'->'A'->>'routeType' is distinct from p_record->'routeAssignment'->>'routeA'
      or p_record->'labels'->'B'->>'routeType' is distinct from p_record->'routeAssignment'->>'routeB'
      or p_record->'labels'->'A'->>'routeId' is distinct from (
        'calm-round-' || pair_number::text || '-'
        || case p_record->'routeAssignment'->>'routeA' when 'calm_quiet' then 'calm-quiet' else 'calm-nature' end
      )
      or p_record->'labels'->'B'->>'routeId' is distinct from (
        'calm-round-' || pair_number::text || '-'
        || case p_record->'routeAssignment'->>'routeB' when 'calm_quiet' then 'calm-quiet' else 'calm-nature' end
      )
    then
      raise exception 'Calm route labels do not match the curated pair' using errcode = '22023';
    end if;

    if jsonb_typeof(p_record->'q1Choices') is distinct from 'array'
      or jsonb_array_length(p_record->'q1Choices') <> 1
      or p_record->'q1Choices'->>0 <> q1
      or jsonb_typeof(p_record->'q2Reasons') is distinct from 'array'
      or jsonb_typeof(p_record->'q3Issues') is distinct from 'array'
      or (p_record ? 'q1BetterRouteNote' and jsonb_typeof(p_record->'q1BetterRouteNote') is distinct from 'string')
      or (p_record ? 'q3NoteKind'
        and p_record->'q3NoteKind' <> 'null'::jsonb
        and jsonb_typeof(p_record->'q3NoteKind') is distinct from 'string')
      or length(coalesce(p_record->>'q1BetterRouteNote', '')) > 500
      or length(coalesce(p_record->>'q2Note', '')) > 500
      or length(coalesce(p_record->>'q3Note', '')) > 500
      or p_record->>'q2Separate' is not null
    then
      raise exception 'Invalid Calm questionnaire shape' using errcode = '22023';
    end if;

    if exists (
      select 1 from jsonb_array_elements_text(p_record->'q2Reasons') as reason(value)
      where value not in (
        'quieter_or_less_busy_streets', 'more_trees_or_green_space',
        'more_near_water', 'more_beautiful_streets_or_surroundings',
        'less_need_to_watch_traffic', 'takes_less_time',
        'easier_to_follow', 'familiar_route_or_area', 'other', 'not_sure'
      )
    ) or exists (
      select 1 from jsonb_array_elements_text(p_record->'q3Issues') as issue(value)
      where value not in (
        'streets_too_busy_or_noisy', 'not_enough_trees_or_green_space',
        'not_enough_route_near_water',
        'not_enough_beautiful_or_pleasant_surroundings', 'too_much_attention_traffic',
        'takes_too_long', 'hard_to_follow', 'prefer_another_known_route',
        'other', 'not_sure'
      )
    ) then
      raise exception 'Unknown Calm questionnaire option' using errcode = '22023';
    end if;

    if ('not_sure' = any(array(select jsonb_array_elements_text(p_record->'q2Reasons')))
        and jsonb_array_length(p_record->'q2Reasons') > 1)
      or ('not_sure' = any(array(select jsonb_array_elements_text(p_record->'q3Issues')))
        and jsonb_array_length(p_record->'q3Issues') > 1)
      or jsonb_array_length(p_record->'q2Reasons') <> (
        select count(distinct reason.value)
        from jsonb_array_elements_text(p_record->'q2Reasons') as reason(value)
      )
      or jsonb_array_length(p_record->'q3Issues') <> (
        select count(distinct issue.value)
        from jsonb_array_elements_text(p_record->'q3Issues') as issue(value)
      )
    then
      raise exception 'Calm questionnaire choices must be unique and not_sure must be exclusive' using errcode = '22023';
    end if;

    if jsonb_array_length(p_record->'q2Reasons') = 0
      and coalesce(p_record->>'q2Note', '') <> ''
    then
      raise exception 'Calm Q2 notes require a selected reason' using errcode = '22023';
    end if;

    if coalesce(p_record->>'q1BetterRouteNote', '') <> ''
      and p_record->>'q1KnowsBetter' is distinct from 'true'
    then
      raise exception 'Calm better-route notes require the Q1 flag' using errcode = '22023';
    end if;

    if coalesce(p_record->>'q3Note', '') = '' and p_record->>'q3NoteKind' is not null then
      raise exception 'Calm q3NoteKind requires q3Note' using errcode = '22023';
    end if;

    if q1 in ('route_a', 'route_b', 'both_work_well') then
      if jsonb_array_length(p_record->'q2Reasons') = 0
        or coalesce(p_record->>'q3WorthShowing', '') not in ('a_lot', 'somewhat', 'a_little', 'not_at_all', 'not_sure')
        or jsonb_array_length(p_record->'q3Issues') <> 0
      then
        raise exception 'Incomplete Calm route-choice follow-up' using errcode = '22023';
      end if;
      if coalesce(p_record->>'q3Note', '') <> ''
        and p_record->>'q3WorthShowing' not in ('a_lot', 'somewhat', 'a_little')
      then
        raise exception 'Calm q3Note is allowed only after a positive Q3 answer' using errcode = '22023';
      end if;
      if coalesce(p_record->>'q3Note', '') <> ''
        and p_record->>'q3NoteKind' is distinct from 'fast_alternative'
      then
        raise exception 'Calm positive q3Note requires fast_alternative kind' using errcode = '22023';
      end if;
    elsif q1 = 'none_work_well' then
      if jsonb_array_length(p_record->'q2Reasons') <> 0
        or p_record->>'q3WorthShowing' is not null
        or jsonb_array_length(p_record->'q3Issues') = 0
      then
        raise exception 'Incomplete Calm rejection follow-up' using errcode = '22023';
      end if;
      if coalesce(p_record->>'q3Note', '') <> ''
        and p_record->>'q3NoteKind' is distinct from 'supporting_detail'
      then
        raise exception 'Calm rejection q3Note requires supporting_detail kind' using errcode = '22023';
      end if;
    elsif jsonb_array_length(p_record->'q2Reasons') <> 0
      or p_record->>'q3WorthShowing' is not null
      or jsonb_array_length(p_record->'q3Issues') <> 0
      or coalesce(p_record->>'q3Note', '') <> ''
      or p_record->>'q3NoteKind' is not null
    then
      raise exception 'Unexpected follow-up for uncertain Calm answer' using errcode = '22023';
    end if;

    if exists (
      select 1 from public.benchmark_answers
      where session_id = session
        and test = test_id
        and coalesce(payload->>'roundNumber', '') ~ '^[0-9]+$'
        and (payload->>'roundNumber')::integer = round_number
        and capture_id <> capture
    ) or (
      not exists (select 1 from public.benchmark_answers where capture_id = capture)
      and (select count(*) from public.benchmark_answers where session_id = session and test = test_id) >= 23
    ) then
      raise exception 'Calm session round limit exceeded' using errcode = '22023';
    end if;
  end if;

  insert into public.benchmark_answers (
    capture_id, session_id, test, participant_name, pair_id, payload
  ) values (
    capture, session, test_id, participant, nullif(pair_id, ''), p_record
  )
  on conflict (capture_id) do nothing;

  get diagnostics affected = row_count;
  return jsonb_build_object('status', case when affected = 1 then 'saved' else 'duplicate' end);
end
$function$;

revoke all on function public.submit_benchmark_answer(jsonb) from public;
grant execute on function public.submit_benchmark_answer(jsonb) to anon;

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
  nullif(a.payload->>'corpusFingerprint', '') as corpus_fingerprint,
  nullif(a.payload->>'q1BetterRouteNote', '') as q1_better_route_note,
  nullif(a.payload->>'q3NoteKind', '') as q3_note_kind
from public.benchmark_answers a;

revoke all on public.benchmark_answers_analysis from anon, authenticated;
grant select on public.benchmark_answers_analysis to service_role;

commit;
