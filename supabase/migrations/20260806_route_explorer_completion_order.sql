-- Stable finish order for the participant-facing Route Explorers leaderboard.
-- Apply after 20260806_route_explorers.sql. The RPC exposes only an ordinal
-- completion position; the underlying answer timestamps remain private.

begin;

revoke all on function public.get_calm_route_explorers() from public, anon, authenticated;
drop function public.get_calm_route_explorers();

create function public.get_calm_route_explorers()
returns table (
  participant_id text,
  participant_name text,
  routes_compared integer,
  completion_order integer
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
  first_route_completions as (
    select
      participant_id,
      route_number,
      min(created_at) as first_completed_at
    from current_answers
    group by participant_id, route_number
  ),
  participant_progress as (
    select
      participant_id,
      count(*)::integer as routes_compared,
      case when count(*) >= 23 then max(first_completed_at) end as completed_at
    from first_route_completions
    group by participant_id
  ),
  completion_positions as (
    select
      participant_id,
      row_number() over (order by completed_at, participant_id)::integer as completion_order
    from participant_progress
    where routes_compared >= 23
  )
  select
    progress.participant_id,
    names.participant_name,
    least(progress.routes_compared, 23)::integer as routes_compared,
    positions.completion_order
  from participant_progress progress
  join latest_names names using (participant_id)
  left join completion_positions positions using (participant_id)
  order by
    routes_compared desc,
    positions.completion_order nulls last,
    lower(names.participant_name),
    progress.participant_id
  limit 100
$function$;

revoke all on function public.get_calm_route_explorers() from public;
grant execute on function public.get_calm_route_explorers() to anon;

-- Keep the public feed isolated from the underlying research tables.
revoke all on public.benchmark_answers from anon, authenticated;
revoke all on public.benchmark_progress from anon, authenticated;
revoke all on public.benchmark_answers_analysis from anon, authenticated;

notify pgrst, 'reload schema';

commit;
