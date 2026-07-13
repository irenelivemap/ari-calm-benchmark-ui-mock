const test = require('node:test');
const assert = require('node:assert/strict');
const Results = require('../src/results/calm-results');

function answer(overrides = {}) {
  return {
    captureId: 'capture-1',
    sessionId: 'session-1',
    participantName: 'Irene',
    pairId: 'pair-1',
    clientTs: '2026-07-13T10:00:00.000Z',
    q1Choice: 'route_a',
    q2Separate: 'yes',
    q3Issues: ['too_busy_or_crowded'],
    labelMap: { A: 'calm', B: 'fast' },
    ...overrides
  };
}

test('decodes selected route labels instead of treating A and B as outcomes', () => {
  assert.equal(Results.selectedRouteType(answer()), 'calm');
  assert.equal(Results.selectedRouteType(answer({ q1Choice: 'route_b' })), 'fast');
  assert.equal(Results.selectedRouteType(answer({ q1Choice: 'either' })), 'both');
});

test('aggregates public and team metrics from the same rows', () => {
  const result = Results.aggregateAnswers([
    answer(),
    answer({ captureId: 'capture-2', sessionId: 'session-2', participantName: 'Alex', pairId: 'pair-2', q1Choice: 'route_b', q2Separate: 'no', q3Issues: ['too_complex'], labelMap: { A: 'fast', B: 'calm' } }),
    answer({ captureId: 'capture-3', q1Choice: 'hard_to_judge', q2Separate: null, q3Issues: [] })
  ]);

  assert.equal(result.total, 3);
  assert.equal(result.participants, 2);
  assert.equal(result.routePairs, 2);
  assert.deepEqual(result.outcomeCounts, { calm: 2, fast: 0, both: 0, neither: 0, hard_to_judge: 1 });
  assert.equal(result.reasonCounts.too_busy_or_crowded, 1);
  assert.deepEqual(result.positionBias, {
    calmShownAsA: 2,
    calmShownAsB: 1,
    calmSelectedAsA: 1,
    calmSelectedAsB: 1
  });
});

test('filters the unified dashboard without mutating public totals', () => {
  const answers = [
    answer(),
    answer({ captureId: 'capture-2', participantName: 'Alex', sessionId: 'session-2', q1Choice: 'route_b', labelMap: { A: 'calm', B: 'fast' }, q3Issues: ['too_complex'] })
  ];
  assert.equal(Results.aggregateAnswers(answers).total, 2);
  assert.equal(Results.aggregateAnswers(answers, { participant: 'Alex' }).total, 1);
  assert.equal(Results.aggregateAnswers(answers, { reason: 'too_complex' }).rows[0].participant, 'Alex');
});
