const test = require('node:test');
const assert = require('node:assert/strict');

const previousWindow = global.window;
global.window = {};
const benchmarkModulePath = require.resolve('../src/app/calm-benchmark.js');
delete require.cache[benchmarkModulePath];
require(benchmarkModulePath);
const { createMockRoutePairProvider, createSessionPairOrder } = global.window.AriCalmBenchmark;
if (previousWindow === undefined) delete global.window;
else global.window = previousWindow;

test('creates a stable grouped permutation of every embedded pair for a session', () => {
  const first = createSessionPairOrder(23, 'participant-session-one');
  const resumed = createSessionPairOrder(23, 'participant-session-one');

  assert.deepEqual(first, resumed);
  assert.deepEqual([...first].sort((a, b) => a - b), Array.from({ length: 23 }, (_, index) => index));
  assert.deepEqual([...first.slice(0, 10)].sort((a, b) => a - b), Array.from({ length: 10 }, (_, index) => index));
  assert.deepEqual([...first.slice(10)].sort((a, b) => a - b), Array.from({ length: 13 }, (_, index) => index + 10));
});

test('varies the embedded pair order between participant sessions', () => {
  const first = createSessionPairOrder(23, 'participant-session-one');
  const second = createSessionPairOrder(23, 'participant-session-two');

  assert.notDeepEqual(first.slice(0, 10), second.slice(0, 10));
  assert.notDeepEqual(first.slice(10), second.slice(10));
});

test('serves every embedded pair once before repeating and preserves resume order', async () => {
  const pairs = Array.from({ length: 23 }, (_, index) => ({
    pairId: `pair-${index + 1}`,
    sourceIndex: index
  }));
  const provider = createMockRoutePairProvider(pairs);
  const sessionId = 'participant-session-three';
  const firstCycle = await Promise.all(
    Array.from({ length: 23 }, (_, roundIndex) => provider({ sessionId, roundIndex }))
  );
  const resumedRound = await provider({ sessionId, roundIndex: 5 });
  const nextCycle = await provider({ sessionId, roundIndex: 23 });

  assert.deepEqual(
    firstCycle.map(pair => pair.sourceIndex).sort((a, b) => a - b),
    Array.from({ length: 23 }, (_, index) => index)
  );
  assert.ok(firstCycle.slice(0, 10).every(pair => pair.sourceIndex < 10));
  assert.ok(firstCycle.slice(10).every(pair => pair.sourceIndex >= 10));
  assert.equal(resumedRound.sourceIndex, firstCycle[5].sourceIndex);
  assert.equal(nextCycle.sourceIndex, firstCycle[0].sourceIndex);
});
