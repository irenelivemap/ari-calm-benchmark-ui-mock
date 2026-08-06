(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriSupabaseTransport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const QUEUE_KEY = 'ari-benchmark-supabase-outbox-v1';

  function readQueue(storage, key) {
    try {
      const value = JSON.parse(storage?.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function writeQueue(storage, key, queue) {
    storage?.setItem(key, JSON.stringify(queue));
  }

  function itemKey(kind, record) {
    return kind === 'answer'
      ? `answer:${record.captureId}`
      : `progress:${record.sessionId}`;
  }

  /**
   * Creates a transport backed by a Supabase project.
   *
   * Options:
   *   url       — Supabase project URL, e.g. https://xxxx.supabase.co
   *   anonKey   — Supabase anon/public key (safe to embed in client code)
   *   storage   — Web Storage instance (defaults to localStorage)
   *   fetchImpl — fetch implementation (defaults to globalThis.fetch)
   *
   * RPCs expected in Supabase (see supabase/migrations):
   *   submit_benchmark_answer — append/idempotency by captureId
   *   save_benchmark_progress — latest checkpoint by sessionId
   *   get_calm_route_explorers — privacy-limited team progress only
   */
  function createSupabaseTransport(options = {}) {
    const base = String(options.url || '').replace(/\/$/, '');
    if (!base) throw new TypeError('Supabase project URL is required.');
    const anonKey = String(options.anonKey || '');
    if (!anonKey) throw new TypeError('Supabase anon key is required.');
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
    const storage = options.storage || globalThis.localStorage;
    const queueKey = options.queueKey || QUEUE_KEY;
    let flushing = null;

    function authHeaders() {
      return {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      };
    }

    async function invoke(functionName, record) {
      const response = await fetchImpl(`${base}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ p_record: record }),
        keepalive: true
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Supabase ${functionName} returned ${response.status}: ${body}`);
      }
      return response;
    }

    async function invokeRead(functionName) {
      const response = await fetchImpl(`${base}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: authHeaders(),
        body: '{}'
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Supabase ${functionName} returned ${response.status}: ${body}`);
      }
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error(`Supabase ${functionName} returned an invalid response.`);
      return payload;
    }

    async function deliver(item) {
      if (item.kind === 'answer') {
        return invoke('submit_benchmark_answer', item.record);
      }
      if (item.kind === 'progress') {
        return invoke('save_benchmark_progress', item.record);
      }
      throw new Error(`Unknown kind: ${item.kind}`);
    }

    function enqueue(kind, record) {
      const queue = readQueue(storage, queueKey);
      const key = itemKey(kind, record);
      const item = { key, kind, record, queuedAt: new Date().toISOString() };
      const existing = queue.findIndex(entry => entry.key === key);
      if (existing >= 0) queue[existing] = item;
      else queue.push(item);
      writeQueue(storage, queueKey, queue);
      return { status: 'queued', key };
    }

    function removeQueued(kind, record) {
      const key = itemKey(kind, record);
      const queue = readQueue(storage, queueKey).filter(item => item.key !== key);
      writeQueue(storage, queueKey, queue);
    }

    async function flush() {
      if (flushing) return flushing;
      flushing = (async () => {
        const snapshot = readQueue(storage, queueKey);
        const deliveredAt = new Map();
        let delivered = 0;
        for (const item of snapshot) {
          try {
            await deliver(item);
            deliveredAt.set(item.key, item.queuedAt);
            delivered += 1;
          } catch (_) { /* stays queued */ }
        }
        const remaining = readQueue(storage, queueKey).filter(item =>
          deliveredAt.get(item.key) !== item.queuedAt
        );
        writeQueue(storage, queueKey, remaining);
        return { delivered, remaining: remaining.length };
      })().finally(() => { flushing = null; });
      return flushing;
    }

    async function save(kind, record) {
      try {
        await deliver({ kind, record });
        removeQueued(kind, record);
        void flush();
        return { status: 'sent' };
      } catch (error) {
        return { ...enqueue(kind, record), error };
      }
    }

    return {
      saveAnswer: record => save('answer', record),
      saveProgress: record => save('progress', record),
      listRouteExplorers: () => invokeRead('get_calm_route_explorers'),
      flush,
      getPendingCount: () => readQueue(storage, queueKey).length
    };
  }

  return { QUEUE_KEY, createSupabaseTransport };
});
