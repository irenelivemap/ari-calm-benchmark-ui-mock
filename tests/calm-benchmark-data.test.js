const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DataValidationError,
  createLocalRepository,
  validateAnswerRecord,
  validateProgressRecord
} = require('../src/data/calm-benchmark-data.js');

const CORPUS_VERSION = 'calm-curated-v2';
const CORPUS_FINGERPRINT = '20c716cbb91a4fb09f6eb86c686afeab5dd099378886b6bd1cc548adeb366715';

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function validAnswer(overrides = {}) {
  return {
    test: 'calm_route_comparison',
    source: 'calm-route-comparison',
    sessionId: 'calm-session-123',
    benchmarkRunId: 'calm-session-123',
    roundId: 'calm-session-123-round-1',
    captureId: 'calm-session-123-round-1',
    roundNumber: 1,
    participantName: 'Irene',
    rater: 'Irene',
    pairId: 'pair-1',
    routeAssignment: { routeA: 'calm_quiet', routeB: 'calm_nature' },
    labels: {
      A: { routeId: 'quiet-route-1', routeType: 'calm_quiet', source: 'model' },
      B: { routeId: 'nature-route-1', routeType: 'calm_nature', source: 'model' }
    },
    q1Choice: 'route_a',
    q1KnowsBetter: false,
    q1BetterRouteNote: '',
    q2Separate: null,
    q2Reasons: ['quieter_or_less_busy_streets'],
    q2Note: '',
    q3WorthShowing: 'a_lot',
    q3Issues: [],
    q3Note: '',
    createdAt: '2026-07-13T10:00:00.000Z',
    ...overrides
  };
}

function validProgress(overrides = {}) {
  return {
    sessionId: 'calm-session-123',
    benchmarkRunId: 'calm-session-123',
    participantName: 'Irene',
    sessionStartedAt: '2026-07-13T09:00:00.000Z',
    roundIndex: 0,
    completedRounds: 0,
    pairId: 'pair-1',
    routeAssignment: { routeA: 'calm', routeB: 'fast' },
    questionStep: 'q2',
    partialAnswer: validAnswer({ q2Separate: null, q2Reasons: [], q3WorthShowing: null, q3Issues: [] }),
    savedAt: '2026-07-13T10:01:00.000Z',
    ...overrides
  };
}

test('saves a valid answer once and treats retries as idempotent', () => {
  const repository = createLocalRepository(new MemoryStorage());

  assert.equal(repository.saveAnswer(validAnswer()).status, 'saved');
  assert.equal(repository.saveAnswer(validAnswer()).status, 'duplicate');

  const snapshot = repository.getSnapshot();
  assert.equal(snapshot.answers.length, 1);
  assert.equal(snapshot.answers[0].labelMap.A, 'calm_quiet');
  assert.equal(snapshot.answers[0].labels.B.routeId, 'nature-route-1');
  assert.deepEqual(repository.verify().stats, {
    sessions: 1,
    progressRecords: 0,
    answers: 1
  });
});

