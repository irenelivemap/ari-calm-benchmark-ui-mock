const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260805_calm_launch_fixes.sql'),
  'utf8'
);
const corpusMigration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260805_route_corpus_v2.sql'),
  'utf8'
);
const runbook = fs.readFileSync(path.join(root, 'supabase/README.md'), 'utf8');
const postflight = fs.readFileSync(path.join(root, 'supabase/postflight.sql'), 'utf8');

test('documents the Calm launch migration in chronological production order', () => {
  const hardening = runbook.indexOf('20260804_launch_hardening.sql');
  const writeOnly = runbook.indexOf('20260804_write_only_rpc.sql');
  const calmFixes = runbook.indexOf('20260805_calm_launch_fixes.sql');
  const corpusV2 = runbook.indexOf('20260805_route_corpus_v2.sql');
  assert.ok(hardening >= 0);
  assert.ok(writeOnly > hardening);
  assert.ok(calmFixes > writeOnly);
  assert.ok(corpusV2 > calmFixes);
});

test('binds v3 Calm rows and the analysis view to the exact route corpus', () => {
  assert.match(corpusMigration, /benchmark_answers_calm_corpus_v3/);
  assert.match(corpusMigration, /benchmark_progress_calm_corpus_v3/);
  assert.match(corpusMigration, /calm-curated-v2/);
  assert.match(corpusMigration, /20c716cbb91a4fb09f6eb86c686afeab5dd099378886b6bd1cc548adeb366715/);
  assert.match(corpusMigration, /as corpus_version/);
  assert.match(corpusMigration, /as corpus_fingerprint/);
  assert.match(corpusMigration, /revoke all on public\.benchmark_answers_analysis from anon, authenticated/);
});

test('enforces current Calm answer identity, questionnaire, and session limits', () => {
  assert.match(migration, /benchmark_answers_session_round_unique/);
  assert.match(migration, /current Calm answer identity/);
  assert.match(migration, /q1KnowsBetter/);
  assert.match(migration, /q1Choices/);
  assert.match(migration, /q2Reasons/);
  assert.match(migration, /q3WorthShowing/);
  assert.match(migration, /q3Issues/);
  assert.match(migration, />= 23/);
  assert.match(migration, /routeId' is distinct from \(\s*'calm-round-'/);
  assert.doesNotMatch(migration, /jsonb_object_length/);
  assert.match(migration, /routeAssignment'\) - 'routeA'::text - 'routeB'::text/);
});

test('prevents older progress from overwriting a later Calm checkpoint', () => {
  assert.match(migration, /on conflict \(session_id\) do update/);
  assert.match(migration, /completedRounds/);
  assert.match(migration, /benchmark_progress\.updated_at <= excluded\.updated_at/);
});

test('keeps the analysis view private and exposes the current flag to researchers', () => {
  assert.match(migration, /as q1_knows_better/);
  assert.match(migration, /a\.payload,\s*case when jsonb_typeof\(a\.payload->'q1KnowsBetter'\)/);
  assert.match(migration, /revoke all on public\.benchmark_answers_analysis from anon, authenticated/);
  assert.match(migration, /grant select on public\.benchmark_answers_analysis to service_role/);
});

test('reports answer and progress counts by route corpus without deleting data', () => {
  assert.match(postflight, /corpus_version/);
  assert.match(postflight, /corpus_fingerprint/);
  assert.match(postflight, /from public\.benchmark_progress/);
  assert.match(postflight, /begin transaction read only/);
  assert.doesNotMatch(postflight, /\b(delete|truncate|drop)\b/i);
});
