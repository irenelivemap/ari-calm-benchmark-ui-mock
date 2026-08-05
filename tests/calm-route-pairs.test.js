const test = require('node:test');
const assert = require('node:assert/strict');

const pairs = require('../src/data/mock-route-pairs.js');
const diagnostics = require('../src/data/mock-route-diagnostics.js');

const EXPECTED_CORPUS_VERSION = 'calm-curated-v2';
const EXPECTED_CORPUS_FINGERPRINT = '20c716cbb91a4fb09f6eb86c686afeab5dd099378886b6bd1cc548adeb366715';
const EXPECTED_SOURCE_ROUNDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25
];

test('loads the complete versioned Calm Quiet, Calm Nature, and Fast corpus', () => {
  assert.equal(pairs.length, 23);
  assert.equal(pairs.corpusVersion, EXPECTED_CORPUS_VERSION);
  assert.equal(pairs.corpusFingerprint, EXPECTED_CORPUS_FINGERPRINT);
  assert.deepEqual(pairs.sourceRounds, EXPECTED_SOURCE_ROUNDS);

  pairs.forEach((pair, pairIndex) => {
    const pairNumber = pairIndex + 1;
    assert.equal(pair.pairId, `calm-route-comparison-${String(pairNumber).padStart(2, '0')}`);
    assert.equal(pair.sourceRound, EXPECTED_SOURCE_ROUNDS[pairIndex]);
    assert.match(pair.sourceDigest, /^[a-f0-9]{64}$/);
    assert.deepEqual(Object.keys(pair.routes), ['calm_quiet', 'calm_nature', 'fast']);

    const routeEntries = Object.entries(pair.routes);
    const referenceStart = pair.routes.fast.geometry[0];
    const referenceEnd = pair.routes.fast.geometry.at(-1);
    routeEntries.forEach(([routeType, route]) => {
      assert.ok(route.geometry.length >= 2);
      assert.ok(route.geometry.every(([lat, lng]) => Number.isFinite(lat)
        && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180));
      assert.deepEqual(route.geometry[0], referenceStart);
      assert.deepEqual(route.geometry.at(-1), referenceEnd);
      assert.ok(route.metadata.distanceMeters > 0);
      assert.ok(route.metadata.durationSeconds > 0);
      assert.equal(route.routeId, `calm-round-${pairNumber}-${routeType.replace('_', '-')}`);
    });
    assert.equal(pair.routes.fast.metadata.profile, 'foot_fast');
    assert.equal(pair.routes.calm_quiet.metadata.profile, 'foot_calm');
    assert.equal(pair.routes.calm_nature.metadata.profile, 'foot_calm_v1');
    assert.equal(pair.routes.calm_quiet.metadata.fastDurationSeconds, pair.routes.fast.metadata.durationSeconds);
    assert.equal(pair.routes.calm_nature.metadata.fastDurationSeconds, pair.routes.fast.metadata.durationSeconds);
  });
});
test('keeps every diagnostic record aligned with the exact embedded route corpus', () => {
  assert.equal(diagnostics.corpusVersion, pairs.corpusVersion);
  assert.equal(diagnostics.corpusFingerprint, pairs.corpusFingerprint);
  assert.equal(diagnostics.pairs.length, pairs.length);

  diagnostics.pairs.forEach((diagnostic, pairIndex) => {
    const pair = pairs[pairIndex];
    assert.equal(diagnostic.pairId, pair.pairId);
    assert.equal(diagnostic.sourceRound, pair.sourceRound);
    assert.equal(diagnostic.sourceDigest, pair.sourceDigest);
    assert.ok(diagnostic.origin_label);
    assert.ok(diagnostic.destination_label);
    assert.deepEqual(Object.keys(diagnostic.metric_averages), ['calm_quiet', 'calm_nature', 'fast']);
  });
});
