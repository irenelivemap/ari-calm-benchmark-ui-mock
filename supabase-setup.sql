-- ARI Calm Benchmark — Supabase setup
-- Run this once in your Supabase project's SQL editor.
-- Dashboard → SQL Editor → New query → paste → Run

-- One row per pair judged. capture_id is the dedup key (sessionId-round-N).
create table if not exists benchmark_answers (
  id             bigint generated always as identity primary key,
  capture_id     text        not null,
  session_id     text        not null,
  test           text        not null,
  participant_name text,
  pair_id        text,
  payload        jsonb       not null,
  created_at     timestamptz not null default now(),

  constraint benchmark_answers_capture_id_key unique (capture_id)
);

create index if not exists benchmark_answers_test_created
  on benchmark_answers (test, created_at);

-- One row per session, always the latest progress checkpoint.
create table if not exists benchmark_progress (
  id         bigint generated always as identity primary key,
  session_id text        not null,
  test       text        not null,
  payload    jsonb       not null,
  updated_at timestamptz not null default now(),

  constraint benchmark_progress_session_id_key unique (session_id)
);

-- Row-level security: anon key can write (from the app) but not read.
-- Your team reads via the Supabase dashboard or with the service_role key.
alter table benchmark_answers  enable row level security;
alter table benchmark_progress enable row level security;

create policy "anon insert answers"
  on benchmark_answers for insert to anon with check (true);

create policy "anon upsert progress"
  on benchmark_progress for insert to anon with check (true);

create policy "anon update progress"
  on benchmark_progress for update to anon using (true);

-- To read answers as a teammate (Supabase dashboard uses service_role, so
-- this is only needed if you query via the anon key directly):
-- create policy "anon read answers"
--   on benchmark_answers for select to anon using (true);