test('rejects submitted answers that do not satisfy conditional questions', () => {
  const result = validateAnswerRecord(validAnswer({ q3WorthShowing: null }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /q3WorthShowing/);

  const missingQ2 = validateAnswerRecord(validAnswer({ q2Reasons: [] }));
  assert.equal(missingQ2.valid, false);
  assert.match(missingQ2.errors.join(' '), /q2Reason/);

  const orphanedOther = validateAnswerRecord(validAnswer({ q2Other: 'A different reason' }));
  assert.equal(orphanedOther.valid, false);
  assert.match(orphanedOther.errors.join(' '), /q2Other/);

  const repository = createLocalRepository(new MemoryStorage());
  assert.throws(
    () => repository.saveAnswer(validAnswer({ q3WorthShowing: null })),
    error => error instanceof DataValidationError
  );
});

test('stores a better-route note only when its Q1 flag is selected', () => {
  const note = 'I would walk through the park beside the river. 🌳';
  const selected = validateAnswerRecord(validAnswer({
    q1KnowsBetter: true,
    q1BetterRouteNote: note
  }));
  assert.equal(selected.valid, true);
  assert.equal(selected.record.q1BetterRouteNote, note);

  const orphaned = validateAnswerRecord(validAnswer({
    q1KnowsBetter: false,
    q1BetterRouteNote: note
  }));
  assert.equal(orphaned.valid, false);
  assert.match(orphaned.errors.join(' '), /q1BetterRouteNote must be empty/);

  const tooLong = validateAnswerRecord(validAnswer({
    q1KnowsBetter: true,
    q1BetterRouteNote: 'x'.repeat(501)
  }));
  assert.equal(tooLong.valid, false);
  assert.match(tooLong.errors.join(' '), /500 characters or fewer/);

  const wrongType = validateAnswerRecord(validAnswer({
    q1KnowsBetter: true,
    q1BetterRouteNote: { route: 'river path' }
  }));
  assert.equal(wrongType.valid, false);
  assert.match(wrongType.errors.join(' '), /must be a string/);
});

test('accepts a selected better-route note in every Q1 branch', () => {
  const note = 'I would use the smaller street behind the station.';
  const branchAnswers = [
    validAnswer({ q1Choice: 'route_a' }),
    validAnswer({ q1Choice: 'route_b' }),
    validAnswer({ q1Choice: 'both_work_well' }),
    validAnswer({
      q1Choice: 'none_work_well',
      q2Reasons: [],
      q3WorthShowing: null,
      q3Issues: ['takes_too_long']
    }),
    validAnswer({
      q1Choice: 'hard_to_judge',
      q2Reasons: [],
      q3WorthShowing: null,
      q3Issues: []
    })
  ];
  branchAnswers.forEach(answer => {
    const result = validateAnswerRecord({
      ...answer,
      q1KnowsBetter: true,
      q1BetterRouteNote: note
    });
    assert.equal(result.valid, true, `${answer.q1Choice}: ${result.errors.join('; ')}`);
    assert.equal(result.record.q1BetterRouteNote, note);
  });
});

test('preserves the better-route note in partial progress', () => {
  const note = 'Use the path behind the school.';
  const result = validateProgressRecord(validProgress({
    partialAnswer: validAnswer({
      q1KnowsBetter: true,
      q1BetterRouteNote: note,
      q2Reasons: [],
      q3WorthShowing: null
    })
  }));
  assert.equal(result.valid, true);
  assert.equal(result.record.partialAnswer.q1BetterRouteNote, note);
});

test('strictly validates current v2 Calm corpus records', () => {
  const current = validAnswer({
    v: 2,
    participantId: 'participant-123',
    pairId: 'calm-route-comparison-01-round-1',
    q1KnowsBetter: false,
    labels: {
      A: { routeId: 'calm-round-1-calm-quiet', routeType: 'calm_quiet', source: 'saved' },
      B: { routeId: 'calm-round-1-calm-nature', routeType: 'calm_nature', source: 'saved' }
    }
  });
  assert.equal(validateAnswerRecord(current).valid, true);

  const fabricated = validateAnswerRecord({
    ...current,
    roundId: 'calm-session-123-round-999',
    captureId: 'calm-session-123-round-999',
    roundNumber: 999,
    pairId: 'not-a-real-pair'
  });
  assert.equal(fabricated.valid, false);
  assert.match(fabricated.errors.join(' '), /23 current Calm pairs|between 1 and 23/);

  const incomplete = { ...current };
  delete incomplete.q2Reasons;
  delete incomplete.q3WorthShowing;
  assert.equal(validateAnswerRecord(incomplete).valid, false);
});

test('requires an exact corpus identity for current v3 Calm answers and progress', () => {
  const current = validAnswer({
    v: 3,
    participantId: 'participant-123',
    corpusVersion: CORPUS_VERSION,
    corpusFingerprint: CORPUS_FINGERPRINT,
    pairId: 'calm-route-comparison-01-round-1',
    q1KnowsBetter: false,
    labels: {
      A: { routeId: 'calm-round-1-calm-quiet', routeType: 'calm_quiet', source: 'saved' },
      B: { routeId: 'calm-round-1-calm-nature', routeType: 'calm_nature', source: 'saved' }
    }
  });
  assert.equal(validateAnswerRecord(current).valid, true);

  const missingIdentity = { ...current };
  delete missingIdentity.corpusVersion;
  delete missingIdentity.corpusFingerprint;
  const missingResult = validateAnswerRecord(missingIdentity);
  assert.equal(missingResult.valid, false);
  assert.match(missingResult.errors.join(' '), /corpusVersion/);
  assert.match(missingResult.errors.join(' '), /corpusFingerprint/);

  const wrongIdentity = validateAnswerRecord({
    ...current,
    corpusVersion: 'calm-curated-other',
    corpusFingerprint: '0'.repeat(64)
  });
  assert.equal(wrongIdentity.valid, false);
  assert.match(wrongIdentity.errors.join(' '), /active route corpus/);

  const progress = validProgress({
    v: 3,
    test: 'calm_route_comparison',
    source: 'calm-route-comparison',
    participantId: 'participant-123',
    corpusVersion: CORPUS_VERSION,
    corpusFingerprint: CORPUS_FINGERPRINT,
    pairId: 'calm-route-comparison-01-round-1',
    routeAssignment: { routeA: 'calm_quiet', routeB: 'calm_nature' },
    questionStep: 'q1',
    partialAnswer: current
  });
  assert.equal(validateProgressRecord(progress).valid, true);

  const mismatchedProgress = {
    ...progress,
    corpusFingerprint: '0'.repeat(64)
  };
  const progressResult = validateProgressRecord(mismatchedProgress);
  assert.equal(progressResult.valid, false);
  assert.match(progressResult.errors.join(' '), /partialAnswer corpusFingerprint/);
});

test('keeps completed Calm answers from before Q2 reasons readable', () => {
  const historicalAnswer = validAnswer();
  delete historicalAnswer.q2Reasons;
  delete historicalAnswer.q2Note;
  delete historicalAnswer.q2Other;

  const result = validateAnswerRecord(historicalAnswer);
  assert.equal(result.valid, true);
  assert.equal(result.record.q2Reasons, undefined);

  const repository = createLocalRepository(new MemoryStorage({
    'ari-calm-route-comparison-dataset-v1': JSON.stringify({
      v: 1,
      type: 'calm-benchmark-dataset',
      test: 'calm_route_comparison',
      answers: [historicalAnswer]
    })
  }), { storageKey: 'ari-calm-route-comparison-dataset-v1' });
  assert.equal(repository.verify().valid, true);
});

test('stores partial progress and returns the latest resumable session', () => {
  const repository = createLocalRepository(new MemoryStorage());
  repository.saveProgress(validProgress());
  repository.saveProgress(validProgress({
    roundIndex: 1,
    completedRounds: 1,
    goalCheckpointPending: true,
    pairId: 'pair-2',
    questionStep: 'q1',
    partialAnswer: validAnswer({
      roundId: 'calm-session-123-round-2',
      captureId: 'calm-session-123-round-2',
      roundNumber: 2,
      pairId: 'pair-2',
      q1Choice: null,
      q2Separate: null,
      q2Reasons: [],
      q3WorthShowing: null,
      q3Issues: []
    }),
    savedAt: '2026-07-13T10:02:00.000Z'
  }));

  const progress = repository.getLatestProgress();
  assert.equal(progress.sessionId, 'calm-session-123');
  assert.equal(progress.roundIndex, 1);
  assert.equal(progress.goalCheckpointPending, true);
  assert.equal(progress.partialAnswer.q1Choice, null);
  assert.equal(repository.verify().valid, true);
});

test('saves a completed answer and its next checkpoint atomically', () => {
  const repository = createLocalRepository(new MemoryStorage());
  repository.saveProgress(validProgress({ questionStep: 'q3' }));

  const result = repository.saveCompletedRound(
    validAnswer(),
    validProgress({
      roundIndex: 1,
      completedRounds: 1,
      pairId: null,
      routeAssignment: null,
      questionStep: 'q1',
      partialAnswer: null,
      savedAt: '2026-07-13T10:03:00.000Z'
    })
  );

  assert.equal(result.status, 'saved');
  assert.equal(repository.getSnapshot().answers.length, 1);
  assert.equal(repository.getLatestProgress().roundIndex, 1);
  assert.equal(repository.getLatestProgress().completedRounds, 1);
  assert.equal(repository.getLatestProgress().partialAnswer, null);
});

test('does not let a delayed older progress write move a session backwards', () => {
  const repository = createLocalRepository(new MemoryStorage());
  repository.saveProgress(validProgress({
    roundIndex: 1,
    completedRounds: 1,
    pairId: null,
    routeAssignment: null,
    questionStep: 'q1',
    partialAnswer: null,
    savedAt: '2026-07-13T10:03:00.000Z'
  }));

  const stale = repository.saveProgress(validProgress({
    roundIndex: 0,
    completedRounds: 0,
    savedAt: '2026-07-13T10:04:00.000Z'
  }));

  assert.equal(stale.status, 'stale');
  assert.equal(repository.getLatestProgress().roundIndex, 1);
  assert.equal(repository.getLatestProgress().completedRounds, 1);
});

test('repairs a legacy answer-progress gap during resume', () => {
  const storage = new MemoryStorage();
  const repository = createLocalRepository(storage);
  repository.saveProgress(validProgress({ questionStep: 'q3' }));
  repository.saveAnswer(validAnswer());

  const repaired = repository.getLatestProgress();
  assert.equal(repaired.completedRounds, 1);
  assert.equal(repaired.roundIndex, 1);
  assert.equal(repaired.questionStep, 'q1');
  assert.equal(repaired.partialAnswer, null);
});

test('migrates the previous localStorage records without duplicating them', () => {
  const legacyAnswer = validAnswer();
  delete legacyAnswer.captureId;
  delete legacyAnswer.benchmarkRunId;
  const legacyProgress = validProgress();
  const storage = new MemoryStorage({
    'ari-calm-benchmark-answers': JSON.stringify([legacyAnswer]),
    'ari-calm-benchmark-progress': JSON.stringify(legacyProgress)
  });

  const repository = createLocalRepository(storage);
  assert.equal(repository.getSnapshot().answers.length, 1);
  assert.equal(repository.getLatestProgress().sessionId, 'calm-session-123');
  assert.equal(repository.getSnapshot().answers.length, 1);
});

test('can isolate a new route corpus from legacy localStorage records', () => {
  const storage = new MemoryStorage({
    'ari-calm-benchmark-answers': JSON.stringify([validAnswer()]),
    'ari-calm-benchmark-progress': JSON.stringify(validProgress())
  });
  const repository = createLocalRepository(storage, {
    storageKey: 'ari-calm-route-comparison-dataset-calm-curated-v2',
    migrateLegacy: false
  });

  assert.equal(repository.getSnapshot().answers.length, 0);
  assert.equal(repository.getLatestProgress(), null);
  assert.notEqual(storage.getItem('ari-calm-benchmark-answers'), null);

  repository.clear();
  assert.notEqual(storage.getItem('ari-calm-benchmark-answers'), null);
});

test('preserves v3 corpus identity when repairing an answer-progress gap', () => {
  const answer = validAnswer({
    v: 3,
    participantId: 'participant-123',
    corpusVersion: CORPUS_VERSION,
    corpusFingerprint: CORPUS_FINGERPRINT,
    pairId: 'calm-route-comparison-01-round-1',
    q1KnowsBetter: false,
    labels: {
      A: { routeId: 'calm-round-1-calm-quiet', routeType: 'calm_quiet', source: 'saved' },
      B: { routeId: 'calm-round-1-calm-nature', routeType: 'calm_nature', source: 'saved' }
    }
  });
  const storageKey = 'ari-calm-route-comparison-dataset-calm-curated-v2';
  const repository = createLocalRepository(new MemoryStorage({
    [storageKey]: JSON.stringify({
      v: 2,
      type: 'calm-benchmark-dataset',
      test: 'calm_route_comparison',
      answers: [answer]
    })
  }), { storageKey, migrateLegacy: false });

  const repaired = repository.getLatestProgress();
  assert.equal(repaired.v, 3);
  assert.equal(repaired.corpusVersion, CORPUS_VERSION);
  assert.equal(repaired.corpusFingerprint, CORPUS_FINGERPRINT);
  assert.equal(repository.verify().valid, true);
});

test('exports dashboard-ready newline-delimited JSON', () => {
  const repository = createLocalRepository(new MemoryStorage());
  repository.saveAnswer(validAnswer());
  repository.saveAnswer(validAnswer({
    roundId: 'calm-session-123-round-2',
    captureId: 'calm-session-123-round-2',
    roundNumber: 2,
    pairId: 'pair-2'
  }));

  const rows = repository.exportAnswerJsonl().split('\n').map(JSON.parse);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].type, 'bench-ux');
  assert.equal(rows[0].test, 'calm_route_comparison');
  assert.equal(rows[1].captureId, 'calm-session-123-round-2');
});

