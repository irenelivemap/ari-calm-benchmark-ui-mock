const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateRouteComplexity,
  enrichRouteMetadata
} = require('../src/maps/route-complexity.js');

test('ignores small geometry jitter on an otherwise straight route', () => {
  const result = calculateRouteComplexity([
    [8.5000, 47.4000],
    [8.5005, 47.400008],
    [8.5010, 47.4000]
  ]);

  assert.equal(result.estimatedTurnCount, 0);
  assert.equal(result.estimatedDecisionLoad, 0);
});

test('counts a right-angle direction change as one standard turn', () => {
  const result = calculateRouteComplexity([
    [8.5000, 47.4000],
    [8.5010, 47.4000],
    [8.5010, 47.4010]
  ]);

  assert.equal(result.estimatedTurnCount, 1);
  assert.equal(result.estimatedDecisionLoad, 1);
});

test('weights slight and sharp turns differently', () => {
  const slight = calculateRouteComplexity([
    [8.5000, 47.4000],
    [8.5010, 47.4000],
    [8.5020, 47.4005]
  ]);
  const sharp = calculateRouteComplexity([
    [8.5000, 47.4000],
    [8.5010, 47.4000],
    [8.5005, 47.4002]
  ]);

  assert.equal(slight.estimatedDecisionLoad, 0.5);
  assert.equal(sharp.estimatedDecisionLoad, 1.5);
});

test('adds camel-case complexity fields to route metadata', () => {
  const metadata = enrichRouteMetadata(
    { distanceMeters: 500, profile: 'foot_calm' },
    [
      [47.4000, 8.5000],
      [47.4000, 8.5010],
      [47.4010, 8.5010]
    ]
  );

  assert.equal(metadata.profile, 'foot_calm');
  assert.equal(metadata.estimatedTurnCount, 1);
  assert.equal(metadata.estimatedTurnsPerKm, 2);
  assert.equal(metadata.routeComplexityMethod, 'geometry-rdp-8m-min-turn-35deg-v1');
});
