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
   * Tables expected in Supabase (see supabase-setup.sql):
   *   benchmark_answers  — dedupe on capture_id (ignore on conflict)
   *   benchmark_progress — dedupe on session_id (replace on conflict)
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

    async function upsert(table, row, prefer) {
      const response = await fetchImpl(`${base}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Prefer': prefer },
        body: JSON.stringify(row),
        keepalive: true
      });
      // 201 created, 200 upserted — both are success
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Supabase ${table} returned ${response.status}: ${body}`);
      }
      return response;
    }

    async function deliver(item) {
      if (item.kind === 'answer') {
        const row = {
          capture_id: item.record.captureId,
          session_id: item.record.sessionId,
          test: item.record.test,
          participant_name: item.record.participantName || null,
          pair_id: item.record.pairId || null,
          payload: item.record
        };
        // Ignore duplicates — same captureId means same answer, no update needed
        return upsert('benchmark_answers', row, 'resolution=ignore-duplicates,return=minimal');
      }
      if (item.kind === 'progress') {
        const row = {
          session_id: item.record.sessionId,
          test: item.record.test,
          payload: item.record
        };
        // Replace — always keep the latest progress for a session
        return upsert('benchmark_progress', row, 'resolution=merge-duplicates,return=minimal');
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

    async function listAnswers(test) {
      const url = new URL(`${base}/rest/v1/benchmark_answers`);
      url.searchParams.set('test', `eq.${test}`);
      url.searchParams.set('select', 'payload');
      url.searchParams.set('order', 'created_at.asc');
      const response = await fetchImpl(url.toString(), {
        method: 'GET',
        headers: { ...authHeaders(), 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`Supabase list returned ${response.status}.`);
      const rows = await response.json();
      return Array.isArray(rows) ? rows.map(r => r.payload) : [];
    }

    return {
      saveAnswer: record => save('answer', record),
      saveProgress: record => save('progress', record),
      listAnswers,
      flush,
      getPendingCount: () => readQueue(storage, queueKey).length
    };
  }

  return { QUEUE_KEY, createSupabaseTransport };
});
