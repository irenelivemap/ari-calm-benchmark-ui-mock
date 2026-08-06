-- Privacy-limited team progress for the participant-facing Route Explorers list.
-- Apply after 20260806_questionnaire_extensions.sql. Anonymous clients receive
-- only the participant label, stable participant ID, and unique current-corpus
-- route count. Answers, choices, notes, sessions, timestamps, and pair IDs stay private.

begin;

create or replace function public.get_calm_route_explorers()
returns table (
  participant_id text,
  participant_name text,
  routes_compared integer
)
language sql
stable
security definer
set search_path = ''
as $function$
  with current_answers as (
    select
      a.created_at,
      nullif(a.payload->>'participantId', '') as participant_id,
      nullif(btrim(a.participant_name), '') as participant_name,
      substring(a.payload->'labels'->'A'->>'routeId' from '^calm-round-([0-9]+)-')::integer as route_number
    from public.benchmark_answers a
    where a.test = 'calm_route_comparison'
      and a.payload->>'corpusVersion' = 'calm-curated-v2'
      and a.payload->>'corpusFingerprint' = '20c716cbb91a4fb09f6eb86c686afeab5dd099378886b6bd1cc548adeb366715'
      and coalesce(a.payload->>'participantId', '') <> ''
      and coalesce(btrim(a.participant_name), '') <> ''
      and coalesce(a.payload->'labels'->'A'->>'routeId', '')
        ~ '^calm-round-([1-9]|1[0-9]|2[0-3])-(calm-quiet|calm-nature)$'
  ),
  latest_names as (
    select distinct on (participant_id)
      participant_id,
      participant_name
    from current_answers
    order by participant_id, created_at desc
  ),
  route_counts as (
    select
      participant_id,
      count(distinct route_number)::integer as routes_compared
    from current_answers
    group by participant_id
  )
  select
    counts.participant_id,
    names.participant_name,
    least(counts.routes_compared, 23)::integer as routes_compared
  from route_counts counts
  join latest_names names using (participant_id)
  order by routes_compared desc, lower(names.participant_name), counts.participant_id
  limit 100
$function$;

revoke all on function public.get_calm_route_explorers() from public;
grant execute on function public.get_calm_route_explorers() to anon;

-- The public feed does not require or imply direct table reads.
revoke all on public.benchmark_answers from anon, authenticated;
revoke all on public.benchmark_progress from anon, authenticated;
revoke all on public.benchmark_answers_analysis from anon, authenticated;

commit;