test('clears the current dataset and legacy test records', () => {
  const storage = new MemoryStorage();
  const repository = createLocalRepository(storage);
  repository.saveAnswer(validAnswer());
  repository.saveProgress(validProgress());
  storage.setItem('ari-calm-benchmark-answers', JSON.stringify([validAnswer()]));
  storage.setItem('ari-calm-benchmark-progress', JSON.stringify(validProgress()));

  assert.equal(repository.clear().status, 'cleared');
  assert.equal(storage.getItem('ari-calm-benchmark-answers'), null);
  assert.equal(storage.getItem('ari-calm-benchmark-progress'), null);
  assert.deepEqual(repository.verify().stats, {
    sessions: 0,
    progressRecords: 0,
    answers: 0
  });
});

test('stores ARI Fast versus Google Fast preview records with their own route types and test id', () => {
  const storage = new MemoryStorage();
  const repository = createLocalRepository(storage, {
    storageKey: 'ari-fast-google-benchmark-dataset-v1',
    testId: 'ari_fast_vs_google',
    legacyAnswersKey: 'ari-fast-google-benchmark-answers',
    legacyProgressKey: 'ari-fast-google-benchmark-progress'
  });
  const answer = validAnswer({
    test: 'ari_fast_vs_google',
    source: 'fast-google-benchmark',
    routeAssignment: { routeA: 'livemap_fast', routeB: 'google' },
    labels: {
      A: { routeId: 'ari-fast-1', routeType: 'livemap_fast', source: 'livemap_fast' },
      B: { routeId: 'google-fast-1', routeType: 'google', source: 'google' }
    },
    q1Choice: 'route_a',
    q2Separate: null,
    q2Reasons: [],
    q3WorthShowing: null,
    q3Issues: ['misses_nicer_route']
  });

  assert.equal(repository.saveAnswer(answer).status, 'saved');
  const snapshot = repository.getSnapshot();
  assert.equal(snapshot.test, 'ari_fast_vs_google');
  assert.equal(snapshot.answers[0].labelMap.A, 'livemap_fast');
  assert.equal(snapshot.answers[0].q3Issues[0], 'misses_nicer_route');
  assert.equal(repository.verify().valid, true);
});

