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

test('posts answers to the answer persisted type', async () => {
  const calls = [];
  const transport = createHttpTransport({
    baseUrl: '/api/v1',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 201 };
    }
  });
  assert.deepEqual(await transport.saveAnswer(answer), { status: 'sent' });
  assert.equal(calls[0].url, '/api/v1/persist/ari-route-benchmark-answer');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), answer);
});

test('posts progress to the progress persisted type', async () => {
  const calls = [];
  const transport = createHttpTransport({
    baseUrl: '/api/v1',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    }
  });
  await transport.saveProgress(progress);
  assert.equal(calls[0].url, '/api/v1/persist/ari-route-benchmark-progress');
  assert.equal(calls[0].init.method, 'POST');
});

test('supports overriding the persisted type names', async () => {
  const calls = [];
  const transport = createHttpTransport({
    baseUrl: '/api/v1',
    storage: new MemoryStorage(),
    persistedTypes: { answer: 'custom-answer' },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 201 };
    }
  });
  await transport.saveAnswer(answer);
  assert.equal(calls[0].url, '/api/v1/persist/custom-answer');
});

test('rejects reads because the persist API is write-only', async () => {
  const transport = createHttpTransport({
    baseUrl: '/api/v1',
    storage: new MemoryStorage(),
    fetchImpl: async () => { throw new Error('must not be called'); }
  });
  await assert.rejects(() => transport.listAnswers('calm_route_comparison'), /write-only/);
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

test('records queued during an in-flight flush survive it', async () => {
  const storage = new MemoryStorage();
  let releaseFlush;
  const gate = new Promise(resolve => { releaseFlush = resolve; });
  let mode = 'fail';
  const transport = createHttpTransport({
    baseUrl: '/api/v1/benchmarks',
    storage,
    fetchImpl: async () => {
      if (mode === 'fail') return { ok: false, status: 503 };
      if (mode === 'slow-ok') {
        await gate;
        return { ok: true, status: 200 };
      }
      return { ok: true, status: 200 };
    }
  });

  await transport.saveAnswer(answer);
  assert.equal(transport.getPendingCount(), 1);

  mode = 'slow-ok';
  const flushing = transport.flush();
  mode = 'fail';
  await transport.saveProgress(progress);
  assert.equal(transport.getPendingCount(), 2);

  mode = 'slow-ok';
  releaseFlush();
  await flushing;

  assert.equal(transport.getPendingCount(), 1);
  const queue = JSON.parse(storage.getItem('ari-benchmark-http-outbox-v1'));
  assert.equal(queue[0].kind, 'progress');
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
