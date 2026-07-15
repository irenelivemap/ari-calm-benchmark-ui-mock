const test = require('node:test');
const assert = require('node:assert/strict');

const Generator = require('../src/api/route-pair-generator.js');

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function sequenceRng(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

function facadeRoute(profile, coordinates, overrides = {}) {
  return {
    profile,
    distanceMeters: 1200,
    timeMillis: 900000,
    geometry: { type: 'LineString', coordinates },
    ...overrides
  };
}

function okFacadeResponse() {
  return {
    ok: true,
    json: async () => ({
      status: 'ok',
      routes: [
        facadeRoute('foot_fast', [[8.54, 47.377], [8.542, 47.375], [8.544, 47.373]]),
        facadeRoute('foot_calm', [[8.54, 47.377], [8.538, 47.375], [8.544, 47.373]])
      ]
    })
  };
}

test('computes the sampling bbox from the polygon', () => {
  const bbox = Generator.bboxOfPolygon(Generator.ZURICH_POLYGON);
  assert.deepEqual(bbox, Generator.ZURICH_BBOX);
  assert.ok(bbox.minLng < bbox.maxLng);
  assert.ok(bbox.minLat < bbox.maxLat);
});

test('keeps random candidates inside the polygon and distance window', () => {
  const inside = [8.5402, 47.3782];
  const outsideLake = [8.552, 47.355];
  assert.equal(Generator.pointInPolygon(inside, Generator.ZURICH_POLYGON), true);
  assert.equal(Generator.pointInPolygon(outsideLake, Generator.ZURICH_POLYGON), false);

  const bbox = { minLng: 8.53, maxLng: 8.55, minLat: 47.37, maxLat: 47.39 };
  const tooClose = Generator.pickRandomOdCandidate(bbox, sequenceRng([0.5, 0.5, 0.5, 0.5]), { polygon: null });
  assert.equal(tooClose, null);

  const good = Generator.pickRandomOdCandidate(bbox, sequenceRng([0.2, 0.2, 0.8, 0.8]), { polygon: null });
  assert.ok(good);
  assert.ok(good.distance >= Generator.MIN_OD_METERS);
  assert.ok(good.distance <= Generator.MAX_OD_METERS);
  assert.equal(good.points.length, 2);
});

test('measures city-scale distances within one percent', () => {
  const oneKmNorth = Generator.metersBetween([8.54, 47.377], [8.54, 47.377 + 1000 / 111320]);
  assert.ok(Math.abs(oneKmNorth - 1000) < 10);
});

test('shapes a facade response into the shell route-pair contract', async () => {
  const calls = [];
  const provider = Generator.createLivemapRoutePairProvider({
    apiBase: '/api/v1/routing',
    routeTypes: { fast: 'foot_fast', calm: 'foot_calm' },
    rng: sequenceRng([0.45, 0.5, 0.55, 0.62]),
    storage: new MemoryStorage(),
    onWarning: () => {},
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okFacadeResponse();
    }
  });

  const pair = await provider({ sessionId: 'session-1', roundIndex: 0 });
  assert.equal(calls[0].url, '/api/v1/routing/route');
  assert.deepEqual(calls[0].body.profiles, ['foot_fast', 'foot_calm']);
  assert.equal(calls[0].body.points.length, 2);

  assert.match(pair.pairId, /^zurich-random-/);
  assert.deepEqual(Object.keys(pair.routes).sort(), ['calm', 'fast']);
  assert.deepEqual(pair.routes.fast.geometry[0], [47.377, 8.54]);
  assert.equal(pair.routes.fast.source, 'model');
  assert.equal(pair.routes.calm.metadata.profile, 'foot_calm');
  assert.equal(pair.routes.calm.metadata.durationSeconds, 900);
  assert.equal(pair.origin.lat, 47.377);
  assert.equal(pair.destination.lng, 8.544);
});

test('returns the identical pair for a retried or resumed round', async () => {
  const storage = new MemoryStorage();
  let fetchCount = 0;
  const options = {
    rng: sequenceRng([0.45, 0.5, 0.55, 0.62]),
    storage,
    onWarning: () => {},
    fetchImpl: async () => {
      fetchCount += 1;
      return okFacadeResponse();
    }
  };

  const provider = Generator.createLivemapRoutePairProvider(options);
  const first = await provider({ sessionId: 'session-1', roundIndex: 0 });
  const retried = await provider({ sessionId: 'session-1', roundIndex: 0 });
  assert.equal(fetchCount, 1);
  assert.deepEqual(retried, first);

  const resumedProvider = Generator.createLivemapRoutePairProvider(options);
  const resumed = await resumedProvider({ sessionId: 'session-1', roundIndex: 0 });
  assert.equal(fetchCount, 1);
  assert.equal(resumed.pairId, first.pairId);
});

test('falls back to fixtures once when the facade is unreachable', async () => {
  let fetchCount = 0;
  let fallbackCount = 0;
  const provider = Generator.createLivemapRoutePairProvider({
    rng: sequenceRng([0.45, 0.5, 0.55, 0.62]),
    storage: new MemoryStorage(),
    onWarning: () => {},
    fetchImpl: async () => {
      fetchCount += 1;
      throw new TypeError('Failed to fetch');
    },
    fallbackProvider: async ({ roundIndex }) => {
      fallbackCount += 1;
      return { pairId: `fixture-${roundIndex}`, routes: {} };
    }
  });

  const first = await provider({ sessionId: 'session-1', roundIndex: 0 });
  const second = await provider({ sessionId: 'session-1', roundIndex: 1 });
  assert.equal(first.pairId, 'fixture-0');
  assert.equal(second.pairId, 'fixture-1');
  assert.equal(fetchCount, 1);
  assert.equal(fallbackCount, 2);
});

test('redraws unroutable pairs before giving up on the facade', async () => {
  let fetchCount = 0;
  const provider = Generator.createLivemapRoutePairProvider({
    rng: sequenceRng([0.45, 0.5, 0.55, 0.62]),
    storage: new MemoryStorage(),
    onWarning: () => {},
    fetchImpl: async () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        return { ok: false, status: 400, json: async () => ({ message: 'Connection not found' }) };
      }
      return okFacadeResponse();
    }
  });

  const pair = await provider({ sessionId: 'session-1', roundIndex: 0 });
  assert.equal(fetchCount, 2);
  assert.match(pair.pairId, /^zurich-random-/);
});
