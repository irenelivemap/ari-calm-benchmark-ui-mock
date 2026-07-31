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

test('creates a stable permutation of every embedded pair for a session', () => {
  const first = createSessionPairOrder(12, 'participant-session-one');
  const resumed = createSessionPairOrder(12, 'participant-session-one');

  assert.deepEqual(first, resumed);
  assert.deepEqual([...first].sort((a, b) => a - b), Array.from({ length: 12 }, (_, index) => index));
});

test('varies the embedded pair order between participant sessions', () => {
  const first = createSessionPairOrder(12, 'participant-session-one');
  const second = createSessionPairOrder(12, 'participant-session-two');

  assert.notDeepEqual(first, second);
});

test('serves every embedded pair once before repeating and preserves resume order', async () => {
  const pairs = Array.from({ length: 12 }, (_, index) => ({
    pairId: `pair-${index + 1}`,
    sourceIndex: index
  }));
  const provider = createMockRoutePairProvider(pairs);
  const sessionId = 'participant-session-three';
  const firstCycle = await Promise.all(
    Array.from({ length: 12 }, (_, roundIndex) => provider({ sessionId, roundIndex }))
  );
  const resumedRound = await provider({ sessionId, roundIndex: 5 });
  const nextCycle = await provider({ sessionId, roundIndex: 12 });

  assert.deepEqual(
    firstCycle.map(pair => pair.sourceIndex).sort((a, b) => a - b),
    Array.from({ length: 12 }, (_, index) => index)
  );
  assert.equal(resumedRound.sourceIndex, firstCycle[5].sourceIndex);
  assert.equal(nextCycle.sourceIndex, firstCycle[0].sourceIndex);
});
