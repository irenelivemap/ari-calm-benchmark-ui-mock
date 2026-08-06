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
    q1KnowsBetter: false,
    q1BetterRouteNote: '',
    q2Separate: null,
    q2Reasons: ['quieter_or_less_busy_streets'],
    q2Note: '',
    q3WorthShowing: 'a_lot',
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

test('preserves the selected-route reasons for the results layer', () => {
  const row = Results.normalizeRow(answer({
    q2Reasons: ['more_beautiful_streets_or_surroundings'],
    q2Note: 'More pleasant surroundings'
  }));
  assert.deepEqual(row.q2Reasons, ['more_beautiful_streets_or_surroundings']);
  assert.equal(row.q2Note, 'More pleasant surroundings');
  assert.equal(
    Results.CHOICE_REASON_LABELS.more_beautiful_streets_or_surroundings,
    'More beautiful streets or surroundings'
  );
});

test('preserves the optional better-route note for participant and researcher results', () => {
  const row = Results.normalizeRow(answer({
    q1KnowsBetter: true,
    q1BetterRouteNote: 'Take the smaller path along the river.'
  }));
  assert.equal(row.q1KnowsBetter, true);
  assert.equal(row.q1BetterRouteNote, 'Take the smaller path along the river.');
});

test('uses the current conditional Calm questions in participant results', () => {
  assert.deepEqual(Results.participantQuestionCopy(answer({ q1Choice: 'route_a' })), {
    q1: 'Which route would you choose for a calmer walk?',
    q1Flag: 'I know a better Calm route',
    q2: 'What made you choose Route A?',
    q3: 'Compared with only seeing Fast, how much does adding Route A improve things for you?',
    q3Note: 'When would you choose Fast instead of a Calm route? (Optional)'
  });
  assert.deepEqual(Results.participantQuestionCopy(answer({ q1Choice: 'route_b' })), {
    q1: 'Which route would you choose for a calmer walk?',
    q1Flag: 'I know a better Calm route',
    q2: 'What made you choose Route B?',
    q3: 'Compared with only seeing Fast, how much does adding Route B improve things for you?',
    q3Note: 'When would you choose Fast instead of a Calm route? (Optional)'
  });
  assert.deepEqual(Results.participantQuestionCopy(answer({ q1Choice: 'both_work_well' })), {
    q1: 'Which route would you choose for a calmer walk?',
    q1Flag: 'I know a better Calm route',
    q2: 'What made both routes work well?',
    q3: 'Compared with only seeing Fast, how much does also having any of these calmer routes improve things for you?',
    q3Note: 'When would you choose Fast instead of a Calm route? (Optional)'
  });
  assert.deepEqual(Results.participantQuestionCopy(answer({ q1Choice: 'none_work_well' })), {
    q1: 'Which route would you choose for a calmer walk?',
    q1Flag: 'I know a better Calm route',
    q2: null,
    q3: 'What made you choose neither route?',
    q3Note: null
  });
  assert.deepEqual(Results.participantQuestionCopy(answer({ q1Choice: 'hard_to_judge' })), {
    q1: 'Which route would you choose for a calmer walk?',
    q1Flag: 'I know a better Calm route',
    q2: null,
    q3: null,
    q3Note: null
  });
});

test('keeps legacy Q2 Other details readable', () => {
  const row = Results.normalizeRow(answer({ q2Note: '', q2Other: 'A legacy detail' }));
  assert.equal(row.q2Note, 'A legacy detail');
});

test('aggregates public and team metrics from the same rows', () => {
  const result = Results.aggregateAnswers([
    answer(),
    answer({ captureId: 'capture-2', sessionId: 'session-2', participantName: 'Alex', pairId: 'pair-2', q1Choice: 'route_b', q3Issues: ['too_complex'], labelMap: { A: 'calm_quiet', B: 'calm_nature' } }),
    answer({ captureId: 'capture-3', q1Choice: 'hard_to_judge', q2Separate: null, q3WorthShowing: null, q3Issues: [] })
  ]);

  assert.equal(result.total, 3);
  assert.equal(result.participants, 2);
  assert.equal(result.routePairs, 2);
  assert.deepEqual(result.outcomeCounts, {
    calm_quiet: 1,
    calm_nature: 1,
    both_work_well: 0,
    none_work_well: 0,
    hard_to_judge: 1
  });
  assert.equal(result.reasonCounts.too_busy_or_crowded, 1);
  assert.deepEqual(result.q3WorthShowingCounts, { a_lot: 2, somewhat: 0, a_little: 0, not_at_all: 0, not_sure: 0 });
  assert.deepEqual(result.positionBias, {
    selectedAsA: 1,
    selectedAsB: 1,
    selectedAsC: 0
  });
});