test('accepts the current Fast versus Google follow-up reasons', () => {
  const result = validateAnswerRecord(validAnswer({
    test: 'ari_fast_vs_google',
    q1Choice: 'route_a',
    q2Separate: null,
    q2Reasons: [],
    q3WorthShowing: null,
    q3Issues: ['unnecessary_detour', 'may_not_be_walkable']
  }));

  assert.equal(result.valid, true);
});

test('accepts Both work well with Q2 reasons and a value-vs-Fast answer', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'both_work_well',
    q1Choices: ['both_work_well'],
    q2Reasons: ['easier_to_follow'],
    q3WorthShowing: 'a_lot',
    q3Issues: []
  }));

  assert.equal(result.valid, true);
});

test('requires a Q2 reason when both Calm routes work well', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'both_work_well',
    q1Choices: ['both_work_well'],
    q2Reasons: [],
    q3WorthShowing: 'a_lot',
    q3Issues: []
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /q2Reason/);
});

test('requires the value-vs-Fast answer for Route A, Route B, and Both work well', () => {
  ['route_a', 'route_b', 'both_work_well'].forEach(q1Choice => {
    const result = validateAnswerRecord(validAnswer({
      q1Choice,
      q1Choices: [q1Choice],
      q2Reasons: ['easier_to_follow'],
      q3WorthShowing: null,
      q3Issues: []
    }));
    assert.equal(result.valid, false);
    assert.match(result.errors.join(' '), /q3WorthShowing/);
  });
});

