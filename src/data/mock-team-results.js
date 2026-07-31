(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriMockTeamResults = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CURRENT_PARTICIPANT_ID = 'sample-irene';

  const ASSIGNMENTS = [
    { A: 'calm_quiet', B: 'calm_nature' },
    { A: 'calm_nature', B: 'calm_quiet' },
    { A: 'calm_quiet', B: 'calm_nature' },
    { A: 'calm_nature', B: 'calm_quiet' }
  ];

  const PARTICIPANTS = [
    {
      id: CURRENT_PARTICIPANT_ID,
      name: 'Irene',
      choices: [
        ['calm_quiet'],
        ['calm_nature'],
        ['calm_quiet', 'calm_nature'],
        ['hard_to_judge']
      ],
      reasons: [
        ['too_busy_or_crowded'],
        ['not_enough_greenery_water'],
        ['too_similar'],
        []
      ],
      notes: ['', '', 'The first two options felt almost identical near the park.', '']
    },
    {
      id: 'sample-maya',
      name: 'Maya Chen',
      choices: [['calm_nature'], ['calm_quiet'], ['calm_nature'], ['none_work_well']],
      reasons: [
        ['not_enough_greenery_water'],
        ['too_complex'],
        ['too_busy_or_crowded'],
        ['extra_time_distance_not_worth_it']
      ],
      notes: ['', 'Several turns were difficult to anticipate.', '', '']
    },
    {
      id: 'sample-luca',
      name: 'Luca Rossi',
      choices: [['calm_quiet'], ['calm_nature'], ['calm_quiet'], ['calm_quiet']],
      reasons: [
        ['extra_time_distance_not_worth_it'],
        ['too_complex'],
        ['too_busy_or_crowded'],
        ['lacks_nice_streets_surroundings']
      ],
      notes: ['', '', 'The junction by the main road felt stressful.', '']
    },
    {
      id: 'sample-amina',
      name: 'Amina Yusuf',
      choices: [
        ['calm_quiet', 'calm_nature'],
        ['calm_quiet'],
        ['calm_nature'],
        ['hard_to_judge']
      ],
      reasons: [
        ['too_similar'],
        ['too_busy_or_crowded'],
        ['not_enough_greenery_water'],
        []
      ],
      notes: ['', '', '', 'Street View was not available for part of the route.']
    },
    {
      id: 'sample-jonas',
      name: 'Jonas Weber',
      choices: [['calm_nature'], ['none_work_well'], ['calm_quiet'], ['calm_quiet']],
      reasons: [
        ['too_complex'],
        ['too_busy_or_crowded', 'extra_time_distance_not_worth_it'],
        ['lacks_nice_streets_surroundings'],
        ['not_enough_greenery_water']
      ],
      notes: ['', 'Neither option felt suitable for a calm walk.', '', '']
    },
    {
      id: 'sample-sofia',
      name: 'Sofia Martín',
      choices: [
        ['calm_nature'],
        ['calm_quiet'],
        ['calm_nature'],
        ['both_work_well']
      ],
      reasons: [
        ['not_enough_greenery_water'],
        ['too_busy_or_crowded'],
        ['lacks_nice_streets_surroundings'],
        []
      ],
      notes: ['', '', 'I preferred the route alongside the water.', '']
    },
    {
      id: 'sample-alex-1',
      name: 'Alex',
      choices: [['calm_quiet'], ['calm_quiet'], ['calm_nature'], ['calm_nature']],
      reasons: [
        ['too_busy_or_crowded'],
        ['too_complex'],
        ['not_enough_greenery_water'],
        ['lacks_nice_streets_surroundings']
      ],
      notes: ['', '', '', '']
    },
    {
      id: 'sample-alex-2',
      name: 'Alex',
      choices: [['hard_to_judge'], ['calm_quiet'], ['calm_nature'], ['none_work_well']],
      reasons: [
        [],
        ['extra_time_distance_not_worth_it'],
        ['other'],
        ['too_busy_or_crowded']
      ],
      notes: ['', '', 'Construction made the calmer section difficult to assess.', '']
    }
  ];

  function choiceRecord(outcomes, assignment) {
    if (outcomes.length === 1 && ['hard_to_judge', 'none_work_well', 'both_work_well'].includes(outcomes[0])) {
      return { q1Choice: outcomes[0], q1Choices: [outcomes[0]] };
    }
    const slots = outcomes.map(outcome => {
      const slot = Object.entries(assignment).find(([, routeType]) => routeType === outcome)?.[0];
      return slot ? `route_${slot.toLowerCase()}` : null;
    }).filter(Boolean);
    return {
      q1Choice: slots.length > 1 ? 'multiple_routes' : slots[0],
      q1Choices: slots
    };
  }

  function createCalmTeamAnswers() {
    return PARTICIPANTS.flatMap((participant, participantIndex) =>
      participant.choices.map((outcomes, roundIndex) => {
        const assignment = ASSIGNMENTS[roundIndex % ASSIGNMENTS.length];
        const roundNumber = roundIndex + 1;
        const sessionId = `${participant.id}-session`;
        const createdAt = new Date(Date.UTC(2026, 6, 28, 8 + participantIndex, roundIndex * 7)).toISOString();
        return {
          v: 1,
          type: 'bench-ux',
          test: 'calm_route_comparison',
          source: 'calm-results-sample',
          captureId: `${sessionId}-round-${roundNumber}`,
          benchmarkRunId: sessionId,
          sessionId,
          participantId: participant.id,
          participantName: participant.name,
          rater: participant.name,
          roundId: `${sessionId}-round-${roundNumber}`,
          roundNumber,
          pairId: `calm-route-comparison-0${roundNumber}-round-${roundNumber}`,
          routeAssignment: {
            routeA: assignment.A,
            routeB: assignment.B
          },
          labelMap: { ...assignment },
          q2Separate: null,
          q3Issues: [...participant.reasons[roundIndex]],
          reasons: [...participant.reasons[roundIndex]],
          q3Note: participant.notes[roundIndex],
          note: participant.notes[roundIndex],
          clientTs: createdAt,
          createdAt,
          ...choiceRecord(outcomes, assignment)
        };
      })
    );
  }

  return {
    CURRENT_PARTICIPANT_ID,
    createCalmTeamAnswers
  };
});
