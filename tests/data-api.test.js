const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createDataApi } = require('../server/data-api.js');

async function startApi() {
  const dataDir = await mkdtemp(join(tmpdir(), 'ari-data-api-'));
  const { server, ready } = createDataApi({ dataDir });
  await ready;
  await new Promise(resolve => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise(resolve => server.close(resolve)) };
}

function validAnswer(overrides = {}) {
  return {
    test: 'calm_vs_fast',
    sessionId: 'calm-session-1',
    roundId: 'calm-session-1-round-1',
    captureId: 'calm-session-1-round-1',
    roundNumber: 1,
    participantName: 'Irene',
    pairId: 'pair-1',
    routeAssignment: { routeA: 'calm', routeB: 'fast' },
    labels: {
      A: { routeId: 'calm-1', routeType: 'calm', source: 'model' },
      B: { routeId: 'fast-1', routeType: 'fast', source: 'model' }
    },
    q1Choice: 'route_a',
    q2Separate: 'yes',
    q3Issues: ['too_busy_or_crowded'],
    createdAt: '2026-07-15T10:00:00.000Z',
    ...overrides
  };
}

function validProgress(overrides = {}) {
  return {
    test: 'calm_vs_fast',
    sessionId: 'calm-session-1',
    participantName: 'Irene',
    sessionStartedAt: '2026-07-15T09:00:00.000Z',
    roundIndex: 1,
    completedRounds: 1,
    questionStep: 'q1',
    savedAt: '2026-07-15T10:01:00.000Z',
    ...overrides
  };
}

test('saves an answer once and answers duplicates idempotently', async () => {
  const api = await startApi();
  try {
    const url = `${api.base}/api/v1/benchmarks/calm_vs_fast/answers`;
    const first = await fetch(url, { method: 'POST', body: JSON.stringify(validAnswer()) });
    assert.equal(first.status, 201);
    const firstBody = await first.json();
    assert.equal(firstBody.status, 'saved');
    assert.ok(firstBody.record.receivedAt);

    const second = await fetch(url, { method: 'POST', body: JSON.stringify(validAnswer()) });
    assert.equal(second.status, 200);
    assert.equal((await second.json()).status, 'duplicate');

    const feed = await fetch(url);
    assert.equal(feed.headers.get('content-type'), 'application/x-ndjson; charset=utf-8');
    const lines = (await feed.text()).trim().split('\n');
    assert.equal(lines.length, 1);
    assert.equal(JSON.parse(lines[0]).captureId, 'calm-session-1-round-1');
  } finally {
    await api.close();
  }
});

test('rejects answers that break the challenge rules or the endpoint test', async () => {
  const api = await startApi();
  try {
    const url = `${api.base}/api/v1/benchmarks/calm_vs_fast/answers`;
    const invalid = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(validAnswer({ q3Issues: [] }))
    });
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).errors.join(' '), /q3Issue/);

    const wrongTest = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(validAnswer({
        test: 'ari_fast_vs_google',
        source: 'fast-google-benchmark',
        routeAssignment: { routeA: 'livemap_fast', routeB: 'google' },
        labels: {
          A: { routeId: 'a', routeType: 'livemap_fast', source: 'livemap_fast' },
          B: { routeId: 'b', routeType: 'google', source: 'google' }
        },
        q2Separate: null,
        q3Issues: ['longer_time']
      }))
    });
    assert.equal(wrongTest.status, 400);
    assert.match((await wrongTest.json()).errors.join(' '), /does not match/);
  } finally {
    await api.close();
  }
});

test('upserts and returns session progress', async () => {
  const api = await startApi();
  try {
    const url = `${api.base}/api/v1/benchmarks/calm_vs_fast/sessions/calm-session-1/progress`;
    const first = await fetch(url, { method: 'PUT', body: JSON.stringify(validProgress()) });
    assert.equal(first.status, 200);
    await fetch(url, { method: 'PUT', body: JSON.stringify(validProgress({ roundIndex: 3, completedRounds: 3 })) });

    const read = await fetch(url);
    assert.equal(read.status, 200);
    assert.equal((await read.json()).record.roundIndex, 3);

    const missing = await fetch(`${api.base}/api/v1/benchmarks/calm_vs_fast/sessions/other/progress`);
    assert.equal(missing.status, 404);
  } finally {
    await api.close();
  }
});

test('rejects unknown tests and malformed JSON', async () => {
  const api = await startApi();
  try {
    const unknown = await fetch(`${api.base}/api/v1/benchmarks/not_a_test/answers`, {
      method: 'POST',
      body: JSON.stringify(validAnswer())
    });
    assert.equal(unknown.status, 404);

    const malformed = await fetch(`${api.base}/api/v1/benchmarks/calm_vs_fast/answers`, {
      method: 'POST',
      body: '{not json'
    });
    assert.equal(malformed.status, 400);
    assert.match((await malformed.json()).errors.join(' '), /JSON/);
  } finally {
    await api.close();
  }
});
