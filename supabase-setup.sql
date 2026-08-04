-- ARI Calm Benchmark — Supabase production persistence setup.
-- ACTIVE PROJECT: xyrmytymcipyntdtsksu (GitHub Pages production backend).
-- The browser uses the public anon key. Never place a service_role key in this repo.
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

  constraint benchmark_answers_capture_id_key unique (capture_id),
  constraint benchmark_answers_payload_matches check (
    jsonb_typeof(payload) = 'object'
    and payload->>'captureId' = capture_id
    and payload->>'sessionId' = session_id
    and payload->>'test' = test
  )
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

  constraint benchmark_progress_session_id_key unique (session_id),
  constraint benchmark_progress_payload_matches check (
    jsonb_typeof(payload) = 'object'
    and payload->>'sessionId' = session_id
    and payload->>'test' = test
  )
);

-- Row-level security stays enabled, and direct browser table access is revoked.
-- Run both files in supabase/migrations/ after this setup to install the
-- validated constraints, analysis view, and write-only RPC functions.
alter table benchmark_answers  enable row level security;
alter table benchmark_progress enable row level security;

-- Browser participants only need INSERT on answers and INSERT/UPDATE on progress.
-- Revoke table privileges explicitly as a second layer beneath RLS policies.
revoke all on benchmark_answers from anon, authenticated;
revoke all on benchmark_progress from anon, authenticated;

-- Researchers read through the authenticated Supabase dashboard/service role.
-- Never create an anon SELECT policy for participant data.
