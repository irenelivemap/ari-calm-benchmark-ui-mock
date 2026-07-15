const test = require('node:test');
const assert = require('node:assert/strict');
const { createHttpTransport } = require('../src/data/benchmark-transport.js');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

const answer = {
  test: 'ari_fast_vs_google',
  sessionId: 'session-1',
  captureId: 'capture-1'
};
const progress = {
  test: 'ari_fast_vs_google',
  sessionId: 'session-1',
  savedAt: '2026-07-15T10:00:00.000Z'
};

test('sends answers with an idempotency key', async () => {
  const calls = [];
  const transport = createHttpTransport({
    baseUrl: '/api/v1/benchmarks',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 201 };
    }
  });
  assert.deepEqual(await transport.saveAnswer(answer), { status: 'sent' });
  assert.equal(calls[0].url, '/api/v1/benchmarks/ari_fast_vs_google/answers');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Idempotency-Key'], 'capture-1');
});

test('upserts progress at the session endpoint', async () => {
  const calls = [];
  const transport = createHttpTransport({
    baseUrl: '/api/v1/benchmarks',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    }
  });
  await transport.saveProgress(progress);
  assert.equal(calls[0].url, '/api/v1/benchmarks/ari_fast_vs_google/sessions/session-1/progress');
  assert.equal(calls[0].init.method, 'PUT');
});

test('queues failed records and flushes them later', async () => {
  const storage = new MemoryStorage();
  let available = false;
  const transport = createHttpTransport({
    baseUrl: '/api/v1/benchmarks',
    storage,
    fetchImpl: async () => available
      ? { ok: true, status: 200 }
      : { ok: false, status: 503 }
  });
  const queued = await transport.saveAnswer(answer);
  assert.equal(queued.status, 'queued');
  assert.equal(transport.getPendingCount(), 1);
  available = true;
  assert.deepEqual(await transport.flush(), { delivered: 1, remaining: 0 });
  assert.equal(transport.getPendingCount(), 0);
});

test('replaces queued progress for the same session', async () => {
  const storage = new MemoryStorage();
  const transport = createHttpTransport({
    baseUrl: '/api/v1/benchmarks',
    storage,
    fetchImpl: async () => ({ ok: false, status: 503 })
  });
  await transport.saveProgress(progress);
  await transport.saveProgress({ ...progress, roundIndex: 4 });
  assert.equal(transport.getPendingCount(), 1);
});

test('a newer successful progress write removes the older queued write', async () => {
  const storage = new MemoryStorage();
  let available = false;
  const requests = [];
  const transport = createHttpTransport({
    baseUrl: '/api/v1/benchmarks',
    storage,
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return available ? { ok: true, status: 200 } : { ok: false, status: 503 };
    }
  });
  await transport.saveProgress({ ...progress, roundIndex: 1 });
  available = true;
  await transport.saveProgress({ ...progress, roundIndex: 2 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(transport.getPendingCount(), 0);
  assert.equal(requests.at(-1).roundIndex, 2);
});
