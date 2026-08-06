(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriCalmResults = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const OUTCOMES = [
    'calm_quiet',
    'calm_nature',
    'both_work_well',
    'none_work_well',
    'hard_to_judge'
  ];
  const EXACT_OUTCOMES = [
    'calm_quiet',
    'calm_nature',
    'both_work_well',
    'none_work_well',
    'hard_to_judge'
  ];
  const SUBSTANTIVE_OUTCOMES = [
    'calm_nature',
    'calm_quiet',
    'both_work_well',
    'none_work_well'
  ];
  const Q2_CHOICES = ['yes', 'no', 'not_sure'];
  const Q3_WORTH_CHOICES = ['a_lot', 'somewhat', 'a_little', 'not_at_all', 'not_sure'];
  const Q3_FAST_ALTERNATIVE_QUESTION = 'When would you choose Fast instead of a Calm route? (Optional)';
  const REASONS = [
    'not_enough_greenery_water',
    'too_busy_or_crowded',
    'lacks_nice_streets_surroundings',
    'extra_time_distance_not_worth_it',
    'too_similar',
    'too_complex',
    'streets_too_busy_or_noisy',
    'not_enough_trees_or_green_space',
    'not_enough_route_near_water',
    'not_enough_beautiful_or_pleasant_surroundings',
    'too_much_attention_traffic',
    'takes_too_long',
    'hard_to_follow',
    'prefer_another_known_route',
    'not_sure',
    'other'
  ];

  const OUTCOME_LABELS = {
    calm_quiet: 'Calm Quiet',
    calm_nature: 'Calm Nature',
    both_work_well: 'Both work well',
    none_work_well: 'Both work poorly',
    hard_to_judge: "I'm not sure",
    multiple_routes: 'Multiple routes',
    unknown: 'Unknown'
  };

  const CHOICE_REASONS = [
    'quieter_or_less_busy_streets',
    'more_trees_or_green_space',
    'more_near_water',
    'more_beautiful_streets_or_surroundings',
    'less_need_to_watch_traffic',
    'takes_less_time',
    'easier_to_follow',
    'familiar_route_or_area',
    'other',
    'not_sure'
  ];

  const CHOICE_REASON_LABELS = {
    quieter_or_less_busy_streets: 'Quieter or less busy streets',
    more_trees_or_green_space: 'More trees or green space',
    more_near_water: 'More of the route is near water',
    more_beautiful_streets_or_surroundings: 'More beautiful streets or surroundings',
    less_need_to_watch_traffic: 'Less need to watch for traffic',
    takes_less_time: 'Takes less time',
    easier_to_follow: 'Easier to follow',
    familiar_route_or_area: 'I know this route or area better',
    other: 'Other',
    not_sure: "I'm not sure"
  };

  const REASON_LABELS = {
    not_enough_greenery_water: 'Not enough greenery or water',
    too_busy_or_crowded: 'Too busy or crowded',
    lacks_nice_streets_surroundings: 'Lacks nice streets or surroundings',
    extra_time_distance_not_worth_it: 'Extra time or distance not worth it',
    too_similar: 'Too similar to the other route',
    too_complex: 'Too complex to follow',
    streets_too_busy_or_noisy: 'Streets are too busy or noisy',
    not_enough_trees_or_green_space: 'Not enough trees or green space',
    not_enough_route_near_water: 'Not enough of the route is near water',
    not_enough_beautiful_or_pleasant_surroundings: 'Not enough beautiful or pleasant surroundings',
    too_much_attention_traffic: 'Too much attention needed around traffic',
    takes_too_long: 'Takes too long',
    hard_to_follow: 'Hard to follow',
    prefer_another_known_route: 'I know another route I would prefer',
    not_sure: "I'm not sure",
    other: 'Other'
  };

  const PARTICIPANT_QUESTION_COPY = Object.freeze({
    q1: 'Which route would you choose for a calmer walk?',
    q1Flag: 'I know a better Calm route',
    route_a: Object.freeze({
      q2: 'What made you choose Route A?',
      q3: 'Compared with only seeing Fast, how much does adding Route A improve things for you?'
    }),
    route_b: Object.freeze({
      q2: 'What made you choose Route B?',
      q3: 'Compared with only seeing Fast, how much does adding Route B improve things for you?'
    }),
    both_work_well: Object.freeze({
      q2: 'What made both routes work well?',
      q3: 'Compared with only seeing Fast, how much does also having any of these calmer routes improve things for you?'
    }),
    none_work_well: Object.freeze({
      q2: null,
      q3: 'What made you choose neither route?'
    }),
    hard_to_judge: Object.freeze({ q2: null, q3: null })
  });

  function participantQuestionCopy(answer) {
    const choice = answer?.q1Choice || answer?.choice || null;
    const conditional = PARTICIPANT_QUESTION_COPY[choice] || { q2: null, q3: null };
    return {
      q1: PARTICIPANT_QUESTION_COPY.q1,
      q1Flag: PARTICIPANT_QUESTION_COPY.q1Flag,
      q2: conditional.q2,
      q3: conditional.q3,
      q3Note: ['route_a', 'route_b', 'both_work_well'].includes(choice)
        ? Q3_FAST_ALTERNATIVE_QUESTION
        : null
    };
  }

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

  function exactOutcome(answer) {
    const choice = answer.q1Choice || answer.choice || answer.q1Choices?.[0];
    if (choice === 'both_work_well' || choice === 'all_three_work_well') return 'both_work_well';
    if (choice === 'none_work_well' || choice === 'both_work_poorly' || choice === 'neither') {
      return 'none_work_well';
    }
    if (choice === 'hard_to_judge' || choice === 'not_sure') return 'hard_to_judge';
    if (choice === 'multiple_routes') {
      const choices = Array.isArray(answer.q1Choices) ? answer.q1Choices : [];
      if (choices.includes('route_a') && choices.includes('route_b')) return 'both_work_well';
    }
    const routeType = selectedRouteType(answer);
    return EXACT_OUTCOMES.includes(routeType) ? routeType : 'hard_to_judge';
  }

  function canonicalPairId(pairId) {
    const value = String(pairId || 'Unknown pair');
    const calmPair = value.match(/^(calm-route-comparison-\d+)/);
    return calmPair ? calmPair[1] : value;
  }

  function participantIdentity(answer = {}) {
    const explicitId = String(answer.participantId || '').trim();
    if (explicitId) return explicitId;
    const displayName = String(answer.participantName || answer.rater || '').trim();
    if (displayName) {
      return `name:${displayName.replace(/\s+/g, ' ').toLocaleLowerCase('en')}`;
    }
    return String(
      answer.sessionId
      || answer.benchmarkRunId
      || answer.captureId
      || 'anonymous'
    );
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
      participantId: participantIdentity(answer),
      sessionId: answer.sessionId || answer.benchmarkRunId || '',
      corpusVersion: answer.corpusVersion || null,
      corpusFingerprint: answer.corpusFingerprint || null,
      pairId: answer.pairId || 'Unknown pair',
      analysisPairId: canonicalPairId(answer.pairId),
      roundNumber: Number.isFinite(Number(answer.roundNumber)) ? Number(answer.roundNumber) : null,
      date: answer.receivedAt || answer.clientTs || answer.createdAt || '',
      outcome: outcomes.length === 1 ? outcomes[0] : 'multiple_routes',
      outcomes,
      exactOutcome: exactOutcome(answer),
      q2: answer.q2Separate || null,
      q1KnowsBetter: answer.q1KnowsBetter === true,
      q1BetterRouteNote: answer.q1BetterRouteNote || '',
      q2Reasons: Array.isArray(answer.q2Reasons) ? [...answer.q2Reasons] : [],
      q2Note: answer.q2Note || answer.q2Other || '',
      q2Other: answer.q2Other || '',
      q3WorthShowing: answer.q3WorthShowing || null,
      reasons: [...reasons],
      note: answer.q3Note || answer.note || '',
      q3NoteKind: answer.q3NoteKind || null,
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

  function roundedPercent(count, total) {
    return total ? Math.round((count / total) * 100) : 0;
  }

  function wilsonInterval(count, total, z = 1.96) {
    if (!total) return { low: 0, high: 0 };
    const proportion = count / total;
    const denominator = 1 + ((z * z) / total);
    const centre = proportion + ((z * z) / (2 * total));
    const margin = z * Math.sqrt(
      ((proportion * (1 - proportion)) / total) + ((z * z) / (4 * total * total))
    );
    return {
      low: Math.max(0, Math.round(((centre - margin) / denominator) * 100)),
      high: Math.min(100, Math.round(((centre + margin) / denominator) * 100))
    };
  }

  function median(values) {
    if (!values.length) return 0;
    const ordered = [...values].sort((a, b) => a - b);
    const midpoint = Math.floor(ordered.length / 2);
    return ordered.length % 2
      ? ordered[midpoint]
      : Math.round((ordered[midpoint - 1] + ordered[midpoint]) / 2);
  }

  function clusteredBootstrapInterval(groups, numeratorFor, denominatorFor, iterations = 2400) {
    if (!groups.length) return { low: 0, high: 0 };
    if (groups.length < 2) return { low: 0, high: 100 };
    let state = 0x6d2b79f5;
    const random = () => {
      state = (Math.imul(state ^ (state >>> 15), 1 | state) + 0x6d2b79f5) | 0;
      state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
      return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
    };
    const estimates = [];
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      let numerator = 0;
      let denominator = 0;
      for (let draw = 0; draw < groups.length; draw += 1) {
        const group = groups[Math.floor(random() * groups.length)];
        numerator += numeratorFor(group);
        denominator += denominatorFor(group);
      }
      estimates.push(denominator ? (numerator / denominator) * 100 : 0);
    }
    estimates.sort((a, b) => a - b);
    return {
      low: Math.round(estimates[Math.floor(iterations * 0.025)]),
      high: Math.round(estimates[Math.floor(iterations * 0.975)])
    };
  }

  function analyzeAgreement(answers, options = {}) {
    const threshold = Number.isFinite(Number(options.clearAgreementThreshold))
      ? Number(options.clearAgreementThreshold)
      : 0.7;
    const rows = filterAnswers(answers, options.filters || {});
    const exactCounts = emptyCounts(EXACT_OUTCOMES);
    const pairs = new Map();
    const participants = new Map();

    rows.forEach(row => {
      const outcome = EXACT_OUTCOMES.includes(row.exactOutcome) ? row.exactOutcome : 'hard_to_judge';
      exactCounts[outcome] += 1;

      if (!pairs.has(row.analysisPairId)) {
        pairs.set(row.analysisPairId, {
          pairId: row.analysisPairId,
          total: 0,
          counts: emptyCounts(EXACT_OUTCOMES)
        });
      }
      const pair = pairs.get(row.analysisPairId);
      pair.total += 1;
      pair.counts[outcome] += 1;

      if (!participants.has(row.participantId)) {
        participants.set(row.participantId, {
          participantId: row.participantId,
          participant: row.participant,
          total: 0,
          anyWorks: 0,
          quiet: 0,
          nature: 0,
          cells: new Map()
        });
      }
      const participant = participants.get(row.participantId);
      participant.total += 1;
      if (['calm_quiet', 'calm_nature', 'both_work_well'].includes(outcome)) participant.anyWorks += 1;
      if (outcome === 'calm_quiet') participant.quiet += 1;
      if (outcome === 'calm_nature') participant.nature += 1;
      participant.cells.set(row.analysisPairId, outcome);
    });

    const pairSummaries = [...pairs.values()].map(pair => {
      const anyWorks = pair.counts.calm_quiet + pair.counts.calm_nature + pair.counts.both_work_well;
      const singleRouteChoices = pair.counts.calm_quiet + pair.counts.calm_nature;
      const leadingRouteCount = Math.max(pair.counts.calm_quiet, pair.counts.calm_nature);
      const preferredCalmType = pair.counts.calm_quiet === pair.counts.calm_nature
        ? null
        : pair.counts.calm_quiet > pair.counts.calm_nature
          ? 'calm_quiet'
          : 'calm_nature';
      const couldNotJudgeCount = pair.counts.hard_to_judge;
      const substantiveTotal = pair.total - couldNotJudgeCount;
      const highestExactCount = Math.max(...SUBSTANTIVE_OUTCOMES.map(key => pair.counts[key]));
      const modalOutcomes = highestExactCount
        ? SUBSTANTIVE_OUTCOMES.filter(key => pair.counts[key] === highestExactCount)
        : [];
      const viabilityCounts = {
        any_works: anyWorks,
        none_work_well: pair.counts.none_work_well,
        hard_to_judge: pair.counts.hard_to_judge
      };
      const highestViabilityCount = Math.max(...Object.values(viabilityCounts));
      const viabilityOutcome = Object.keys(viabilityCounts)
        .find(key => viabilityCounts[key] === highestViabilityCount) || 'hard_to_judge';
      return {
        pairId: pair.pairId,
        total: pair.total,
        counts: pair.counts,
        substantiveTotal,
        couldNotJudgeCount,
        couldNotJudgePercent: roundedPercent(couldNotJudgeCount, pair.total),
        anyWorks,
        anyWorksPercent: roundedPercent(anyWorks, pair.total),
        anyWorksInterval: wilsonInterval(anyWorks, pair.total),
        singleRouteChoices,
        preferredCalmType,
        preferenceAgreementPercent: roundedPercent(leadingRouteCount, singleRouteChoices),
        viabilityOutcome,
        viabilityAgreementPercent: roundedPercent(highestViabilityCount, pair.total),
        modalOutcome: modalOutcomes.length === 1 ? modalOutcomes[0] : null,
        modalOutcomes,
        leadingOutcomeCount: highestExactCount,
        exactAgreementPercent: roundedPercent(highestExactCount, substantiveTotal),
        clearExactAgreement: substantiveTotal > 0
          && modalOutcomes.length === 1
          && (highestExactCount / substantiveTotal) >= threshold,
        clearViabilityAgreement: pair.total > 0 && (highestViabilityCount / pair.total) >= threshold
      };
    }).sort((a, b) => a.pairId.localeCompare(b.pairId, undefined, { numeric: true }));

    const total = rows.length;
    const anyWorks = exactCounts.calm_quiet + exactCounts.calm_nature + exactCounts.both_work_well;
    const singleRouteChoices = exactCounts.calm_quiet + exactCounts.calm_nature;
    const preferencePairs = pairSummaries.filter(pair => pair.singleRouteChoices > 0);
    const participantGroups = [...participants.values()];
    const participantSummaries = participantGroups.map(participant => ({
      participantId: participant.participantId,
      participant: participant.participant,
      total: participant.total,
      anyWorks: participant.anyWorks,
      anyWorksPercent: roundedPercent(participant.anyWorks, participant.total),
      quiet: participant.quiet,
      nature: participant.nature,
      decisivenessPercent: roundedPercent(participant.quiet + participant.nature, participant.total),
      quietPreferencePercent: roundedPercent(participant.quiet, participant.quiet + participant.nature),
      cells: Object.fromEntries(participant.cells)
    })).sort((a, b) =>
      a.participant.localeCompare(b.participant, undefined, { sensitivity: 'base' })
      || a.participantId.localeCompare(b.participantId)
    );

    return {
      total,
      exactCounts,
      anyWorks,
      anyWorksPercent: roundedPercent(anyWorks, total),
      anyWorksInterval: clusteredBootstrapInterval(
        participantGroups,
        participant => participant.anyWorks,
        participant => participant.total
      ),
      singleRouteChoices,
      decisivenessPercent: roundedPercent(singleRouteChoices, total),
      quietPreferencePercent: roundedPercent(exactCounts.calm_quiet, singleRouteChoices),
      quietPreferenceInterval: clusteredBootstrapInterval(
        participantGroups,
        participant => participant.quiet,
        participant => participant.quiet + participant.nature
      ),
      naturePreferencePercent: roundedPercent(exactCounts.calm_nature, singleRouteChoices),
      quietLeadingPairs: preferencePairs.filter(pair => pair.preferredCalmType === 'calm_quiet').length,
      natureLeadingPairs: preferencePairs.filter(pair => pair.preferredCalmType === 'calm_nature').length,
      tiedPreferencePairs: preferencePairs.filter(pair => pair.preferredCalmType === null).length,
      medianPreferenceAgreementPercent: median(preferencePairs.map(pair => pair.preferenceAgreementPercent)),
      quietSupportPercent: roundedPercent(exactCounts.calm_quiet + exactCounts.both_work_well, total),
      natureSupportPercent: roundedPercent(exactCounts.calm_nature + exactCounts.both_work_well, total),
      couldNotJudgeCount: exactCounts.hard_to_judge,
      couldNotJudgePercent: roundedPercent(exactCounts.hard_to_judge, total),
      clearExactPairs: pairSummaries.filter(pair => pair.clearExactAgreement).length,
      mixedExactPairs: pairSummaries.filter(pair => !pair.clearExactAgreement).length,
      clearNeitherPairs: pairSummaries.filter(pair =>
        pair.clearExactAgreement && pair.modalOutcome === 'none_work_well'
      ).length,
      clearViabilityPairs: pairSummaries.filter(pair => pair.clearViabilityAgreement && pair.viabilityOutcome === 'any_works').length,
      medianExactAgreementPercent: median(pairSummaries.map(pair => pair.exactAgreementPercent)),
      pairs: pairSummaries,
      participants: participantSummaries,
      clearAgreementThreshold: threshold
    };
  }

  function aggregateAnswers(answers, filters = {}) {
    const rows = filterAnswers(answers, filters);
    const outcomeCounts = emptyCounts(OUTCOMES);
    const q2Counts = emptyCounts(Q2_CHOICES);
    const q3WorthShowingCounts = emptyCounts(Q3_WORTH_CHOICES);
    const reasonCounts = emptyCounts(REASONS);
    const choiceReasonCounts = emptyCounts(CHOICE_REASONS);
    let choiceReasonDenom = 0;
    let knowsBetterRouteCount = 0;
    const participantIds = new Set();
    const routePairs = new Set();
    const positionBias = {
      selectedAsA: 0,
      selectedAsB: 0,
      selectedAsC: 0
    };

    rows.forEach(row => {
      if (Object.hasOwn(outcomeCounts, row.exactOutcome)) outcomeCounts[row.exactOutcome] += 1;
      if (row.q2 && Object.hasOwn(q2Counts, row.q2)) q2Counts[row.q2] += 1;
      if (row.q1KnowsBetter) knowsBetterRouteCount += 1;
      if (row.q3WorthShowing && Object.hasOwn(q3WorthShowingCounts, row.q3WorthShowing)) {
        q3WorthShowingCounts[row.q3WorthShowing] += 1;
      }
      row.reasons.forEach(reason => {
        if (Object.hasOwn(reasonCounts, reason)) reasonCounts[reason] += 1;
      });
      if (['calm_nature', 'calm_quiet', 'both_work_well'].includes(row.exactOutcome)) {
        choiceReasonDenom += 1;
        row.q2Reasons.forEach(reason => {
          if (Object.hasOwn(choiceReasonCounts, reason)) choiceReasonCounts[reason] += 1;
        });
      }
      participantIds.add(row.participantId);
      if (row.analysisPairId && row.analysisPairId !== 'Unknown pair') routePairs.add(row.analysisPairId);
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
      q3WorthShowingCounts,
      reasonCounts,
      choiceReasonCounts,
      choiceReasonDenom,
      knowsBetterRouteCount,
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
      if (row.analysisPairId && row.analysisPairId !== 'Unknown pair') summary.routePairs.add(row.analysisPairId);
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
    EXACT_OUTCOMES,
    SUBSTANTIVE_OUTCOMES,
    Q2_CHOICES,
    Q3_WORTH_CHOICES,
    Q3_FAST_ALTERNATIVE_QUESTION,
    REASONS,
    CHOICE_REASONS,
    CHOICE_REASON_LABELS,
    OUTCOME_LABELS,
    REASON_LABELS,
    participantQuestionCopy,
    q1Selections,
    selectedRouteTypes,
    selectedRouteType,
    exactOutcome,
    canonicalPairId,
    participantIdentity,
    normalizeRow,
    filterAnswers,
    aggregateAnswers,
    analyzeAgreement,
    wilsonInterval,
    summarizeParticipants,
    mergeAnswers,
    createPreferenceSnapshot
  };
});
