const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildFanoutRuns,
  nearestPointOnRoutes,
  resolveStreetViewPoint,
  offsetGeometry
} = require('../src/maps/route-overlap.js');
const calmRounds = require('../src/data/mock-route-pairs.js');

test('fans three routes into stable lanes only on shared segments', () => {
  const result = buildFanoutRuns({
    routeA: [[0, 0], [0, 1], [0, 2], [1, 2]],
    routeB: [[0, 0], [0, 1], [0, 2], [0, 3]],
    routeC: [[0, 0], [0, 1], [0, 2], [-1, 2]]
  });

  assert.equal(result.sharedSegmentCount, 2);
  assert.deepEqual(result.routes.routeA.map(run => run.offset), [-5, 0]);
  assert.deepEqual(result.routes.routeB.map(run => run.offset), [0, 0]);
  assert.deepEqual(result.routes.routeB.map(run => run.sharedCount), [3, 1]);
  assert.deepEqual(result.routes.routeC.map(run => run.offset), [5, 0]);
  assert.equal(result.routes.routeA[0].sharedCount, 3);
  assert.equal(result.routes.routeA[1].sharedCount, 1);
});

test('keeps opposite-direction routes on opposite physical sides', () => {
  const result = buildFanoutRuns({
    routeA: [[0, 0], [0, 1]],
    routeB: [[0, 1], [0, 0]]
  });

  assert.equal(result.routes.routeA[0].offset, -2.5);
  assert.equal(result.routes.routeB[0].offset, -2.5);
});

test('leaves unique route geometry on its true centerline', () => {
  const result = buildFanoutRuns({
    routeA: [[0, 0], [0, 1]],
    routeB: [[1, 0], [1, 1]],
    routeC: [[2, 0], [2, 1]]
  });

  assert.equal(result.sharedSegmentCount, 0);
  Object.values(result.routes).forEach(runs => {
    assert.deepEqual(runs.map(run => run.offset), [0]);
  });
});

test('fans every supplied Calm round without losing route segments', () => {
  calmRounds.forEach(round => {
    const suppliedRoutes = Object.values(round.routes);
    const routeGeometries = {
      routeA: suppliedRoutes[0].geometry,
      routeB: suppliedRoutes[1].geometry,
      routeC: suppliedRoutes[2].geometry
    };
    const result = buildFanoutRuns(routeGeometries);

    assert.ok(result.sharedSegmentCount > 0, `${round.pairId} should contain shared segments`);
    Object.entries(routeGeometries).forEach(([routeKey, geometry]) => {
      const renderedSegmentCount = result.routes[routeKey]
        .reduce((sum, run) => sum + run.geometry.length - 1, 0);
      assert.equal(renderedSegmentCount, geometry.length - 1);
    });
  });
});

test('snaps a map point to the nearest route segment', () => {
  const nearest = nearestPointOnRoutes({
    routeA: [[47.37, 8.53], [47.37, 8.54]],
    routeB: [[47.38, 8.53], [47.38, 8.54]]
  }, { lat: 47.3701, lng: 8.535 });

  assert.equal(nearest.routeKey, 'routeA');
  assert.ok(Math.abs(nearest.lat - 47.37) < 1e-8);
  assert.ok(Math.abs(nearest.lng - 8.535) < 1e-8);
  assert.ok(nearest.distanceMeters > 10 && nearest.distanceMeters < 12);
});

test('honors a provider route hint on overlapping hit areas', () => {
  const geometry = [[47.37, 8.53], [47.37, 8.54]];
  const nearest = nearestPointOnRoutes({
    routeA: geometry,
    routeB: geometry
  }, { lat: 47.3701, lng: 8.535 }, { routeKey: 'routeB' });

  assert.equal(nearest.routeKey, 'routeB');
});

test('keeps unrestricted Street View selections at the chosen map point', () => {
  const selected = resolveStreetViewPoint({
    routeA: [[47.37, 8.53], [47.37, 8.54]]
  }, { lat: 47.38, lng: 8.55 });

  assert.deepEqual(selected, {
    lat: 47.38,
    lng: 8.55,
    routeKey: null,
    distanceMeters: null,
    snapped: false
  });
});

test('snaps a route-hit Street View selection to the visible route', () => {
  const selected = resolveStreetViewPoint({
    routeA: [[47.37, 8.53], [47.37, 8.54]]
  }, { lat: 47.3701, lng: 8.535 }, { routeKey: 'routeA' });

  assert.equal(selected.routeKey, 'routeA');
  assert.equal(selected.snapped, true);
  assert.ok(Math.abs(selected.lat - 47.37) < 1e-8);
  assert.ok(selected.distanceMeters > 10 && selected.distanceMeters < 12);
});

test('offsets shared-route geometry without changing its point count', () => {
  const geometry = [[47.37, 8.53], [47.37, 8.54], [47.371, 8.541]];
  const offset = offsetGeometry(geometry, 1.25);

  assert.equal(offset.length, geometry.length);
  assert.notDeepEqual(offset, geometry);
  assert.ok(Math.abs(offset[0][0] - geometry[0][0]) < 0.00002);
  assert.ok(Math.abs(offset[0][1] - geometry[0][1]) < 0.00002);
});
