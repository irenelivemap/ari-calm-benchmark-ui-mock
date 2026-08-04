const test = require('node:test');
const assert = require('node:assert/strict');

const pairs = require('../src/data/mock-route-pairs.js');

const EXPECTED_ENDPOINTS = [
  [[47.407883, 8.552032], [47.392757, 8.548477]],
  [[47.381545, 8.54278], [47.38392, 8.530839]],
  [[47.386411, 8.54036], [47.372117, 8.546881]],
  [[47.382095, 8.497383], [47.373865, 8.514884]],
  [[47.398927, 8.508992], [47.393627, 8.490572]],
  [[47.386198, 8.54651], [47.387512, 8.567628]],
  [[47.356045, 8.54926], [47.370526, 8.55278]],
  [[47.366053, 8.525323], [47.372265, 8.526942]],
  [[47.369432, 8.532054], [47.365686, 8.55178]],
  [[47.356896, 8.555168], [47.371072, 8.541478]],
  [[47.37065, 8.541001], [47.37887, 8.534565]],
  [[47.383698, 8.51587], [47.394286, 8.526754]],
  [[47.377726, 8.525659], [47.393697, 8.52189]],
  [[47.379257, 8.500726], [47.387007, 8.518659]],
  [[47.398447, 8.533992], [47.398685, 8.545327]],
  [[47.364571, 8.512296], [47.369055, 8.529064]],
  [[47.370352, 8.518871], [47.377008, 8.530367]],
  [[47.368143, 8.526626], [47.355169, 8.513115]],
  [[47.380414, 8.518616], [47.392087, 8.512476]],
  [[47.367615, 8.531638], [47.376575, 8.539113]],
  [[47.398416, 8.526608], [47.394676, 8.513562]],
  [[47.370659, 8.550906], [47.383256, 8.560262]],
  [[47.39236, 8.551333], [47.394463, 8.529577]]
];

const EXPECTED_POINT_COUNTS = [
  [98, 99, 91],
  [49, 43, 51],
  [75, 83, 62],
  [61, 66, 60],
  [79, 104, 103],
  [144, 115, 149],
  [99, 74, 75],
  [34, 36, 39],
  [82, 80, 71],
  [108, 67, 70],
  [58, 45, 40],
  [68, 59, 59],
  [87, 81, 74],
  [74, 59, 48],
  [59, 57, 57],
  [65, 61, 79],
  [59, 56, 52],
  [77, 61, 57],
  [58, 55, 52],
  [51, 43, 44],
  [89, 96, 89],
  [86, 96, 95],
  [87, 91, 90]
];

const EXPECTED_FAST_DURATIONS = [
  1441, 934, 1277, 1270, 1571, 1650, 1482, 690, 1324, 1458, 920, 1084,
  1574, 1436, 722, 1184, 913, 1397, 1345, 956, 1118, 1468, 1422
];

test('loads the twenty-three supplied Calm Quiet, Calm Nature, and Fast reference routes', () => {
  assert.equal(pairs.length, 23);

  pairs.forEach((pair, roundIndex) => {
    assert.deepEqual(Object.keys(pair.routes), ['calm_quiet', 'calm_nature', 'fast']);
    const endpoints = Object.values(pair.routes).map(route => [
      route.geometry[0],
      route.geometry.at(-1)
    ]);
    endpoints.forEach(routeEndpoints => {
      assert.deepEqual(routeEndpoints, EXPECTED_ENDPOINTS[roundIndex]);
    });
    Object.values(pair.routes).forEach((route, routeIndex) => {
      assert.equal(route.geometry.length, EXPECTED_POINT_COUNTS[roundIndex][routeIndex]);
      assert.ok(route.metadata.distanceMeters > 0);
      assert.ok(route.metadata.durationSeconds > 0);
      if (route.source === 'fast') {
        assert.equal(route.metadata.durationSeconds, EXPECTED_FAST_DURATIONS[roundIndex]);
        assert.equal(route.metadata.profile, 'foot_fast');
      } else {
        assert.equal(route.metadata.fastDurationSeconds, EXPECTED_FAST_DURATIONS[roundIndex]);
      }
    });
  });
});