test('stores the Fast-alternative note only for the three positive Q3 answers', () => {
  ['a_lot', 'somewhat', 'a_little'].forEach(q3WorthShowing => {
    const result = validateAnswerRecord(validAnswer({
      v: 2,
      participantId: 'participant-123',
      pairId: 'calm-route-comparison-01-round-1',
      q3WorthShowing,
      q3Note: 'When time matters more than the calmer environment.',
      q3NoteKind: 'fast_alternative',
      labels: {
        A: { routeId: 'calm-round-1-calm-quiet', routeType: 'calm_quiet', source: 'saved' },
        B: { routeId: 'calm-round-1-calm-nature', routeType: 'calm_nature', source: 'saved' }
      }
    }));
    assert.equal(result.valid, true, `${q3WorthShowing}: ${result.errors.join('; ')}`);
  });

  ['not_at_all', 'not_sure'].forEach(q3WorthShowing => {
    const result = validateAnswerRecord(validAnswer({
      v: 2,
      participantId: 'participant-123',
      pairId: 'calm-route-comparison-01-round-1',
      q3WorthShowing,
      q3Note: 'This should have been cleared.',
      q3NoteKind: 'fast_alternative',
      labels: {
        A: { routeId: 'calm-round-1-calm-quiet', routeType: 'calm_quiet', source: 'saved' },
        B: { routeId: 'calm-round-1-calm-nature', routeType: 'calm_nature', source: 'saved' }
      }
    }));
    assert.equal(result.valid, false);
    assert.match(result.errors.join(' '), /q3Note is allowed only/);
  });
});

