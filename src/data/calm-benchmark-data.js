(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriCalmBenchmarkData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCHEMA_VERSION = 2;
  const DATASET_TYPE = 'calm-benchmark-dataset';
  const ANSWER_TYPE = 'bench-ux';
  const PROGRESS_TYPE = 'bench-progress';
  const TEST_ID = 'calm_route_comparison';
  const DEFAULT_STORAGE_KEY = 'ari-calm-benchmark-dataset-v1';
  const CALM_ROUTE_COMPARISON_TEST_ID = 'calm_route_comparison';
  const ROUTE_SLOTS = [
    { slot: 'A', key: 'routeA', typeKey: 'routeAType', idKey: 'routeARouteId' },
    { slot: 'B', key: 'routeB', typeKey: 'routeBType', idKey: 'routeBRouteId' },
    { slot: 'C', key: 'routeC', typeKey: 'routeCType', idKey: 'routeCRouteId' }
  ];

  const Q1_CHOICES = new Set([
    'route_a', 'route_b', 'route_c', 'either', 'neither', 'hard_to_judge',
    'both_work_well', 'both_work_poorly', 'all_three_work_well',
    'none_work_well', 'not_sure', 'multiple_routes'
  ]);
  const Q2_CHOICES = new Set(['yes', 'no', 'not_sure']);
  const Q3_WORTH_CHOICES = new Set(['a_lot', 'somewhat', 'a_little', 'not_at_all', 'not_sure']);
  const Q2_REASONS = new Set([
    'quieter_or_less_busy_streets',
    'more_trees_or_green_space',
    'more_near_water',
    'less_need_to_watch_traffic',
    'takes_less_time',
    'easier_to_follow',
    'familiar_route_or_area',
    'other',
    'not_sure'
  ]);
  const Q3_ISSUES = new Set([
    'not_enough_greenery_water',
    'too_busy_or_crowded',
    'lacks_nice_streets_surroundings',
    'extra_time_distance_not_worth_it',
    'too_similar',
    'too_complex',
    'streets_too_busy_or_noisy',
    'not_enough_trees_or_green_space',
    'not_enough_route_near_water',
    'too_much_attention_traffic',
    'takes_too_long',
    'hard_to_follow',
    'prefer_another_known_route',
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
    'lacks_amenities',
    'unnecessary_detour',
    'may_not_be_walkable',
    'not_sure'
  ]);
  const ROUTE_TYPES = new Set([
    'fast', 'calm', 'livemap_fast', 'google',
    'calm_quiet', 'calm_nature', 'human'
  ]);
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

  function asString(value, fallback = '') {
    return typeof value === 'string' ? value : value == null ? fallback : String(value);
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

  function routeLabelFromLegacy(input, descriptor, routeType) {
    const { slot, idKey } = descriptor;
    const existing = input.labels?.[slot];
    if (isObject(existing)) return clone(existing);
    return {
      routeId: input[idKey] || null,
      routeType,
      source: null,
      metadata: null
    };
  }

  function normalizeAnswerRecord(input) {
    const legacyQ1Choice = input.q1Choice ?? input.choice ?? null;
    const q1Choices = Array.isArray(input.q1Choices)
      ? [...input.q1Choices]
      : legacyQ1Choice == null ? [] : [legacyQ1Choice];
    const q1Choice = Array.isArray(input.q1Choices)
      ? q1Choices.length > 1 ? 'multiple_routes' : q1Choices[0] || null
      : legacyQ1Choice;
    const q3Issues = Array.isArray(input.q3Issues)
      ? [...input.q3Issues]
      : Array.isArray(input.reasons) ? [...input.reasons] : [];
    const q2Reasons = Array.isArray(input.q2Reasons) ? [...input.q2Reasons] : null;
    const routeTypes = Object.fromEntries(ROUTE_SLOTS.map(descriptor => [
      descriptor.slot,
      input[descriptor.typeKey]
        || input.routeAssignment?.[descriptor.key]
        || input.labelMap?.[descriptor.slot]
        || null
    ]));
    const sessionId = asString(input.sessionId || input.benchmarkRunId);
    const roundId = asString(input.roundId || input.captureId);
    const createdAt = input.createdAt || input.clientTs || isoNow();

    return {
      ...clone(input),
      v: Number.isInteger(input.v) ? input.v : 1,
      type: ANSWER_TYPE,
      test: input.test || TEST_ID,
      source: input.source || 'calm-benchmark',
      captureId: asString(input.captureId || roundId),
      benchmarkRunId: asString(input.benchmarkRunId || sessionId),
      sessionId,
      roundId,
      roundNumber: Number.isInteger(input.roundNumber) ? input.roundNumber : null,
      participantName: asString(input.participantName || input.rater),
      rater: asString(input.rater || input.participantName),
      pairId: asString(input.pairId),
      q1Choice,
      choice: q1Choice,
      q1Choices,
      q2Separate: input.q2Separate || null,
      ...(q2Reasons ? { q2Reasons } : {}),
      q2Note: asString(input.q2Note || input.q2Other),
      ...(Object.prototype.hasOwnProperty.call(input, 'q2Other') ? { q2Other: input.q2Other || '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, 'q3WorthShowing')
        ? { q3WorthShowing: input.q3WorthShowing || null }
        : {}),
      q3Issues,
      reasons: [...q3Issues],
      q3Note: asString(input.q3Note || input.note),
      note: asString(input.note || input.q3Note),
      routeAssignment: Object.fromEntries(
        ROUTE_SLOTS
          .filter(({ slot }) => routeTypes[slot])
          .map(({ slot, key }) => [key, routeTypes[slot]])
      ),
      routeAType: routeTypes.A,
      routeBType: routeTypes.B,
      routeCType: routeTypes.C,
      labelMap: Object.fromEntries(
        ROUTE_SLOTS
          .filter(({ slot }) => routeTypes[slot])
          .map(({ slot }) => [slot, routeTypes[slot]])
      ),
      labels: Object.fromEntries(
        ROUTE_SLOTS
          .filter(({ slot }) => routeTypes[slot])
          .map(descriptor => [
            descriptor.slot,
            routeLabelFromLegacy(input, descriptor, routeTypes[descriptor.slot])
          ])
      ),
      origin: input.origin ? clone(input.origin) : null,
      destination: input.destination ? clone(input.destination) : null,
      fastRouteShown: input.fastRouteShown === true,
      fastRoute: input.fastRoute ? clone(input.fastRoute) : null,
      clientTs: input.clientTs || createdAt,
      createdAt
    };
  }

  function normalizeProgressRecord(input) {
    const sessionId = asString(input.sessionId || input.benchmarkRunId);
    const savedAt = input.savedAt || input.updatedAt || isoNow();
    return {
      ...clone(input),
      v: Number.isInteger(input.v) ? input.v : 1,
      type: PROGRESS_TYPE,
      test: input.test || TEST_ID,
      source: input.source || 'calm-benchmark',
      benchmarkRunId: input.benchmarkRunId || sessionId,
      sessionId,
      participantName: asString(input.participantName),
      sessionStartedAt: input.sessionStartedAt || input.startedAt || savedAt,
      roundIndex: Number.isInteger(input.roundIndex) ? input.roundIndex : 0,
      completedRounds: Number.isInteger(input.completedRounds) ? input.completedRounds : 0,
      goalCheckpointPending: input.goalCheckpointPending === true,
      pairId: input.pairId || null,
      routeAssignment: input.routeAssignment ? clone(input.routeAssignment) : null,
      questionStep: input.questionStep || 'q1',
      partialAnswer: input.partialAnswer ? normalizeAnswerRecord(input.partialAnswer) : null,
      savedAt,
      updatedAt: savedAt
    };
  }

  function validateRouteAssignment(record, errors) {
    const assignments = ROUTE_SLOTS
      .map(({ key }) => record.routeAssignment?.[key])
      .filter(Boolean);
    const isLegacyThreeRouteCalm = record.test === CALM_ROUTE_COMPARISON_TEST_ID
      && assignments.length === 3;
    const expectedCount = isLegacyThreeRouteCalm ? 3 : 2;
    if (
      assignments.length !== expectedCount
      || assignments.some(routeType => !ROUTE_TYPES.has(routeType))
      || new Set(assignments).size !== assignments.length
    ) {
      errors.push('routeAssignment must map Route A and Route B to two different supported route types. Legacy Calm records may also include a distinct Route C.');
    }
  }

  function validateAnswerRecord(input, { allowPartial = false } = {}) {
    const record = normalizeAnswerRecord(input);
    const hasQ2ReasonsField = Object.prototype.hasOwnProperty.call(input || {}, 'q2Reasons');
    const hasQ3WorthField = Object.prototype.hasOwnProperty.call(input || {}, 'q3WorthShowing');
    const q2Reasons = Array.isArray(record.q2Reasons) ? record.q2Reasons : [];
    const errors = [];
    const warnings = [];
    const strictCurrentCalm = Number(input?.v) >= 2
      && record.test === CALM_ROUTE_COMPARISON_TEST_ID
      && record.source === 'calm-route-comparison';

    if (!record.sessionId) errors.push('sessionId is required.');
    if (!record.roundId) errors.push('roundId is required.');
    if (!record.captureId) errors.push('captureId is required.');
    if (!record.pairId) errors.push('pairId is required.');
    if (!record.participantName.trim()) errors.push('participantName is required.');
    if (record.participantName.length > 80) errors.push('participantName must be 80 characters or fewer.');
    ['sessionId', 'roundId', 'captureId', 'pairId'].forEach(field => {
      if (String(record[field] || '').length > 200) errors.push(`${field} must be 200 characters or fewer.`);
    });
    if (record.q2Note.length > 500) errors.push('q2Note must be 500 characters or fewer.');
    if (record.q3Note.length > 500) errors.push('q3Note must be 500 characters or fewer.');
    if (strictCurrentCalm && (typeof record.participantId !== 'string' || !record.participantId || record.participantId.length > 200)) {
      errors.push('participantId is required and must be 200 characters or fewer for current Calm records.');
    }
    if (strictCurrentCalm && (!record.consentVersion || !isIsoDate(record.consentedAt))) {
      errors.push('Current Calm records require a consent version and timestamp.');
    }
    if (!isIsoDate(record.createdAt)) errors.push('createdAt must be an ISO timestamp.');
    if (record.roundNumber != null && (!Number.isInteger(record.roundNumber) || record.roundNumber < 1)) {
      errors.push('roundNumber must be a positive integer.');
    }
    validateRouteAssignment(record, errors);

    if (strictCurrentCalm) {
      const pairMatch = record.pairId.match(/^calm-route-comparison-(\d{2})-round-(\d+)$/);
      if (!pairMatch) {
        errors.push('pairId must identify one of the 23 current Calm pairs and its presentation round.');
      } else {
        const pairNumber = Number(pairMatch[1]);
        const presentationRound = Number(pairMatch[2]);
        if (pairNumber < 1 || pairNumber > 23) errors.push('Calm pair number must be between 1 and 23.');
        if (presentationRound !== record.roundNumber) errors.push('pairId presentation round must match roundNumber.');
        const expectedRoundId = `${record.sessionId}-round-${record.roundNumber}`;
        if (record.roundId !== expectedRoundId || record.captureId !== expectedRoundId) {
          errors.push('roundId and captureId must match the session and roundNumber.');
        }
        ['A', 'B'].forEach(slot => {
          const routeType = record.labelMap?.[slot];
          const expectedRouteId = `calm-round-${pairNumber}-${routeType === 'calm_quiet' ? 'calm-quiet' : routeType === 'calm_nature' ? 'calm-nature' : ''}`;
          if (record.labels?.[slot]?.routeType !== routeType) errors.push(`labels.${slot}.routeType must match labelMap.${slot}.`);
          if (!expectedRouteId.endsWith('-') && record.labels?.[slot]?.routeId !== expectedRouteId) {
            errors.push(`labels.${slot}.routeId does not belong to the selected Calm pair.`);
          }
        });
      }
      if (record.roundNumber == null || record.roundNumber > 23) errors.push('roundNumber must be between 1 and 23.');
      if (typeof record.q1KnowsBetter !== 'boolean') errors.push('q1KnowsBetter must be a boolean.');
    }

    if (record.q1Choice == null && allowPartial && record.q1Choices.length === 0) {
      // A newly started round is valid progress even before Q1 is answered.
    } else if (!Q1_CHOICES.has(record.q1Choice)) {
      errors.push('q1Choice is invalid.');
    }
    const invalidQ1Choices = record.q1Choices.filter(choice => !Q1_CHOICES.has(choice) || choice === 'multiple_routes');
    if (invalidQ1Choices.length) errors.push(`q1Choices contains invalid values: ${invalidQ1Choices.join(', ')}.`);
    if (new Set(record.q1Choices).size !== record.q1Choices.length) errors.push('q1Choices contains duplicates.');
    if (
      record.test === CALM_ROUTE_COMPARISON_TEST_ID
      && record.q1Choices.length > 1
      && record.q1Choices.some(choice => !['route_a', 'route_b', 'route_c'].includes(choice))
    ) {
      errors.push('Calm route choices can be combined only with other route choices.');
    }
    if (
      record.q1Choice === 'multiple_routes'
      && (
        record.test !== CALM_ROUTE_COMPARISON_TEST_ID
        || record.q1Choices.length < 2
        || record.q1Choices.some(choice => !['route_a', 'route_b', 'route_c'].includes(choice))
      )
    ) {
      errors.push('multiple_routes requires at least two Calm route choices.');
    }
    if (
      record.test === CALM_ROUTE_COMPARISON_TEST_ID
      && !record.routeAssignment?.routeC
      && record.q1Choices.includes('route_c')
    ) {
      errors.push('route_c is available only in legacy three-route Calm records.');
    }

    if (record.q2Separate != null && !Q2_CHOICES.has(record.q2Separate)) {
      errors.push('q2Separate is invalid.');
    }

    const invalidQ2Reasons = q2Reasons.filter(reason => !Q2_REASONS.has(reason));
    if (invalidQ2Reasons.length) errors.push(`q2Reasons contains invalid values: ${invalidQ2Reasons.join(', ')}.`);
    if (new Set(q2Reasons).size !== q2Reasons.length) errors.push('q2Reasons contains duplicates.');
    if (q2Reasons.includes('not_sure') && q2Reasons.length > 1) {
      errors.push('q2Reasons not_sure must be selected alone.');
    }
    if (record.q2Other && !q2Reasons.includes('other')) {
      errors.push('q2Other must be empty unless q2Reasons includes other.');
    }
    if (record.q2Note && !q2Reasons.length) {
      errors.push('q2Note must be empty when q2Reasons is empty.');
    }

    const invalidIssues = record.q3Issues.filter(issue => !Q3_ISSUES.has(issue));
    if (invalidIssues.length) errors.push(`q3Issues contains invalid values: ${invalidIssues.join(', ')}.`);
    if (new Set(record.q3Issues).size !== record.q3Issues.length) errors.push('q3Issues contains duplicates.');
    if (record.q3Issues.includes('not_sure') && record.q3Issues.length > 1) {
      errors.push('q3Issues not_sure must be selected alone.');
    }
    if (record.q3WorthShowing != null && !Q3_WORTH_CHOICES.has(record.q3WorthShowing)) {
      errors.push('q3WorthShowing is invalid.');
    }

    if (!allowPartial && Q1_CHOICES.has(record.q1Choice)) {
      const isFastGoogle = record.test === 'ari_fast_vs_google';
      const isCalmRouteComparison = record.test === CALM_ROUTE_COMPARISON_TEST_ID;
      const selectedCalmRoutes = record.q1Choices.filter(choice => ['route_a', 'route_b', 'route_c'].includes(choice));
      const calmRouteCount = record.routeAssignment?.routeC ? 3 : 2;
      const needsLegacyQ2 = !isFastGoogle
        && !isCalmRouteComparison
        && ['route_a', 'route_b', 'either'].includes(record.q1Choice);
      const needsCalmQ2 = isCalmRouteComparison
        && ['route_a', 'route_b', 'both_work_well'].includes(record.q1Choice);
      const needsCalmWorthQ3 = isCalmRouteComparison
        && ['route_a', 'route_b', 'both_work_well'].includes(record.q1Choice);
      const needsCalmRejectionReasons = isCalmRouteComparison
        && record.q1Choices.includes('none_work_well');
      const needsLegacyQ3Issues = isFastGoogle
        ? ['route_a', 'route_b', 'both_work_poorly'].includes(record.q1Choice)
        : isCalmRouteComparison
          ? needsCalmRejectionReasons
            || (selectedCalmRoutes.length > 0 && selectedCalmRoutes.length < calmRouteCount)
          : ['route_a', 'route_b', 'neither'].includes(record.q1Choice);
      if (needsLegacyQ2 && !record.q2Separate) errors.push('q2Separate is required for this Q1 answer.');
      if (!needsLegacyQ2 && record.q2Separate) errors.push('q2Separate must be empty for this Q1 answer.');
      if (needsCalmQ2 && (strictCurrentCalm || hasQ2ReasonsField) && !q2Reasons.length) errors.push('At least one q2Reason is required for this Q1 answer.');
      if (!needsCalmQ2 && q2Reasons.length) errors.push('q2Reasons must be empty for this Q1 answer.');
      if (isCalmRouteComparison && (strictCurrentCalm || hasQ3WorthField)) {
        if (needsCalmWorthQ3 && !record.q3WorthShowing) {
          errors.push('q3WorthShowing is required for this Q1 answer.');
        }
        if (!needsCalmWorthQ3 && record.q3WorthShowing) {
          errors.push('q3WorthShowing must be empty for this Q1 answer.');
        }
        if (needsCalmRejectionReasons && !record.q3Issues.length) {
          errors.push('At least one q3Issue is required for this Q1 answer.');
        }
        if (!needsCalmRejectionReasons && record.q3Issues.length) {
          errors.push('q3Issues must be empty for this Q1 answer.');
        }
      } else {
        if (record.q3WorthShowing) errors.push('q3WorthShowing must be empty for this test.');
        if (needsLegacyQ3Issues && !record.q3Issues.length) errors.push('At least one q3Issue is required for this Q1 answer.');
        if (!needsLegacyQ3Issues && record.q3Issues.length) errors.push('q3Issues must be empty for this Q1 answer.');
      }
    }

    const requiredLabelSlots = record.routeAssignment?.routeC ? ['A', 'B', 'C'] : ['A', 'B'];
    requiredLabelSlots.forEach(slot => {
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
    if (record.participantName.length > 80) errors.push('participantName must be 80 characters or fewer.');
    if (record.sessionId.length > 200) errors.push('sessionId must be 200 characters or fewer.');
    const strictCurrentCalm = Number(input?.v) >= 2
      && record.test === CALM_ROUTE_COMPARISON_TEST_ID
      && record.source === 'calm-route-comparison';
    if (strictCurrentCalm && (typeof record.participantId !== 'string' || !record.participantId || record.participantId.length > 200)) {
      errors.push('participantId is required and must be 200 characters or fewer for current Calm progress.');
    }
    if (strictCurrentCalm && (!record.consentVersion || !isIsoDate(record.consentedAt))) {
      errors.push('Current Calm progress requires a consent version and timestamp.');
    }
    if (!Number.isInteger(record.roundIndex) || record.roundIndex < 0) errors.push('roundIndex must be zero or greater.');
    if (!Number.isInteger(record.completedRounds) || record.completedRounds < 0) errors.push('completedRounds must be zero or greater.');
    if (typeof record.goalCheckpointPending !== 'boolean') errors.push('goalCheckpointPending must be a boolean.');
    if (!QUESTION_STEPS.has(record.questionStep)) errors.push('questionStep is invalid.');
    if (!isIsoDate(record.savedAt)) errors.push('savedAt must be an ISO timestamp.');
    if (record.routeAssignment) validateRouteAssignment(record, errors);
    if (strictCurrentCalm) {
      if (record.roundIndex > 22) errors.push('roundIndex cannot exceed the final Calm pair.');
      if (record.completedRounds > 23) errors.push('completedRounds cannot exceed 23.');
      if (![record.roundIndex, record.roundIndex + 1].includes(record.completedRounds)) {
        errors.push('completedRounds must match the active round position.');
      }
    }

    if (record.partialAnswer) {
      const partial = validateAnswerRecord(input.partialAnswer || record.partialAnswer, { allowPartial: true });
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
    CALM_ROUTE_COMPARISON_TEST_ID,
    DEFAULT_STORAGE_KEY,
    DataValidationError,
    normalizeAnswerRecord,
    normalizeProgressRecord,
    validateAnswerRecord,
    validateProgressRecord,
    createLocalRepository
  };
});
