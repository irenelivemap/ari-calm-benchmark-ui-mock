const test = require('node:test');
const assert = require('node:assert/strict');

const pairs = require('../src/data/mock-route-pairs.js');

const EXPECTED_ENDPOINTS = [
  [[47.407883, 8.552032], [47.392757, 8.548477]],
  [[47.381545, 8.54278], [47.38392, 8.530839]],
  [[47.386411, 8.54036], [47.372117, 8.546881]],
  [[47.382095, 8.497383], [47.373865, 8.514884]]
];

test('loads the four supplied Calm Quiet, Calm Nature, and Human/Manual rounds', () => {
  assert.equal(pairs.length, 4);

  pairs.forEach((pair, roundIndex) => {
    assert.deepEqual(Object.keys(pair.routes), ['calm_quiet', 'calm_nature', 'human']);
    const endpoints = Object.values(pair.routes).map(route => [
      route.geometry[0],
      route.geometry.at(-1)
    ]);
    endpoints.forEach(routeEndpoints => {
      assert.deepEqual(routeEndpoints, EXPECTED_ENDPOINTS[roundIndex]);
    });
    Object.values(pair.routes).forEach(route => {
      assert.ok(route.geometry.length > 40);
      assert.ok(route.metadata.distanceMeters > 0);
      assert.ok(route.metadata.durationSeconds > 0);
    });
  });
});