test('accepts optional Q2 details after any selected reason', () => {
  const result = validateAnswerRecord(validAnswer({
    q2Reasons: ['takes_less_time'],
    q2Note: 'The time difference mattered today.'
  }));

  assert.equal(result.valid, true);
  assert.equal(result.record.q2Note, 'The time difference mattered today.');
});

test('accepts the selected-route surroundings reason only in Q2', () => {
  ['route_a', 'route_b', 'both_work_well'].forEach(q1Choice => {
    const result = validateAnswerRecord(validAnswer({
      q1Choice,
      q1Choices: [q1Choice],
      q2Reasons: ['more_beautiful_streets_or_surroundings'],
      q2Note: 'The street felt more pleasant.',
      q3WorthShowing: 'somewhat',
      q3Issues: []
    }));
    assert.equal(result.valid, true, result.errors.join('; '));
  });
});

test('accepts the insufficient-surroundings reason only in the neither branch', () => {
  const accepted = validateAnswerRecord(validAnswer({
    q1Choice: 'none_work_well',
    q1Choices: ['none_work_well'],
    q2Reasons: [],
    q2Note: '',
    q3WorthShowing: null,
    q3Issues: ['not_enough_beautiful_or_pleasant_surroundings'],
    q3Note: 'Neither route felt pleasant enough.',
    q3NoteKind: 'supporting_detail'
  }));
  assert.equal(accepted.valid, true, accepted.errors.join('; '));

  const rejected = validateAnswerRecord(validAnswer({
    q1Choice: 'route_a',
    q1Choices: ['route_a'],
    q2Reasons: ['not_enough_beautiful_or_pleasant_surroundings'],
    q3WorthShowing: 'somewhat',
    q3Issues: []
  }));
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join(' '), /q2Reasons/);
});

test('rejects Q2 details without a selected reason', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'hard_to_judge',
    q1Choices: ['hard_to_judge'],
    q2Reasons: [],
    q2Note: 'No reason selected.',
    q3WorthShowing: null,
    q3Issues: []
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /q2Note/);
});

test('accepts the dedicated Both work poorly rejection reasons', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'none_work_well',
    q1Choices: ['none_work_well'],
    q2Reasons: [],
    q3WorthShowing: null,
    q3Issues: [
      'streets_too_busy_or_noisy',
      'not_enough_trees_or_green_space',
      'not_enough_route_near_water',
      'too_much_attention_traffic',
      'takes_too_long',
      'hard_to_follow',
      'prefer_another_known_route'
    ]
  }));

  assert.equal(result.valid, true);
});

