const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DataValidationError,
  createLocalRepository,
  validateAnswerRecord
} = require('../src/data/calm-benchmark-data.js');

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
    sessionId: 'calm-session-123',
    benchmarkRunId: 'calm-session-123',
    roundId: 'calm-session-123-round-1',
    captureId: 'calm-session-123-round-1',
    roundNumber: 1,
    participantName: 'Irene',
    rater: 'Irene',
    pairId: 'pair-1',
    routeAssignment: { routeA: 'calm', routeB: 'fast' },
    labels: {
      A: { routeId: 'calm-route-1', routeType: 'calm', source: 'model' },
      B: { routeId: 'fast-route-1', routeType: 'fast', source: 'google' }
    },
    q1Choice: 'route_a',
    q2Separate: 'yes',
    q3Issues: ['not_enough_greenery_water'],
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
    partialAnswer: validAnswer({ q2Separate: null, q3Issues: [] }),
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
  assert.equal(snapshot.answers[0].labelMap.A, 'calm');
  assert.equal(snapshot.answers[0].labels.B.routeId, 'fast-route-1');
  assert.deepEqual(repository.verify().stats, {
    sessions: 1,
    progressRecords: 0,
    answers: 1
  });
});

test('rejects submitted answers that do not satisfy conditional questions', () => {
  const result = validateAnswerRecord(validAnswer({ q3Issues: [] }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /q3Issue/);

  const repository = createLocalRepository(new MemoryStorage());
  assert.throws(
    () => repository.saveAnswer(validAnswer({ q3Issues: [] })),
    error => error instanceof DataValidationError
  );
});

test('stores partial progress and returns the latest resumable session', () => {
  const repository = createLocalRepository(new MemoryStorage());
  repository.saveProgress(validProgress());
  repository.saveProgress(validProgress({
    roundIndex: 1,
    completedRounds: 1,
    pairId: 'pair-2',
    questionStep: 'q1',
    partialAnswer: validAnswer({
      roundId: 'calm-session-123-round-2',
      captureId: 'calm-session-123-round-2',
      roundNumber: 2,
      pairId: 'pair-2',
      q1Choice: null,
      q2Separate: null,
      q3Issues: []
    }),
    savedAt: '2026-07-13T10:02:00.000Z'
  }));

  const progress = repository.getLatestProgress();
  assert.equal(progress.sessionId, 'calm-session-123');
  assert.equal(progress.roundIndex, 1);
  assert.equal(progress.partialAnswer.q1Choice, null);
  assert.equal(repository.verify().valid, true);
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
  assert.equal(rows[0].test, 'calm_vs_fast');
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
