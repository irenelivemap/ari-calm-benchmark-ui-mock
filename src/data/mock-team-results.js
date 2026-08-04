(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriMockTeamResults = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CURRENT_PARTICIPANT_ID = 'sample-irene';

  const PARTICIPANTS = [
    ['sample-irene', 'Irene'],
    ['sample-maya', 'Maya Chen'],
    ['sample-luca', 'Luca Rossi'],
    ['sample-amina', 'Amina Yusuf'],
    ['sample-jonas', 'Jonas Weber'],
    ['sample-sofia', 'Sofia Martín'],
    ['sample-noah', 'Noah Williams'],
    ['sample-leila', 'Leila Haddad'],
    ['sample-emil', 'Emil Jensen'],
    ['sample-priya', 'Priya Shah'],
    ['sample-daniel', 'Daniel Kim'],
    ['sample-ines', 'Inês Costa'],
    ['sample-alex-1', 'Alex'],
    ['sample-alex-2', 'Alex'],
    ['sample-ruth', 'Ruth Okafor']
  ];

  const Q = 'calm_quiet';
  const N = 'calm_nature';
  const B = 'both_work_well';
  const P = 'none_work_well';
  const U = 'hard_to_judge';

  // Fifteen judgments per route pair. Nature wins clearly across the sample so
  // the overview has an easy-to-read story, while Quiet wins several pairs and
  // both-work, rejection, uncertainty, and tied states remain visible.
  const PAIR_OUTCOMES = [
    [N, N, N, N, N, N, N, N, N, N, N, N, B, B, U],
    [Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, N, N, B, B, U],
    [N, N, N, N, N, N, N, N, Q, Q, Q, Q, B, B, P],
    [B, B, B, B, B, B, B, B, N, N, N, N, N, Q, Q],
    [P, P, P, P, P, P, P, P, N, N, N, N, N, Q, U],
    [N, N, N, N, N, N, N, N, N, N, Q, Q, Q, B, B],
    [N, N, N, N, N, N, N, N, Q, Q, Q, Q, B, B, P],
    [Q, Q, Q, Q, Q, Q, Q, Q, N, N, N, N, N, B, B],
    [Q, Q, Q, Q, Q, N, N, N, N, N, B, B, P, U, U],
    [N, N, N, N, N, N, N, N, N, N, Q, Q, Q, B, B],
    [Q, Q, Q, Q, Q, Q, Q, Q, N, N, N, N, B, B, P],
    [P, P, P, P, P, P, P, P, N, N, N, N, N, Q, U],
    [N, N, N, N, N, N, N, N, N, Q, Q, Q, B, B, U],
    [N, N, N, N, N, N, N, N, Q, Q, Q, Q, Q, B, P],
    [Q, Q, Q, Q, Q, Q, Q, Q, Q, N, N, N, B, B, U],
    [N, N, N, N, N, N, N, N, N, N, Q, Q, B, P, U],
    [B, B, B, B, B, B, B, N, N, N, N, Q, Q, P, U],
    [N, N, N, N, N, N, N, N, Q, Q, Q, B, B, P, U],
    [Q, Q, Q, Q, Q, Q, Q, Q, N, N, N, N, B, P, U],
    [N, N, N, N, N, N, N, N, N, Q, Q, Q, Q, B, B],
    [N, N, N, N, N, N, N, Q, Q, Q, Q, Q, B, P, U],
    [P, P, P, P, P, P, N, N, N, N, Q, Q, B, U, U],
    [N, N, N, N, N, N, N, N, N, N, Q, Q, Q, B, U]
  ];

  const POSITIVE_REASONS = {
    calm_quiet: [
      'quieter_or_less_busy_streets',
      'less_need_to_watch_traffic',
      'easier_to_follow',
      'takes_less_time',
      'familiar_route_or_area',
      'quieter_or_less_busy_streets',
      'less_need_to_watch_traffic',
      'not_sure'
    ],
    calm_nature: [
      'more_trees_or_green_space',
      'more_near_water',
      'quieter_or_less_busy_streets',
      'takes_less_time',
      'familiar_route_or_area',
      'more_trees_or_green_space',
      'more_near_water',
      'not_sure'
    ],
    both_work_well: [
      'quieter_or_less_busy_streets',
      'more_trees_or_green_space',
      'easier_to_follow',
      'more_near_water',
      'takes_less_time',
      'familiar_route_or_area',
      'less_need_to_watch_traffic'
    ]
  };

  const REJECTION_REASONS = [
    'streets_too_busy_or_noisy',
    'not_enough_trees_or_green_space',
    'not_enough_route_near_water',
    'too_much_attention_traffic',
    'takes_too_long',
    'hard_to_follow',
    'prefer_another_known_route'
  ];

  const Q2_NOTES = [
    'The route felt much more relaxed — I could look around instead of watching for traffic.',
    'I liked how it went through the park, felt noticeably nicer.',
    'Much more pleasant even if slightly longer.',
    'Felt safer and less stressful overall.',
    'The waterside section made a big difference.',
    'It passed through a quieter neighbourhood which felt more calming.',
  ];

  const Q2_OTHER_NOTES = [
    'Better pavement quality and fewer cyclists sharing the path.',
    'The route had more shade from trees, which matters in summer.',
    'Less construction noise compared to the other option.',
    'I just found the surroundings more aesthetically pleasing overall.',
  ];

  const Q3_NOTES = [
    'Both routes are valid for different moods — calm is worth showing.',
    'The time difference is small enough that the calm benefit outweighs it.',
    "Not convinced the calm benefit is enough to justify showing both options.",
    "Depends on the user's priorities — would be good to let them choose.",
    'The routes are too similar here; showing both might confuse people.',
    'Yes, especially for users doing leisure walks rather than commuting.',
  ];

  function assignmentFor(participantIndex, pairIndex) {
    return (participantIndex + pairIndex) % 2
      ? { A: 'calm_nature', B: 'calm_quiet' }
      : { A: 'calm_quiet', B: 'calm_nature' };
  }

  function choiceRecord(outcome, assignment) {
    if ([B, P, U].includes(outcome)) return { q1Choice: outcome, q1Choices: [outcome] };
    const slot = assignment.A === outcome ? 'a' : 'b';
    return { q1Choice: `route_${slot}`, q1Choices: [`route_${slot}`] };
  }

  function pairOrderFor(participantIndex) {
    const start = (participantIndex * 5) % PAIR_OUTCOMES.length;
    return Array.from({ length: PAIR_OUTCOMES.length }, (_, index) => (start + index * 7) % PAIR_OUTCOMES.length);
  }

  function createCalmTeamAnswers() {
    return PARTICIPANTS.flatMap(([participantId, participantName], participantIndex) => {
      const pairOrder = pairOrderFor(participantIndex);
      return pairOrder.map((pairIndex, orderIndex) => {
        const assignment = assignmentFor(participantIndex, pairIndex);
        const distribution = PAIR_OUTCOMES[pairIndex];
        const outcome = distribution[(participantIndex * 7 + pairIndex * 3) % distribution.length];
        const choice = choiceRecord(outcome, assignment);
        const roundNumber = orderIndex + 1;
        const pairNumber = String(pairIndex + 1).padStart(2, '0');
        const pairId = `calm-route-comparison-${pairNumber}`;
        const sessionId = `${participantId}-session`;
        const createdAt = new Date(Date.UTC(2026, 6, 28, 8 + participantIndex, orderIndex * 7)).toISOString();
        const positivePool = POSITIVE_REASONS[outcome] || [];
        const seed = participantIndex * 13 + pairIndex * 7;
        const primaryReason = positivePool.length
          ? positivePool[(participantIndex + pairIndex) % positivePool.length]
          : null;
        const addsOther = primaryReason && primaryReason !== 'not_sure' && seed % 9 === 0;
        const q2Reasons = positivePool.length
          ? primaryReason === 'not_sure'
            ? ['not_sure']
            : [
              primaryReason,
              ...((participantIndex + pairIndex) % 4 === 0
                ? [positivePool[(participantIndex + pairIndex + 1) % positivePool.length]]
                : []),
              ...(addsOther ? ['other'] : [])
            ].filter((reason, index, reasons) => reason !== 'not_sure' && reasons.indexOf(reason) === index)
          : [];
        const q2Note = addsOther
          ? Q2_OTHER_NOTES[seed % Q2_OTHER_NOTES.length]
          : (positivePool.length > 0 && seed % 5 === 0)
            ? Q2_NOTES[seed % Q2_NOTES.length]
            : '';
        const q3Issues = outcome === P
          ? [
              REJECTION_REASONS[(participantIndex + pairIndex) % REJECTION_REASONS.length],
              ...((participantIndex + pairIndex) % 3 === 0
                ? [REJECTION_REASONS[(participantIndex + pairIndex + 2) % REJECTION_REASONS.length]]
                : [])
            ]
          : [];
        const worthCycle = ['a_lot', 'a_lot', 'somewhat', 'somewhat', 'a_little', 'not_at_all', 'not_sure'];
        const q3Note = [Q, N, B].includes(outcome) && seed % 4 === 0
          ? Q3_NOTES[seed % Q3_NOTES.length]
          : '';

        return {
          v: 1,
          type: 'bench-ux',
          test: 'calm_route_comparison',
          source: 'calm-results-sample',
          captureId: `${sessionId}-${pairId}`,
          benchmarkRunId: sessionId,
          sessionId,
          participantId,
          participantName,
          rater: participantName,
          roundId: `${sessionId}-round-${roundNumber}`,
          roundNumber,
          pairId,
          routeAssignment: { routeA: assignment.A, routeB: assignment.B },
          labelMap: { ...assignment },
          q2Separate: null,
          q2Reasons,
          q2Note,
          q3WorthShowing: [Q, N, B].includes(outcome)
            ? worthCycle[(participantIndex + pairIndex) % worthCycle.length]
            : null,
          q3Issues,
          reasons: [...q3Issues],
          q3Note,
          note: '',
          clientTs: createdAt,
          createdAt,
          ...choice
        };
      });
    });
  }

  return {
    CURRENT_PARTICIPANT_ID,
    createCalmTeamAnswers
  };
});
