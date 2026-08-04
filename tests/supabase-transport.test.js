const test = require('node:test');
const assert = require('node:assert/strict');
const { createSupabaseTransport } = require('../src/data/supabase-transport.js');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

const answer = {
  captureId: 'session-1-round-1',
  sessionId: 'session-1',
  test: 'calm_route_comparison',
  participantName: 'Irene',
  pairId: 'calm-route-comparison-01',
  q1Choice: 'route_a'
};

const progress = {
  sessionId: 'session-1',
  test: 'calm_route_comparison',
  roundIndex: 2
};

test('posts answer to benchmark_answers with ignore-duplicates', async () => {
  const calls = [];
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 201 }; }
  });
  assert.deepEqual(await transport.saveAnswer(answer), { status: 'sent' });
  assert.equal(calls[0].url, 'https://test.supabase.co/rest/v1/benchmark_answers');
  assert.equal(calls[0].init.method, 'POST');
  assert.ok(calls[0].init.headers['Prefer'].includes('ignore-duplicates'));
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.capture_id, 'session-1-round-1');
  assert.equal(body.session_id, 'session-1');
  assert.deepEqual(body.payload, answer);
});

test('posts progress to benchmark_progress with merge-duplicates', async () => {
  const calls = [];
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200 }; }
  });
  await transport.saveProgress(progress);
  assert.equal(calls[0].url, 'https://test.supabase.co/rest/v1/benchmark_progress');
  assert.ok(calls[0].init.headers['Prefer'].includes('merge-duplicates'));
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.session_id, 'session-1');
  assert.deepEqual(body.payload, progress);
});

test('sets apikey and Authorization headers', async () => {
  const calls = [];
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'my-anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 201 }; }
  });
  await transport.saveAnswer(answer);
  assert.equal(calls[0].init.headers['apikey'], 'my-anon-key');
  assert.equal(calls[0].init.headers['Authorization'], 'Bearer my-anon-key');
});

test('queues failed answers and flushes them on retry', async () => {
  const storage = new MemoryStorage();
  let available = false;
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage,
    fetchImpl: async () => available ? { ok: true, status: 201 } : { ok: false, status: 503, text: async () => '' }
  });
  const queued = await transport.saveAnswer(answer);
  assert.equal(queued.status, 'queued');
  assert.equal(transport.getPendingCount(), 1);
  available = true;
  const result = await transport.flush();
  assert.equal(result.delivered, 1);
  assert.equal(transport.getPendingCount(), 0);
});

test('reads answers filtered by test from benchmark_answers', async () => {
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url) => {
      assert.ok(url.includes('test=eq.calm_route_comparison'));
      assert.ok(url.includes('select=payload'));
      return {
        ok: true,
        status: 200,
        json: async () => [{ payload: answer }]
      };
    }
  });
  const results = await transport.listAnswers('calm_route_comparison');
  assert.deepEqual(results, [answer]);
});

test('throws if URL or anonKey is missing', () => {
  assert.throws(() => createSupabaseTransport({ anonKey: 'k' }), /URL/);
  assert.throws(() => createSupabaseTransport({ url: 'https://x.supabase.co' }), /anon key/);
});