test('counts the dedicated Both work poorly reasons', () => {
  const result = Results.aggregateAnswers([
    answer({
      q1Choice: 'none_work_well',
      q2Reasons: [],
      q3WorthShowing: null,
      q3Issues: [
        'streets_too_busy_or_noisy',
        'takes_too_long',
        'not_enough_beautiful_or_pleasant_surroundings'
      ]
    })
  ]);

  assert.equal(result.reasonCounts.streets_too_busy_or_noisy, 1);
  assert.equal(result.reasonCounts.takes_too_long, 1);
  assert.equal(result.reasonCounts.not_enough_beautiful_or_pleasant_surroundings, 1);
  assert.equal(
    Results.REASON_LABELS.not_enough_beautiful_or_pleasant_surroundings,
    'Not enough beautiful or pleasant surroundings'
  );
});

test('aggregates whether selected Calm routes are worth showing beyond Fast', () => {
  const result = Results.aggregateAnswers([
    answer({ captureId: 'capture-1', q3WorthShowing: 'a_lot', q3Issues: [] }),
    answer({ captureId: 'capture-2', q3WorthShowing: 'not_at_all', q3Issues: [] }),
    answer({ captureId: 'capture-3', q3WorthShowing: 'not_sure', q3Issues: [] }),
    answer({ captureId: 'capture-4', q1Choice: 'none_work_well', q3WorthShowing: null, q3Issues: ['takes_too_long'] })
  ]);

  assert.deepEqual(result.q3WorthShowingCounts, { a_lot: 1, somewhat: 0, a_little: 0, not_at_all: 1, not_sure: 1 });
});

test('preserves both work well as one mutually exclusive outcome', () => {
  const result = Results.aggregateAnswers([
    answer({
      q1Choice: 'both_work_well',
      q1Choices: ['both_work_well'],
      q3Issues: []
    })
  ]);

  assert.equal(result.total, 1);
  assert.equal(result.outcomeCounts.calm_quiet, 0);
  assert.equal(result.outcomeCounts.calm_nature, 0);
  assert.equal(result.outcomeCounts.both_work_well, 1);
  assert.deepEqual(result.positionBias, {
    selectedAsA: 1,
    selectedAsB: 1,
    selectedAsC: 0
  });
});

test('preserves the exact Q1 judgment before expanding both-work support', () => {
  assert.equal(Results.exactOutcome(answer({ q1Choice: 'route_a' })), 'calm_quiet');
  assert.equal(Results.exactOutcome(answer({ q1Choice: 'route_b' })), 'calm_nature');
  assert.equal(Results.exactOutcome(answer({ q1Choice: 'both_work_well' })), 'both_work_well');
  assert.equal(Results.exactOutcome(answer({ q1Choice: 'both_work_poorly' })), 'none_work_well');
  assert.equal(Results.exactOutcome(answer({ q1Choice: 'not_sure' })), 'hard_to_judge');
  assert.equal(
    Results.canonicalPairId('calm-route-comparison-07-round-3'),
    'calm-route-comparison-07'
  );
  assert.equal(Results.canonicalPairId('external-pair-4'), 'external-pair-4');
});

test('analyzes viability, exclusive preference, pair agreement, and participant patterns', () => {
  const answers = [
    answer({ captureId: 'p1-1', sessionId: 'p1', participantName: 'One', pairId: 'pair-1', q1Choice: 'route_a' }),
    answer({ captureId: 'p2-1', sessionId: 'p2', participantName: 'Two', pairId: 'pair-1', q1Choice: 'route_a' }),
    answer({ captureId: 'p3-1', sessionId: 'p3', participantName: 'Three', pairId: 'pair-1', q1Choice: 'both_work_well' }),
    answer({ captureId: 'p4-1', sessionId: 'p4', participantName: 'Four', pairId: 'pair-1', q1Choice: 'none_work_well' }),
    answer({ captureId: 'p1-2', sessionId: 'p1', participantName: 'One', pairId: 'pair-2', q1Choice: 'route_b' }),
    answer({ captureId: 'p2-2', sessionId: 'p2', participantName: 'Two', pairId: 'pair-2', q1Choice: 'route_b' }),
    answer({ captureId: 'p3-2', sessionId: 'p3', participantName: 'Three', pairId: 'pair-2', q1Choice: 'route_b' }),
    answer({ captureId: 'p4-2', sessionId: 'p4', participantName: 'Four', pairId: 'pair-2', q1Choice: 'hard_to_judge' })
  ];

  const result = Results.analyzeAgreement(answers);

  assert.equal(result.total, 8);
  assert.equal(result.anyWorks, 6);
  assert.equal(result.anyWorksPercent, 75);
  assert.equal(result.quietPreferencePercent, 40);
  assert.equal(result.naturePreferencePercent, 60);
  assert.equal(result.decisivenessPercent, 63);
  assert.equal(result.quietLeadingPairs, 1);
  assert.equal(result.natureLeadingPairs, 1);
  assert.equal(result.tiedPreferencePairs, 0);
  assert.equal(result.medianPreferenceAgreementPercent, 100);
  assert.equal(result.pairs.length, 2);
  assert.equal(result.pairs[0].anyWorksPercent, 75);
  assert.equal(result.pairs[0].preferredCalmType, 'calm_quiet');
  assert.equal(result.pairs[0].preferenceAgreementPercent, 100);
  assert.equal(result.pairs[1].modalOutcome, 'calm_nature');
  assert.equal(result.pairs[1].substantiveTotal, 3);
  assert.equal(result.pairs[1].couldNotJudgeCount, 1);
  assert.equal(result.pairs[1].couldNotJudgePercent, 25);
  assert.equal(result.pairs[1].exactAgreementPercent, 100);
  assert.equal(result.pairs[1].clearExactAgreement, true);
  assert.equal(result.clearExactPairs, 1);
  assert.equal(result.mixedExactPairs, 1);
  assert.equal(result.clearNeitherPairs, 0);
  assert.equal(result.couldNotJudgeCount, 1);
  assert.equal(result.couldNotJudgePercent, 13);
  assert.equal(result.clearAgreementThreshold, 0.7);
  assert.equal(result.participants.length, 4);
  assert.equal(result.participants.find(item => item.participantId === 'name:one').anyWorksPercent, 100);
});

