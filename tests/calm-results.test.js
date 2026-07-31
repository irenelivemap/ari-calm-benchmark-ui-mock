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
    q2Separate: null,
    q3Issues: ['too_busy_or_crowded'],
    labelMap: { A: 'calm_quiet', B: 'calm_nature' },
    ...overrides
  };
}

test('decodes selected route labels instead of treating A, B, and C as outcomes', () => {
  assert.equal(Results.selectedRouteType(answer()), 'calm_quiet');
  assert.equal(Results.selectedRouteType(answer({ q1Choice: 'route_b' })), 'calm_nature');
  assert.equal(Results.selectedRouteType(answer({
    q1Choice: 'route_c',
    labelMap: { A: 'calm_quiet', B: 'calm_nature', C: 'human' }
  })), 'human');
  assert.equal(Results.selectedRouteType(answer({
    q1Choice: 'multiple_routes',
    q1Choices: ['route_a', 'route_b']
  })), 'multiple_routes');
  assert.deepEqual(Results.selectedRouteTypes(answer({
    q1Choice: 'all_three_work_well',
    q1Choices: [],
    labelMap: { A: 'calm_quiet', B: 'calm_nature', C: 'human' }
  })), [
    'calm_quiet',
    'calm_nature',
    'human'
  ]);
});

test('aggregates public and team metrics from the same rows', () => {
  const result = Results.aggregateAnswers([
    answer(),
    answer({ captureId: 'capture-2', sessionId: 'session-2', participantName: 'Alex', pairId: 'pair-2', q1Choice: 'route_b', q3Issues: ['too_complex'], labelMap: { A: 'calm_quiet', B: 'calm_nature' } }),
    answer({ captureId: 'capture-3', q1Choice: 'hard_to_judge', q2Separate: null, q3Issues: [] })
  ]);

  assert.equal(result.total, 3);
  assert.equal(result.participants, 2);
  assert.equal(result.routePairs, 2);
  assert.deepEqual(result.outcomeCounts, {
    calm_quiet: 1,
    calm_nature: 1,
    none_work_well: 0,
    hard_to_judge: 1
  });
  assert.equal(result.reasonCounts.too_busy_or_crowded, 1);
  assert.deepEqual(result.positionBias, {
    selectedAsA: 1,
    selectedAsB: 1,
    selectedAsC: 0
  });
});

test('counts both routes when both work well', () => {
  const result = Results.aggregateAnswers([
    answer({
      q1Choice: 'both_work_well',
      q1Choices: ['both_work_well'],
      q3Issues: []
    })
  ]);

  assert.equal(result.total, 1);
  assert.equal(result.outcomeCounts.calm_quiet, 1);
  assert.equal(result.outcomeCounts.calm_nature, 1);
  assert.deepEqual(result.positionBias, {
    selectedAsA: 1,
    selectedAsB: 1,
    selectedAsC: 0
  });
});

test('filters the unified dashboard without mutating public totals', () => {
  const answers = [
    answer(),
    answer({ captureId: 'capture-2', participantName: 'Alex', sessionId: 'session-2', q1Choice: 'route_b', q3Issues: ['too_complex'] })
  ];
  assert.equal(Results.aggregateAnswers(answers).total, 2);
  assert.equal(Results.aggregateAnswers(answers, { participant: 'Alex' }).total, 1);
  assert.equal(Results.aggregateAnswers(answers, { reason: 'too_complex' }).rows[0].participant, 'Alex');
});

test('summarizes named participants for the participant dashboard', () => {
  const summaries = Results.summarizeParticipants([
    answer({ captureId: 'capture-1', roundNumber: 1 }),
    answer({
      captureId: 'capture-2',
      sessionId: 'session-1',
      pairId: 'pair-2',
      roundNumber: 2,
      clientTs: '2026-07-13T11:00:00.000Z'
    }),
    answer({
      captureId: 'capture-3',
      participantName: 'Alex',
      sessionId: 'session-2',
      pairId: 'pair-1',
      roundNumber: 1,
      clientTs: '2026-07-13T09:00:00.000Z'
    })
  ]);

  assert.deepEqual(summaries, [
    {
      participantId: 'session-2',
      participant: 'Alex',
      comparisons: 1,
      sessions: 1,
      routePairs: 1,
      lastUpdated: '2026-07-13T09:00:00.000Z'
    },
    {
      participantId: 'session-1',
      participant: 'Irene',
      comparisons: 2,
      sessions: 1,
      routePairs: 2,
      lastUpdated: '2026-07-13T11:00:00.000Z'
    }
  ]);
  assert.equal(Results.normalizeRow(answer({ roundNumber: 7 })).roundNumber, 7);
});

