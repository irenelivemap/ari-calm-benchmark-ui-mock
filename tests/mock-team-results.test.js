const test = require('node:test');
const assert = require('node:assert/strict');
const MockTeamResults = require('../src/data/mock-team-results');
const Results = require('../src/results/calm-results');
const Data = require('../src/data/calm-benchmark-data');

test('provides a deterministic, varied Calm team-results fixture', () => {
  const answers = MockTeamResults.createCalmTeamAnswers();
  const summary = Results.aggregateAnswers(answers);
  const participants = Results.summarizeParticipants(answers);

  assert.equal(answers.length, 345);
  assert.equal(new Set(answers.map(answer => answer.captureId)).size, 345);
  answers.forEach(answer => {
    const validation = Data.validateAnswerRecord(Data.normalizeAnswerRecord(answer));
    assert.equal(validation.valid, true, validation.errors.join('; '));
  });
  assert.equal(summary.participants, 15);
  assert.equal(summary.routePairs, 23);
  assert.equal(Object.values(summary.outcomeCounts).reduce((total, count) => total + count, 0), answers.length);
  assert.equal(
    summary.choiceReasonDenom,
    agreementEligibleCount(answers)
  );
  assert.ok(summary.outcomeCounts.calm_quiet > 0);
  assert.ok(summary.outcomeCounts.calm_nature > 0);
  assert.ok(summary.outcomeCounts.none_work_well > 0);
  assert.ok(summary.outcomeCounts.hard_to_judge > 0);
  assert.equal(participants.filter(participant => participant.participant === 'Alex').length, 2);
  assert.ok(participants.some(participant => participant.participantId === MockTeamResults.CURRENT_PARTICIPANT_ID));
  assert.ok(summary.positionBias.selectedAsA > 0);
  assert.ok(summary.positionBias.selectedAsB > 0);
  assert.equal(summary.positionBias.selectedAsC, 0);
  assert.ok(answers.some(answer => answer.q1KnowsBetter === true));
  assert.ok(answers.some(answer => answer.q1KnowsBetter && answer.q1BetterRouteNote));
  assert.ok(answers.every(answer => answer.q1KnowsBetter || !answer.q1BetterRouteNote));
  assert.ok(answers.every(answer => !answer.q3Note || ['a_lot', 'somewhat', 'a_little'].includes(answer.q3WorthShowing)));
  assert.ok(answers.some(answer => answer.q2Reasons.includes('more_beautiful_streets_or_surroundings')));
  assert.ok(answers.some(answer => answer.q3Issues.includes('not_enough_beautiful_or_pleasant_surroundings')));

  const agreement = Results.analyzeAgreement(answers);
  assert.equal(agreement.participants.length, 15);
  assert.equal(agreement.pairs.length, 23);
  assert.ok(agreement.clearExactPairs > 0);
  assert.ok(agreement.pairs.some(pair => pair.modalOutcome === 'none_work_well'));
  assert.ok(agreement.pairs.some(pair => pair.modalOutcome === null));
  assert.ok(agreement.naturePreferencePercent > agreement.quietPreferencePercent);
  assert.ok(agreement.natureLeadingPairs > agreement.quietLeadingPairs);
  assert.ok(agreement.quietPreferenceInterval.high < 50);
});

function agreementEligibleCount(answers) {
  return answers.filter(answer => ['route_a', 'route_b', 'both_work_well'].includes(answer.q1Choice)).length;
}