test('calculates 70% agreement from substantive responses and reports uncertainty separately', () => {
  const answers = [];
  const addResponses = (pairId, outcomes) => outcomes.forEach((q1Choice, index) => {
    answers.push(answer({
      captureId: `${pairId}-${index}`,
      sessionId: `${pairId}-participant-${index}`,
      participantName: `Evaluator ${index + 1}`,
      pairId,
      q1Choice
    }));
  });

  addResponses('pair-1', [
    ...Array(7).fill('none_work_well'),
    ...Array(3).fill('hard_to_judge')
  ]);
  addResponses('pair-2', [
    ...Array(7).fill('route_b'),
    ...Array(3).fill('route_a')
  ]);
  addResponses('pair-3', [
    ...Array(6).fill('route_b'),
    ...Array(4).fill('route_a')
  ]);

  const result = Results.analyzeAgreement(answers);

  assert.equal(result.pairs[0].substantiveTotal, 7);
  assert.equal(result.pairs[0].exactAgreementPercent, 100);
  assert.equal(result.pairs[0].clearExactAgreement, true);
  assert.equal(result.pairs[1].exactAgreementPercent, 70);
  assert.equal(result.pairs[1].clearExactAgreement, true);
  assert.equal(result.pairs[2].exactAgreementPercent, 60);
  assert.equal(result.pairs[2].clearExactAgreement, false);
  assert.equal(result.clearExactPairs, 2);
  assert.equal(result.mixedExactPairs, 1);
  assert.equal(result.clearNeitherPairs, 1);
  assert.equal(result.couldNotJudgeCount, 3);
  assert.equal(result.couldNotJudgePercent, 10);
});

test('returns bounded Wilson uncertainty intervals', () => {
  assert.deepEqual(Results.wilsonInterval(0, 0), { low: 0, high: 0 });
  assert.deepEqual(Results.wilsonInterval(15, 15), { low: 80, high: 100 });
  const interval = Results.wilsonInterval(8, 15);
  assert.ok(interval.low >= 0 && interval.low < 54);
  assert.ok(interval.high <= 100 && interval.high > 54);
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
      participantId: 'name:alex',
      participant: 'Alex',
      comparisons: 1,
      sessions: 1,
      routePairs: 1,
      lastUpdated: '2026-07-13T09:00:00.000Z'
    },
    {
      participantId: 'name:irene',
      participant: 'Irene',
      comparisons: 2,
      sessions: 1,
      routePairs: 2,
      lastUpdated: '2026-07-13T11:00:00.000Z'
    }
  ]);
  assert.equal(Results.normalizeRow(answer({ roundNumber: 7 })).roundNumber, 7);
});

test('merges legacy sessions for the same named team member', () => {
  const repeatedSessions = [
    answer({ captureId: 'capture-1', sessionId: 'session-alex-1', participantName: 'Alex' }),
    answer({ captureId: 'capture-2', sessionId: 'session-alex-2', participantName: 'Alex' })
  ];
  const summaries = Results.summarizeParticipants(repeatedSessions);

  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].participantId, 'name:alex');
  assert.equal(summaries[0].comparisons, 2);
  assert.equal(summaries[0].sessions, 2);
  assert.equal(Results.aggregateAnswers(repeatedSessions).participants, 1);
});

test('keeps different explicit participant codes separate when names match', () => {
  const duplicateNames = [
    answer({ captureId: 'capture-1', participantId: 'participant-alex-1', sessionId: 'session-alex-1', participantName: 'Alex' }),
    answer({ captureId: 'capture-2', participantId: 'participant-alex-2', sessionId: 'session-alex-2', participantName: 'Alex' })
  ];
  const summaries = Results.summarizeParticipants(duplicateNames);

  assert.equal(summaries.length, 2);
  assert.deepEqual(summaries.map(summary => summary.participantId), ['participant-alex-1', 'participant-alex-2']);
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
