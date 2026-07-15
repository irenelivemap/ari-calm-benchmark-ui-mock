(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriCalmBenchmarkData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCHEMA_VERSION = 1;
  const DATASET_TYPE = 'calm-benchmark-dataset';
  const ANSWER_TYPE = 'bench-ux';
  const PROGRESS_TYPE = 'bench-progress';
  const TEST_ID = 'calm_vs_fast';
  const DEFAULT_STORAGE_KEY = 'ari-calm-benchmark-dataset-v1';

  const Q1_CHOICES = new Set([
    'route_a', 'route_b', 'either', 'neither', 'hard_to_judge',
    'both_work_well', 'both_work_poorly', 'not_sure'
  ]);
  const Q2_CHOICES = new Set(['yes', 'no', 'not_sure']);
  const Q3_ISSUES = new Set([
    'not_enough_greenery_water',
    'too_busy_or_crowded',
    'lacks_nice_streets_surroundings',
    'extra_time_distance_not_worth_it',
    'too_similar',
    'too_complex',
    'other',
    'longer_time',
    'longer_distance',
    'more_elevation',
    'more_stairs',
    'misses_shortcut',
    'more_turns',
    'unclear_shortcut',
    'crossing_friction',
    'misses_nicer_route',
    'lacks_amenities'
  ]);
  const ROUTE_TYPES = new Set(['fast', 'calm', 'livemap_fast', 'google']);
  const QUESTION_STEPS = new Set(['q1', 'q2', 'q3']);

  class DataValidationError extends Error {
    constructor(message, details) {
      super(message);
      this.name = 'DataValidationError';
      this.details = details;
    }
  }

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function isIsoDate(value) {
    return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
  }

  function readJson(storage, key, fallback) {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new DataValidationError(`Stored benchmark data at ${key} is not valid JSON.`, [error.message]);
    }
  }

  function routeLabelFromLegacy(input, slot, routeType) {
    const existing = input.labels?.[slot];
    if (isObject(existing)) return clone(existing);
    return {
      routeId: input[slot === 'A' ? 'routeARouteId' : 'routeBRouteId'] || null,
      routeType,
      source: null,
      metadata: null
    };
  }

  function normalizeAnswerRecord(input) {
    const q1Choice = input.q1Choice ?? input.choice ?? null;
    const q3Issues = Array.isArray(input.q3Issues)
      ? [...input.q3Issues]
      : Array.isArray(input.reasons) ? [...input.reasons] : [];
    const routeAType = input.routeAType || input.routeAssignment?.routeA || input.labelMap?.A || null;
    const routeBType = input.routeBType || input.routeAssignment?.routeB || input.labelMap?.B || null;
    const sessionId = input.sessionId || input.benchmarkRunId || '';
    const roundId = input.roundId || input.captureId || '';
    const createdAt = input.createdAt || input.clientTs || isoNow();

    return {
      ...clone(input),
      v: SCHEMA_VERSION,
      type: ANSWER_TYPE,
      test: input.test || TEST_ID,
      source: input.source || 'calm-benchmark',
      captureId: input.captureId || roundId,
      benchmarkRunId: input.benchmarkRunId || sessionId,
      sessionId,
      roundId,
      roundNumber: Number.isInteger(input.roundNumber) ? input.roundNumber : null,
      participantName: input.participantName || input.rater || '',
      rater: input.rater || input.participantName || '',
      pairId: input.pairId || '',
      q1Choice,
      choice: q1Choice,
      q2Separate: input.q2Separate || null,
      q3Issues,
      reasons: [...q3Issues],
      q3Note: input.q3Note || input.note || '',
      note: input.note || input.q3Note || '',
      routeAssignment: { routeA: routeAType, routeB: routeBType },
      routeAType,
      routeBType,
      labelMap: { A: routeAType, B: routeBType },
      labels: {
        A: routeLabelFromLegacy(input, 'A', routeAType),
        B: routeLabelFromLegacy(input, 'B', routeBType)
      },
      origin: input.origin ? clone(input.origin) : null,
      destination: input.destination ? clone(input.destination) : null,
      clientTs: input.clientTs || createdAt,
      createdAt
    };
  }

  function normalizeProgressRecord(input) {
    const sessionId = input.sessionId || input.benchmarkRunId || '';
    const savedAt = input.savedAt || input.updatedAt || isoNow();
    return {
      ...clone(input),
      v: SCHEMA_VERSION,
      type: PROGRESS_TYPE,
      test: input.test || TEST_ID,
      source: input.source || 'calm-benchmark',
      benchmarkRunId: input.benchmarkRunId || sessionId,
      sessionId,
      participantName: input.participantName || '',
      sessionStartedAt: input.sessionStartedAt || input.startedAt || savedAt,
      roundIndex: Number.isInteger(input.roundIndex) ? input.roundIndex : 0,
      completedRounds: Number.isInteger(input.completedRounds) ? input.completedRounds : 0,
      pairId: input.pairId || null,
      routeAssignment: input.routeAssignment ? clone(input.routeAssignment) : null,
      questionStep: input.questionStep || 'q1',
      partialAnswer: input.partialAnswer ? normalizeAnswerRecord(input.partialAnswer) : null,
      savedAt,
      updatedAt: savedAt
    };
  }

  function validateRouteAssignment(record, errors) {
    const routeA = record.routeAssignment?.routeA;
    const routeB = record.routeAssignment?.routeB;
    if (!ROUTE_TYPES.has(routeA) || !ROUTE_TYPES.has(routeB) || routeA === routeB) {
      errors.push('routeAssignment must map Route A and Route B to two different supported route types.');
    }
  }

  function validateAnswerRecord(input, { allowPartial = false } = {}) {
    const record = normalizeAnswerRecord(input);
    const errors = [];
    const warnings = [];

    if (!record.sessionId) errors.push('sessionId is required.');
    if (!record.roundId) errors.push('roundId is required.');
    if (!record.captureId) errors.push('captureId is required.');
    if (!record.pairId) errors.push('pairId is required.');
    if (!record.participantName.trim()) errors.push('participantName is required.');
    if (!isIsoDate(record.createdAt)) errors.push('createdAt must be an ISO timestamp.');
    if (record.roundNumber != null && (!Number.isInteger(record.roundNumber) || record.roundNumber < 1)) {
      errors.push('roundNumber must be a positive integer.');
    }
    validateRouteAssignment(record, errors);

    if (record.q1Choice == null && allowPartial) {
      // A newly started round is valid progress even before Q1 is answered.
    } else if (!Q1_CHOICES.has(record.q1Choice)) {
      errors.push('q1Choice is invalid.');
    }

    if (record.q2Separate != null && !Q2_CHOICES.has(record.q2Separate)) {
      errors.push('q2Separate is invalid.');
    }

    const invalidIssues = record.q3Issues.filter(issue => !Q3_ISSUES.has(issue));
    if (invalidIssues.length) errors.push(`q3Issues contains invalid values: ${invalidIssues.join(', ')}.`);
    if (new Set(record.q3Issues).size !== record.q3Issues.length) errors.push('q3Issues contains duplicates.');

    if (!allowPartial && Q1_CHOICES.has(record.q1Choice)) {
      const isFastGoogle = record.test === 'ari_fast_vs_google';
      const needsQ2 = !isFastGoogle && ['route_a', 'route_b', 'either'].includes(record.q1Choice);
      const needsQ3 = isFastGoogle
        ? ['route_a', 'route_b', 'both_work_poorly'].includes(record.q1Choice)
        : ['route_a', 'route_b', 'neither'].includes(record.q1Choice);
      if (needsQ2 && !record.q2Separate) errors.push('q2Separate is required for this Q1 answer.');
      if (!needsQ2 && record.q2Separate) errors.push('q2Separate must be empty for this Q1 answer.');
      if (needsQ3 && !record.q3Issues.length) errors.push('At least one q3Issue is required for this Q1 answer.');
      if (!needsQ3 && record.q3Issues.length) errors.push('q3Issues must be empty for this Q1 answer.');
    }

    ['A', 'B'].forEach(slot => {
      const label = record.labels?.[slot];
      if (!isObject(label)) {
        errors.push(`labels.${slot} is required.`);
      } else if (!label.routeId) {
        warnings.push(`labels.${slot}.routeId is missing; this record cannot open a specific route in a dashboard.`);
      }
    });

    return { valid: errors.length === 0, errors, warnings, record };
  }

  function validateProgressRecord(input) {
    const record = normalizeProgressRecord(input);
    const errors = [];
    const warnings = [];

    if (!record.sessionId) errors.push('sessionId is required.');
    if (!record.participantName.trim()) errors.push('participantName is required.');
    if (!Number.isInteger(record.roundIndex) || record.roundIndex < 0) errors.push('roundIndex must be zero or greater.');
    if (!Number.isInteger(record.completedRounds) || record.completedRounds < 0) errors.push('completedRounds must be zero or greater.');
    if (!QUESTION_STEPS.has(record.questionStep)) errors.push('questionStep is invalid.');
    if (!isIsoDate(record.savedAt)) errors.push('savedAt must be an ISO timestamp.');
    if (record.routeAssignment) validateRouteAssignment(record, errors);

    if (record.partialAnswer) {
      const partial = validateAnswerRecord(record.partialAnswer, { allowPartial: true });
      errors.push(...partial.errors.map(error => `partialAnswer: ${error}`));
      warnings.push(...partial.warnings.map(warning => `partialAnswer: ${warning}`));
      if (record.partialAnswer.sessionId !== record.sessionId) errors.push('partialAnswer sessionId must match progress sessionId.');
      if (record.pairId && record.partialAnswer.pairId !== record.pairId) errors.push('partialAnswer pairId must match progress pairId.');
    }

    return { valid: errors.length === 0, errors, warnings, record };
  }

  function assertValid(result, label) {
    if (!result.valid) throw new DataValidationError(`${label} failed validation.`, result.errors);
    return result.record;
  }

  function emptyDataset(testId = TEST_ID) {
    return {
      v: SCHEMA_VERSION,
      type: DATASET_TYPE,
      test: testId,
      updatedAt: isoNow(),
      sessions: {},
      progressBySessionId: {},
      answers: []
    };
  }

  function normalizeDataset(input, testId = TEST_ID) {
    if (!isObject(input)) return emptyDataset(testId);
    return {
      v: SCHEMA_VERSION,
      type: DATASET_TYPE,
      test: input.test || testId,
      updatedAt: input.updatedAt || isoNow(),
      sessions: isObject(input.sessions) ? clone(input.sessions) : {},
      progressBySessionId: isObject(input.progressBySessionId) ? clone(input.progressBySessionId) : {},
      answers: Array.isArray(input.answers) ? input.answers.map(normalizeAnswerRecord) : []
    };
  }

  function updateSessionSummary(dataset, progress) {
    const existing = dataset.sessions[progress.sessionId] || {};
    dataset.sessions[progress.sessionId] = {
      sessionId: progress.sessionId,
      participantName: progress.participantName,
      startedAt: existing.startedAt || progress.sessionStartedAt || progress.savedAt,
      updatedAt: progress.savedAt,
      completedRounds: progress.completedRounds,
      roundIndex: progress.roundIndex,
      status: 'active'
    };
  }

  function updateSessionSummaryFromAnswer(dataset, answer) {
    const existing = dataset.sessions[answer.sessionId] || {};
    const answerCount = dataset.answers.filter(record => record.sessionId === answer.sessionId).length;
    dataset.sessions[answer.sessionId] = {
      sessionId: answer.sessionId,
      participantName: answer.participantName,
      startedAt: existing.startedAt || answer.sessionStartedAt || answer.createdAt,
      updatedAt: answer.createdAt,
      completedRounds: Math.max(existing.completedRounds || 0, answerCount),
      roundIndex: Math.max(existing.roundIndex || 0, (answer.roundNumber || answerCount) - 1),
      status: existing.status || 'active'
    };
  }

  function createLocalRepository(storage, options = {}) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      throw new TypeError('A Storage-compatible object is required.');
    }

    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    const testId = options.testId || TEST_ID;
    const legacyAnswersKey = options.legacyAnswersKey || 'ari-calm-benchmark-answers';
    const legacyProgressKey = options.legacyProgressKey || 'ari-calm-benchmark-progress';

    function writeDataset(dataset) {
      dataset.updatedAt = isoNow();
      storage.setItem(storageKey, JSON.stringify(dataset));
    }

    function migrateLegacy(dataset) {
      let changed = false;
      const legacyAnswers = readJson(storage, legacyAnswersKey, []);
      if (Array.isArray(legacyAnswers)) {
        legacyAnswers.forEach(answer => {
          const normalized = normalizeAnswerRecord(answer);
          if (!normalized.captureId) return;
          if (!dataset.answers.some(existing => existing.captureId === normalized.captureId)) {
            dataset.answers.push(normalized);
            changed = true;
          }
        });
      }

      const legacyProgress = readJson(storage, legacyProgressKey, null);
      if (isObject(legacyProgress) && legacyProgress.sessionId) {
        const normalized = normalizeProgressRecord(legacyProgress);
        if (!dataset.progressBySessionId[normalized.sessionId]) {
          dataset.progressBySessionId[normalized.sessionId] = normalized;
          updateSessionSummary(dataset, normalized);
          changed = true;
        }
      }
      return changed;
    }

    function readDataset() {
      const stored = readJson(storage, storageKey, null);
      const dataset = normalizeDataset(stored, testId);
      const migrated = migrateLegacy(dataset);
      if (!stored || migrated) writeDataset(dataset);
      return dataset;
    }

    function saveAnswer(input) {
      const record = assertValid(validateAnswerRecord(input), 'Answer record');
      const dataset = readDataset();
      const existing = dataset.answers.find(answer => answer.captureId === record.captureId);
      if (existing) return { status: 'duplicate', record: clone(existing) };
      dataset.answers.push(record);
      const progress = dataset.progressBySessionId[record.sessionId];
      if (progress) {
        updateSessionSummary(dataset, progress);
      } else {
        updateSessionSummaryFromAnswer(dataset, record);
      }
      writeDataset(dataset);
      return { status: 'saved', record: clone(record) };
    }

    function saveProgress(input) {
      const record = assertValid(validateProgressRecord(input), 'Progress record');
      const dataset = readDataset();
      dataset.progressBySessionId[record.sessionId] = record;
      updateSessionSummary(dataset, record);
      writeDataset(dataset);
      return { status: 'saved', record: clone(record) };
    }

    function getLatestProgress() {
      const dataset = readDataset();
      const records = Object.values(dataset.progressBySessionId);
      records.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
      return records.length ? clone(records[0]) : null;
    }

    function getSnapshot() {
      return clone(readDataset());
    }

    function verify() {
      const dataset = readDataset();
      const errors = [];
      const warnings = [];
      const ids = new Set();

      dataset.answers.forEach((answer, index) => {
        const result = validateAnswerRecord(answer);
        errors.push(...result.errors.map(error => `answers[${index}]: ${error}`));
        warnings.push(...result.warnings.map(warning => `answers[${index}]: ${warning}`));
        if (ids.has(result.record.captureId)) errors.push(`answers[${index}]: duplicate captureId ${result.record.captureId}.`);
        ids.add(result.record.captureId);
      });

      Object.entries(dataset.progressBySessionId).forEach(([sessionId, progress]) => {
        const result = validateProgressRecord(progress);
        errors.push(...result.errors.map(error => `progressBySessionId.${sessionId}: ${error}`));
        warnings.push(...result.warnings.map(warning => `progressBySessionId.${sessionId}: ${warning}`));
      });

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
          sessions: Object.keys(dataset.sessions).length,
          progressRecords: Object.keys(dataset.progressBySessionId).length,
          answers: dataset.answers.length
        }
      };
    }

    function exportAnswerJsonl() {
      return readDataset().answers.map(answer => JSON.stringify(answer)).join('\n');
    }

    function clear() {
      if (typeof storage.removeItem === 'function') {
        storage.removeItem(storageKey);
        storage.removeItem(legacyAnswersKey);
        storage.removeItem(legacyProgressKey);
      } else {
        storage.setItem(legacyAnswersKey, '[]');
        storage.setItem(legacyProgressKey, 'null');
      }
      writeDataset(emptyDataset(testId));
      return { status: 'cleared' };
    }

    return {
      storageKey,
      saveAnswer,
      saveProgress,
      getLatestProgress,
      getSnapshot,
      verify,
      exportAnswerJsonl,
      clear
    };
  }

  return {
    SCHEMA_VERSION,
    TEST_ID,
    DEFAULT_STORAGE_KEY,
    DataValidationError,
    normalizeAnswerRecord,
    normalizeProgressRecord,
    validateAnswerRecord,
    validateProgressRecord,
    createLocalRepository
  };
});
