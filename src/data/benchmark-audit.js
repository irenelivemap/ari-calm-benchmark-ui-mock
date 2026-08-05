(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriBenchmarkAudit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CALM_TEST = 'calm_route_comparison';
  const EXPECTED_CALM_ROUNDS = 23;

  function unwrapAnswer(value) {
    return value && typeof value === 'object' && value.payload && typeof value.payload === 'object'
      ? value.payload
      : value;
  }

  function asAnswers(input) {
    if (Array.isArray(input)) return input.map(unwrapAnswer);
    if (Array.isArray(input?.answers)) return input.answers.map(unwrapAnswer);
    return [];
  }

  function asProgress(input) {
    if (Array.isArray(input?.progress)) return input.progress.map(unwrapAnswer);
    if (input?.progressBySessionId && typeof input.progressBySessionId === 'object') {
      return Object.values(input.progressBySessionId).map(unwrapAnswer);
    }
    return [];
  }

  function auditBenchmarkData(input) {
    const answers = asAnswers(input);
    const progress = asProgress(input);
    const issues = [];
    const captureIds = new Map();
    const sessions = new Map();

    answers.forEach((answer, index) => {
      const location = `answers[${index}]`;
      if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
        issues.push({ severity: 'error', code: 'invalid_answer', location });
        return;
      }
      const captureId = String(answer.captureId || '');
      const sessionId = String(answer.sessionId || answer.benchmarkRunId || '');
      if (!captureId) issues.push({ severity: 'error', code: 'missing_capture_id', location });
      if (!sessionId) issues.push({ severity: 'error', code: 'missing_session_id', location });
      if (captureId) {
        if (captureIds.has(captureId)) {
          issues.push({ severity: 'error', code: 'duplicate_capture_id', location, value: captureId });
        }
        captureIds.set(captureId, index);
      }
      if (!sessionId) return;
      if (!sessions.has(sessionId)) sessions.set(sessionId, []);
      sessions.get(sessionId).push(answer);

      const currentCalm = answer.test === CALM_TEST
        && answer.source === 'calm-route-comparison'
        && Number(answer.v || 1) >= 2;
      if (!currentCalm) return;
      const round = Number(answer.roundNumber);
      if (!Number.isInteger(round) || round < 1 || round > EXPECTED_CALM_ROUNDS) {
        issues.push({ severity: 'error', code: 'invalid_calm_round', location, value: answer.roundNumber });
      }
      if (!/^calm-route-comparison-\d{2}-round-\d+$/.test(String(answer.pairId || ''))) {
        issues.push({ severity: 'error', code: 'invalid_calm_pair_id', location, value: answer.pairId });
      }
      if (!answer.participantId) issues.push({ severity: 'error', code: 'missing_participant_id', location });
    });

    for (const [sessionId, records] of sessions) {
      const calm = records.filter(answer => answer.test === CALM_TEST);
      if (!calm.length) continue;
      const rounds = calm.map(answer => Number(answer.roundNumber)).filter(Number.isInteger);
      const pairs = calm.map(answer => answer.pairId).filter(Boolean);
      if (calm.length > EXPECTED_CALM_ROUNDS) {
        issues.push({ severity: 'error', code: 'session_over_23', sessionId, value: calm.length });
      }
      if (new Set(rounds).size !== rounds.length) {
        issues.push({ severity: 'error', code: 'duplicate_round_in_session', sessionId });
      }
      if (new Set(pairs).size !== pairs.length) {
        issues.push({ severity: 'error', code: 'duplicate_pair_in_session', sessionId });
      }
      if (calm.length === EXPECTED_CALM_ROUNDS) {
        const expected = Array.from({ length: EXPECTED_CALM_ROUNDS }, (_, index) => index + 1);
        if (expected.some(round => !rounds.includes(round))) {
          issues.push({ severity: 'error', code: 'incomplete_round_sequence', sessionId });
        }
      }
    }

    const answerPositions = new Map(Array.from(sessions, ([sessionId, records]) => {
      const calmRounds = records
        .filter(answer => answer.test === CALM_TEST)
        .map(answer => Number(answer.roundNumber))
        .filter(Number.isInteger);
      return [sessionId, calmRounds.length ? Math.max(...calmRounds) : records.length];
    }));
    progress.forEach((record, index) => {
      const sessionId = String(record?.sessionId || record?.benchmarkRunId || '');
      const completed = Number(record?.completedRounds || 0);
      if (completed > (answerPositions.get(sessionId) || 0)) {
        issues.push({ severity: 'error', code: 'progress_ahead_of_answers', location: `progress[${index}]`, sessionId });
      }
      if (record?.test === CALM_TEST && completed > EXPECTED_CALM_ROUNDS) {
        issues.push({ severity: 'error', code: 'progress_over_23', location: `progress[${index}]`, sessionId });
      }
    });

    const issueCounts = Object.fromEntries(
      Array.from(new Set(issues.map(issue => issue.code))).sort().map(code => [
        code,
        issues.filter(issue => issue.code === code).length
      ])
    );
    return {
      ok: issues.every(issue => issue.severity !== 'error'),
      summary: {
        answers: answers.length,
        progress: progress.length,
        sessions: sessions.size,
        errors: issues.filter(issue => issue.severity === 'error').length
      },
      issueCounts,
      issues
    };
  }

  return { EXPECTED_CALM_ROUNDS, auditBenchmarkData };
});