test('Both work poorly never accepts the value-vs-Fast Q3 field', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'none_work_well',
    q1Choices: ['none_work_well'],
    q2Reasons: [],
    q3WorthShowing: 'a_lot',
    q3Issues: ['takes_too_long']
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /q3WorthShowing must be empty/);
});

test('keeps pre-value-question Route A records readable', () => {
  const historicalAnswer = validAnswer({ q3Issues: ['too_busy_or_crowded'] });
  delete historicalAnswer.q3WorthShowing;

  const result = validateAnswerRecord(historicalAnswer);
  assert.equal(result.valid, true);
  assert.deepEqual(result.record.q3Issues, ['too_busy_or_crowded']);
});

test('requires I am not sure to be the only Q3 reason', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'none_work_well',
    q1Choices: ['none_work_well'],
    q2Reasons: [],
    q3WorthShowing: null,
    q3Issues: ['not_sure', 'takes_too_long']
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /not_sure must be selected alone/);
});

test('rejects Route C in a current two-route Calm record', () => {
  const result = validateAnswerRecord(validAnswer({
    q1Choice: 'route_c',
    q1Choices: ['route_c'],
    q3WorthShowing: null,
    q2Reasons: []
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /legacy three-route/);
});

test('keeps a legacy three-route Calm Route Comparison answer readable', () => {
  const legacyAnswer = validAnswer({
    test: 'calm_route_comparison',
    source: 'calm-route-comparison',
    routeAssignment: {
      routeA: 'human',
      routeB: 'calm_quiet',
      routeC: 'calm_nature'
    },
    labels: {
      A: { routeId: 'human-1', routeType: 'human', source: 'human' },
      B: { routeId: 'quiet-1', routeType: 'calm_quiet', source: 'calm_quiet' },
      C: { routeId: 'nature-1', routeType: 'calm_nature', source: 'calm_nature' }
    },
    q1Choice: 'route_c',
    q2Separate: null,
    q2Reasons: [],
    q3Issues: ['too_busy_or_crowded']
  });
  delete legacyAnswer.q3WorthShowing;
  const result = validateAnswerRecord(legacyAnswer);

  assert.equal(result.valid, true);
  assert.equal(result.record.labelMap.C, 'calm_nature');
  assert.equal(result.record.labels.C.routeId, 'nature-1');
});

test('keeps legacy multiple Calm route selections readable', () => {
  const legacyAnswer = validAnswer({
    test: 'calm_route_comparison',
    source: 'calm-route-comparison',
    routeAssignment: {
      routeA: 'human',
      routeB: 'calm_quiet',
      routeC: 'calm_nature'
    },
    labels: {
      A: { routeId: 'human-1', routeType: 'human', source: 'human' },
      B: { routeId: 'quiet-1', routeType: 'calm_quiet', source: 'calm_quiet' },
      C: { routeId: 'nature-1', routeType: 'calm_nature', source: 'calm_nature' }
    },
    q1Choice: 'multiple_routes',
    q1Choices: ['route_a', 'route_c'],
    q2Separate: null,
    q2Reasons: [],
    q3Issues: ['too_busy_or_crowded']
  });
  delete legacyAnswer.q3WorthShowing;
  const result = validateAnswerRecord(legacyAnswer);

  assert.equal(result.valid, true);
  assert.equal(result.record.q1Choice, 'multiple_routes');
  assert.deepEqual(result.record.q1Choices, ['route_a', 'route_c']);
});

test('rejects a neutral Calm choice combined with a route', () => {
  const result = validateAnswerRecord(validAnswer({
    test: 'calm_route_comparison',
    source: 'calm-route-comparison',
    routeAssignment: {
      routeA: 'human',
      routeB: 'calm_quiet',
      routeC: 'calm_nature'
    },
    labels: {
      A: { routeId: 'human-1', routeType: 'human', source: 'human' },
      B: { routeId: 'quiet-1', routeType: 'calm_quiet', source: 'calm_quiet' },
      C: { routeId: 'nature-1', routeType: 'calm_nature', source: 'calm_nature' }
    },
    q1Choices: ['route_a', 'hard_to_judge'],
    q2Reasons: [],
    q3WorthShowing: null,
    q3Issues: []
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /combined only with other route choices/);
});
