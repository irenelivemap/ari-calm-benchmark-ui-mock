const test = require('node:test');
const assert = require('node:assert/strict');
const { auditBenchmarkData, EXPECTED_CALM_ROUNDS } = require('../src/data/benchmark-audit.js');

function answer(round, overrides = {}) {
  const pair = String(round).padStart(2, '0');
  return {
    v: 2,
    test: 'calm_route_comparison',
    source: 'calm-route-comparison',
    captureId: `session-1-round-${round}`,
    sessionId: 'session-1',
    pairId: `calm-route-comparison-${pair}-round-${round}`,
    roundNumber: round,
    participantId: 'participant-1',
    consentVersion: '2026-08-04',
    consentedAt: '2026-08-04T10:00:00.000Z',
    ...overrides
  };
}

test('accepts one complete 23-comparison session', () => {
  const answers = Array.from({ length: EXPECTED_CALM_ROUNDS }, (_, index) => answer(index + 1));
  const report = auditBenchmarkData({
    answers,
    progressBySessionId: { 'session-1': { test: 'calm_route_comparison', sessionId: 'session-1', completedRounds: 23 } }
  });
  assert.equal(report.ok, true);
  assert.deepEqual(report.summary, { answers: 23, progress: 1, sessions: 1, errors: 0 });
});

test('reports duplicate captures, rounds, pairs, and progress ahead of answers', () => {
  const report = auditBenchmarkData({
    answers: [answer(1), answer(1)],
    progressBySessionId: { 'session-1': { test: 'calm_route_comparison', sessionId: 'session-1', completedRounds: 3 } }
  });
  assert.equal(report.ok, false);
  assert.equal(report.issueCounts.duplicate_capture_id, 1);
  assert.equal(report.issueCounts.duplicate_round_in_session, 1);
  assert.equal(report.issueCounts.duplicate_pair_in_session, 1);
  assert.equal(report.issueCounts.progress_ahead_of_answers, 1);
});

test('unwraps Supabase payload rows and flags malformed current records', () => {
  const report = auditBenchmarkData([{ payload: answer(24, { participantId: '', consentedAt: '' }) }]);
  assert.equal(report.ok, false);
  assert.equal(report.issueCounts.invalid_calm_round, 1);
  assert.equal(report.issueCounts.missing_participant_id, 1);
  assert.equal(report.issueCounts.missing_consent, 1);
});

