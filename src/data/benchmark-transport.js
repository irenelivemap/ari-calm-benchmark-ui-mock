(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriBenchmarkTransport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_QUEUE_KEY = 'ari-benchmark-http-outbox-v1';

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

  function requestKey(kind, record) {
    return kind === 'answer'
      ? `answer:${record.captureId}`
      : `progress:${record.test}:${record.sessionId}`;
  }

  function createHttpTransport(options = {}) {
    const baseUrl = String(options.baseUrl || '').replace(/\/$/, '');
    if (!baseUrl) throw new TypeError('A benchmark data API base URL is required.');
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
    const storage = options.storage || globalThis.localStorage;
    const queueKey = options.queueKey || DEFAULT_QUEUE_KEY;
    let flushing = null;

    function endpoint(kind, record) {
      const test = encodeURIComponent(record.test);
      if (kind === 'answer') return `${baseUrl}/${test}/answers`;
      return `${baseUrl}/${test}/sessions/${encodeURIComponent(record.sessionId)}/progress`;
    }

    async function deliver(item) {
      const response = await fetchImpl(endpoint(item.kind, item.record), {
        method: item.kind === 'answer' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(item.kind === 'answer' ? { 'Idempotency-Key': item.record.captureId } : {})
        },
        body: JSON.stringify(item.record),
        keepalive: true
      });
      if (!response.ok) throw new Error(`Benchmark API returned ${response.status}.`);
      return response;
    }

    function enqueue(kind, record) {
      const queue = readQueue(storage, queueKey);
      const key = requestKey(kind, record);
      const item = { key, kind, record, queuedAt: new Date().toISOString() };
      const existing = queue.findIndex(entry => entry.key === key);
      if (existing >= 0) queue[existing] = item;
      else queue.push(item);
      writeQueue(storage, queueKey, queue);
      return { status: 'queued', key };
    }

    function removeQueued(kind, record) {
      const key = requestKey(kind, record);
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
        // Merge against the live queue instead of writing the snapshot back:
        // records enqueued while this flush was in flight must survive, and a
        // record re-queued with a newer payload must not be dropped just
        // because its older version was delivered.
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
      flush,
      getPendingCount: () => readQueue(storage, queueKey).length
    };
  }

  return { DEFAULT_QUEUE_KEY, createHttpTransport };
});
