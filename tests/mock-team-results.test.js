const test = require('node:test');
const assert = require('node:assert/strict');
const MockTeamResults = require('../src/data/mock-team-results');
const Results = require('../src/results/calm-results');

test('provides a deterministic, varied Calm team-results fixture', () => {
  const answers = MockTeamResults.createCalmTeamAnswers();
  const summary = Results.aggregateAnswers(answers);
  const participants = Results.summarizeParticipants(answers);

  assert.equal(answers.length, 32);
  assert.equal(new Set(answers.map(answer => answer.captureId)).size, 32);
  assert.equal(summary.participants, 8);
  assert.equal(summary.routePairs, 4);
  assert.ok(summary.outcomeCounts.calm_quiet > 0);
  assert.ok(summary.outcomeCounts.calm_nature > 0);
  assert.ok(summary.outcomeCounts.none_work_well > 0);
  assert.ok(summary.outcomeCounts.hard_to_judge > 0);
  assert.equal(participants.filter(participant => participant.participant === 'Alex').length, 2);
  assert.ok(participants.some(participant => participant.participantId === MockTeamResults.CURRENT_PARTICIPANT_ID));
  assert.ok(summary.positionBias.selectedAsA > 0);
  assert.ok(summary.positionBias.selectedAsB > 0);
  assert.equal(summary.positionBias.selectedAsC, 0);
});
