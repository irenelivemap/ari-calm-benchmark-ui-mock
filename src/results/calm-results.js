(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriCalmResults = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const OUTCOMES = [
    'calm_quiet',
    'calm_nature',
    'none_work_well',
    'hard_to_judge'
  ];
  const Q2_CHOICES = ['yes', 'no', 'not_sure'];
  const REASONS = [
    'not_enough_greenery_water',
    'too_busy_or_crowded',
    'lacks_nice_streets_surroundings',
    'extra_time_distance_not_worth_it',
    'too_similar',
    'too_complex',
    'other'
  ];

  const OUTCOME_LABELS = {
    calm_quiet: 'Calm Quiet',
    calm_nature: 'Calm Nature',
    none_work_well: 'None work well',
    hard_to_judge: 'Hard to judge',
    multiple_routes: 'Multiple routes',
    unknown: 'Unknown'
  };

  const REASON_LABELS = {
    not_enough_greenery_water: 'Not enough greenery or water',
    too_busy_or_crowded: 'Too busy or crowded',
    lacks_nice_streets_surroundings: 'Lacks nice streets or surroundings',
    extra_time_distance_not_worth_it: 'Extra time or distance not worth it',
    too_similar: 'Too similar to the other route',
    too_complex: 'Too complex to follow',
    other: 'Other'
  };

  function q1Selections(answer) {
    const choices = Array.isArray(answer.q1Choices) && answer.q1Choices.length
      ? [...answer.q1Choices]
      : [answer.q1Choice || answer.choice].filter(Boolean);
    const choice = choices[0];
    if (choice === 'both_work_well') return ['route_a', 'route_b'];
    if (choice === 'all_three_work_well') return ['route_a', 'route_b', 'route_c'];
    return choices.filter(value => value !== 'multiple_routes');
  }

  function selectedRouteTypes(answer) {
    const mapping = answer.labelMap || answer.routeAssignment || {};
    const routeTypes = {
      route_a: mapping.A || mapping.routeA || answer.routeAType || 'unknown',
      route_b: mapping.B || mapping.routeB || answer.routeBType || 'unknown',
      route_c: mapping.C || mapping.routeC || answer.routeCType || 'unknown'
    };
    const outcomes = q1Selections(answer).map(choice => routeTypes[choice] || choice);
    return outcomes.length ? outcomes : ['unknown'];
  }

  function selectedRouteType(answer) {
    const outcomes = selectedRouteTypes(answer);
    return outcomes.length === 1 ? outcomes[0] : 'multiple_routes';
  }

  function selectedSlots(answer) {
    const slots = { route_a: 'A', route_b: 'B', route_c: 'C' };
    return q1Selections(answer).map(choice => slots[choice]).filter(Boolean);
  }

  function normalizeRow(answer) {
    const reasons = Array.isArray(answer.q3Issues)
      ? answer.q3Issues
      : Array.isArray(answer.reasons) ? answer.reasons : [];
    const outcomes = selectedRouteTypes(answer);
    const participant = answer.participantName || answer.rater || 'Anonymous';
    return {
      id: answer.captureId || answer.roundId || '',
      participant,
      participantId: answer.participantId
        || answer.sessionId
        || answer.benchmarkRunId
        || `name:${participant}`,
      sessionId: answer.sessionId || answer.benchmarkRunId || '',
      pairId: answer.pairId || 'Unknown pair',
      roundNumber: Number.isFinite(Number(answer.roundNumber)) ? Number(answer.roundNumber) : null,
      date: answer.clientTs || answer.createdAt || '',
      outcome: outcomes.length === 1 ? outcomes[0] : 'multiple_routes',
      outcomes,
      q2: answer.q2Separate || null,
      reasons: [...reasons],
      note: answer.q3Note || answer.note || '',
      selectedSlots: selectedSlots(answer),
      raw: answer
    };
  }

  function filterAnswers(answers, filters = {}) {
    return (answers || []).map(normalizeRow).filter(row => {
      if (filters.participant && row.participant !== filters.participant) return false;
      if (filters.participantId && row.participantId !== filters.participantId) return false;
      if (filters.sessionId && row.sessionId !== filters.sessionId) return false;
      if (filters.outcome && !row.outcomes.includes(filters.outcome)) return false;
      if (filters.reason && !row.reasons.includes(filters.reason)) return false;
      if (filters.pairId && row.pairId !== filters.pairId) return false;
      return true;
    });
  }

  function emptyCounts(keys) {
    return keys.reduce((counts, key) => ({ ...counts, [key]: 0 }), {});
  }

  function aggregateAnswers(answers, filters = {}) {
    const rows = filterAnswers(answers, filters);
    const outcomeCounts = emptyCounts(OUTCOMES);
    const q2Counts = emptyCounts(Q2_CHOICES);
    const reasonCounts = emptyCounts(REASONS);
    const participantIds = new Set();
    const routePairs = new Set();
    const positionBias = {
      selectedAsA: 0,
      selectedAsB: 0,
      selectedAsC: 0
    };

    rows.forEach(row => {
      row.outcomes.forEach(outcome => {
        if (Object.hasOwn(outcomeCounts, outcome)) outcomeCounts[outcome] += 1;
      });
      if (row.q2 && Object.hasOwn(q2Counts, row.q2)) q2Counts[row.q2] += 1;
      row.reasons.forEach(reason => {
        if (Object.hasOwn(reasonCounts, reason)) reasonCounts[reason] += 1;
      });
      participantIds.add(row.participantId);
      if (row.pairId && row.pairId !== 'Unknown pair') routePairs.add(row.pairId);
      if (row.selectedSlots.includes('A')) positionBias.selectedAsA += 1;
      if (row.selectedSlots.includes('B')) positionBias.selectedAsB += 1;
      if (row.selectedSlots.includes('C')) positionBias.selectedAsC += 1;
    });

    const datedRows = rows.filter(row => Number.isFinite(Date.parse(row.date)));
    const lastUpdated = datedRows.length
      ? datedRows.reduce((latest, row) => Date.parse(row.date) > Date.parse(latest) ? row.date : latest, datedRows[0].date)
      : null;

    const routeOutcomes = ['calm_quiet', 'calm_nature'];
    const highestRouteCount = Math.max(...routeOutcomes.map(routeType => outcomeCounts[routeType]));
    const leadingRoutes = highestRouteCount > 0
      ? routeOutcomes.filter(routeType => outcomeCounts[routeType] === highestRouteCount)
      : [];
    const leadingRoute = leadingRoutes.length === 1 ? leadingRoutes[0] : null;
    return {
      total: rows.length,
      participants: participantIds.size,
      routePairs: routePairs.size,
      lastUpdated,
      outcomeCounts,
      q2Counts,
      reasonCounts,
      positionBias,
      leadingRoute,
      leadingRoutes,
      rows
    };
  }

  function summarizeParticipants(answers) {
    const participants = new Map();

    filterAnswers(answers).forEach(row => {
      if (!participants.has(row.participantId)) {
        participants.set(row.participantId, {
          participantId: row.participantId,
          participant: row.participant,
          comparisons: 0,
          sessionIds: new Set(),
          routePairs: new Set(),
          lastUpdated: null
        });
      }
      const summary = participants.get(row.participantId);
      summary.comparisons += 1;
      if (row.sessionId) summary.sessionIds.add(row.sessionId);
      if (row.pairId && row.pairId !== 'Unknown pair') summary.routePairs.add(row.pairId);
      if (Number.isFinite(Date.parse(row.date))
        && (!summary.lastUpdated || Date.parse(row.date) > Date.parse(summary.lastUpdated))) {
        summary.lastUpdated = row.date;
      }
    });

    return [...participants.values()]
      .map(summary => ({
        participantId: summary.participantId,
        participant: summary.participant,
        comparisons: summary.comparisons,
        sessions: summary.sessionIds.size,
        routePairs: summary.routePairs.size,
        lastUpdated: summary.lastUpdated
      }))
      .sort((a, b) =>
        a.participant.localeCompare(b.participant, undefined, { sensitivity: 'base' })
        || a.participantId.localeCompare(b.participantId)
      );
  }

  function mergeAnswers(remoteAnswers, localAnswers) {
    const merged = new Map();
    [...(remoteAnswers || []), ...(localAnswers || [])].forEach((answer, index) => {
      const key = answer.captureId
        || answer.roundId
        || `${answer.sessionId || answer.benchmarkRunId || 'unknown'}:${answer.roundNumber ?? index}`;
      merged.set(key, answer);
    });
    return [...merged.values()];
  }

  function createPreferenceSnapshot(answers, options = {}) {
    const batchSize = Math.max(1, Number(options.batchSize) || 5);
    const rows = filterAnswers(answers, options.filters || {});
    const releasedTotal = Math.floor(rows.length / batchSize) * batchSize;
    const releasedAnswers = rows.slice(0, releasedTotal).map(row => row.raw);
    const releasedSummary = aggregateAnswers(releasedAnswers);

    return {
      total: rows.length,
      releasedTotal,
      nextReleaseAt: releasedTotal + batchSize,
      leadingRoute: releasedTotal ? releasedSummary.leadingRoute : null,
      leadingRoutePercent: releasedTotal && releasedSummary.leadingRoute
        ? Math.round((releasedSummary.outcomeCounts[releasedSummary.leadingRoute] / releasedSummary.total) * 100)
        : null
    };
  }

  return {
    OUTCOMES,
    Q2_CHOICES,
    REASONS,
    OUTCOME_LABELS,
    REASON_LABELS,
    q1Selections,
    selectedRouteTypes,
    selectedRouteType,
    normalizeRow,
    filterAnswers,
    aggregateAnswers,
    summarizeParticipants,
    mergeAnswers,
    createPreferenceSnapshot
  };
});