test('keeps participants with the same display name separate', () => {
  const duplicateNames = [
    answer({ captureId: 'capture-1', sessionId: 'session-alex-1', participantName: 'Alex' }),
    answer({ captureId: 'capture-2', sessionId: 'session-alex-2', participantName: 'Alex' })
  ];
  const summaries = Results.summarizeParticipants(duplicateNames);

  assert.equal(summaries.length, 2);
  assert.deepEqual(summaries.map(summary => summary.participantId), [
    'session-alex-1',
    'session-alex-2'
  ]);
  assert.equal(Results.aggregateAnswers(duplicateNames).participants, 2);
});

test('does not manufacture a leading route for ties or neutral-only answers', () => {
  const tied = Results.aggregateAnswers([
    answer({ captureId: 'capture-1', q1Choice: 'route_a' }),
    answer({ captureId: 'capture-2', q1Choice: 'route_b' })
  ]);
  assert.equal(tied.leadingRoute, null);
  assert.deepEqual(tied.leadingRoutes, ['calm_quiet', 'calm_nature']);

  const neutral = Results.aggregateAnswers([
    answer({ captureId: 'capture-3', q1Choice: 'hard_to_judge', q3Issues: [] })
  ]);
  assert.equal(neutral.leadingRoute, null);
  assert.deepEqual(neutral.leadingRoutes, []);
});

test('merges remote and local answer feeds by capture id with local records winning', () => {
  const merged = Results.mergeAnswers(
    [
      answer({ captureId: 'capture-1', q1Choice: 'route_a' }),
      answer({ captureId: 'capture-2', q1Choice: 'route_b' })
    ],
    [
      answer({ captureId: 'capture-2', q1Choice: 'route_c' }),
      answer({ captureId: 'capture-3', q1Choice: 'hard_to_judge' })
    ]
  );

  assert.equal(merged.length, 3);
  assert.equal(merged.find(item => item.captureId === 'capture-2').q1Choice, 'route_c');
});

test('releases preference percentages only in complete five-comparison batches', () => {
  const answers = Array.from({ length: 7 }, (_, index) => answer({
    captureId: `capture-${index + 1}`,
    q1Choice: index < 3 ? 'route_a' : index === 3 ? 'route_b' : 'none_work_well'
  }));

  assert.deepEqual(Results.createPreferenceSnapshot(answers), {
    total: 7,
    releasedTotal: 5,
    nextReleaseAt: 10,
    leadingRoute: 'calm_quiet',
    leadingRoutePercent: 60
  });
});

test('creates separate personal and community snapshots from the same answer feed', () => {
  const answers = [
    answer({ captureId: 'capture-1', sessionId: 'session-1' }),
    answer({ captureId: 'capture-2', sessionId: 'session-1' }),
    answer({ captureId: 'capture-3', sessionId: 'session-1' }),
    answer({ captureId: 'capture-4', sessionId: 'session-1' }),
    answer({ captureId: 'capture-5', sessionId: 'session-1', q1Choice: 'route_b' }),
    answer({ captureId: 'capture-6', sessionId: 'session-2' })
  ];

  assert.deepEqual(Results.createPreferenceSnapshot(answers, {
    filters: { sessionId: 'session-1' }
  }), {
    total: 5,
    releasedTotal: 5,
    nextReleaseAt: 10,
    leadingRoute: 'calm_quiet',
    leadingRoutePercent: 80
  });
  assert.equal(Results.createPreferenceSnapshot(answers).total, 6);
});
