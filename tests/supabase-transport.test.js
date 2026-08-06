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

test('posts answers through the write-only RPC', async () => {
  const calls = [];
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 201 }; }
  });
  assert.deepEqual(await transport.saveAnswer(answer), { status: 'sent' });
  assert.equal(calls[0].url, 'https://test.supabase.co/rest/v1/rpc/submit_benchmark_answer');
  assert.equal(calls[0].init.method, 'POST');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.p_record, answer);
});

test('posts progress through the write-only RPC', async () => {
  const calls = [];
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200 }; }
  });
  await transport.saveProgress(progress);
  assert.equal(calls[0].url, 'https://test.supabase.co/rest/v1/rpc/save_benchmark_progress');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.p_record, progress);
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

test('reads only the privacy-limited Calm route explorer feed', async () => {
  const calls = [];
  const payload = [{ participant_id: 'participant-irene', participant_name: 'Irene', routes_compared: 23, completion_order: 1 }];
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200, json: async () => payload };
    }
  });

  assert.deepEqual(await transport.listRouteExplorers(), payload);
  assert.equal(calls[0].url, 'https://test.supabase.co/rest/v1/rpc/get_calm_route_explorers');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, '{}');
  assert.equal(calls[0].init.headers['Authorization'], 'Bearer anon-key');
});

test('rejects malformed route explorer responses', async () => {
  const transport = createSupabaseTransport({
    url: 'https://test.supabase.co',
    anonKey: 'anon-key',
    storage: new MemoryStorage(),
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ participant_name: 'Irene' }) })
  });

  await assert.rejects(() => transport.listRouteExplorers(), /invalid response/);
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

test('throws if URL or anonKey is missing', () => {
  assert.throws(() => createSupabaseTransport({ anonKey: 'k' }), /URL/);
  assert.throws(() => createSupabaseTransport({ url: 'https://x.supabase.co' }), /anon key/);
});
