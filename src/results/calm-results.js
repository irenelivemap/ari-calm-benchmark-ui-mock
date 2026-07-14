(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriCalmResults = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const OUTCOMES = ['calm', 'fast', 'both', 'neither', 'hard_to_judge'];
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
    calm: 'Calm route',
    fast: 'Fast route',
    both: 'Both work well',
    neither: 'Neither works',
    hard_to_judge: 'Hard to judge',
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

  function selectedRouteType(answer) {
    const mapping = answer.labelMap || answer.routeAssignment || {};
    if (answer.q1Choice === 'route_a' || answer.choice === 'route_a') return mapping.A || mapping.routeA || answer.routeAType || 'unknown';
    if (answer.q1Choice === 'route_b' || answer.choice === 'route_b') return mapping.B || mapping.routeB || answer.routeBType || 'unknown';
    if ((answer.q1Choice || answer.choice) === 'either') return 'both';
    if ((answer.q1Choice || answer.choice) === 'neither') return 'neither';
    if ((answer.q1Choice || answer.choice) === 'hard_to_judge') return 'hard_to_judge';
    return 'unknown';
  }

  function calmPosition(answer) {
    const mapping = answer.labelMap || answer.routeAssignment || {};
    const routeA = mapping.A || mapping.routeA || answer.routeAType;
    const routeB = mapping.B || mapping.routeB || answer.routeBType;
    if (routeA === 'calm') return 'A';
    if (routeB === 'calm') return 'B';
    return null;
  }

  function normalizeRow(answer) {
    const reasons = Array.isArray(answer.q3Issues)
      ? answer.q3Issues
      : Array.isArray(answer.reasons) ? answer.reasons : [];
    return {
      id: answer.captureId || answer.roundId || '',
      participant: answer.participantName || answer.rater || 'Anonymous',
      sessionId: answer.sessionId || answer.benchmarkRunId || '',
      pairId: answer.pairId || 'Unknown pair',
      date: answer.clientTs || answer.createdAt || '',
      outcome: selectedRouteType(answer),
      q2: answer.q2Separate || null,
      reasons: [...reasons],
      note: answer.q3Note || answer.note || '',
      calmPosition: calmPosition(answer),
      raw: answer
    };
  }

  function filterAnswers(answers, filters = {}) {
    return (answers || []).map(normalizeRow).filter(row => {
      if (filters.participant && row.participant !== filters.participant) return false;
      if (filters.sessionId && row.sessionId !== filters.sessionId) return false;
      if (filters.outcome && row.outcome !== filters.outcome) return false;
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
      calmShownAsA: 0,
      calmShownAsB: 0,
      calmSelectedAsA: 0,
      calmSelectedAsB: 0
    };

    rows.forEach(row => {
      if (Object.hasOwn(outcomeCounts, row.outcome)) outcomeCounts[row.outcome] += 1;
      if (row.q2 && Object.hasOwn(q2Counts, row.q2)) q2Counts[row.q2] += 1;
      row.reasons.forEach(reason => {
        if (Object.hasOwn(reasonCounts, reason)) reasonCounts[reason] += 1;
      });
      participantIds.add(row.participant || row.sessionId);
      if (row.pairId && row.pairId !== 'Unknown pair') routePairs.add(row.pairId);
      if (row.calmPosition === 'A') positionBias.calmShownAsA += 1;
      if (row.calmPosition === 'B') positionBias.calmShownAsB += 1;
      if (row.outcome === 'calm' && row.calmPosition === 'A') positionBias.calmSelectedAsA += 1;
      if (row.outcome === 'calm' && row.calmPosition === 'B') positionBias.calmSelectedAsB += 1;
    });

    const datedRows = rows.filter(row => Number.isFinite(Date.parse(row.date)));
    const lastUpdated = datedRows.length
      ? datedRows.reduce((latest, row) => Date.parse(row.date) > Date.parse(latest) ? row.date : latest, datedRows[0].date)
      : null;

    return {
      total: rows.length,
      participants: participantIds.size,
      routePairs: routePairs.size,
      lastUpdated,
      outcomeCounts,
      q2Counts,
      reasonCounts,
      positionBias,
      rows
    };
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
      calmPercent: releasedTotal
        ? Math.round((releasedSummary.outcomeCounts.calm / releasedSummary.total) * 100)
        : null
    };
  }

  return {
    OUTCOMES,
    Q2_CHOICES,
    REASONS,
    OUTCOME_LABELS,
    REASON_LABELS,
    selectedRouteType,
    normalizeRow,
    filterAnswers,
    aggregateAnswers,
    createPreferenceSnapshot
  };
});
