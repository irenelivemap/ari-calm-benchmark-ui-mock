#!/usr/bin/env node
/**
 * Benchmark data API — the reference implementation of docs/DATA_SAVING.md.
 *
 * Zero dependencies and file-backed. It runs behind the deploy/Caddyfile
 * `/api/v1/benchmarks*` proxy as DATA_UPSTREAM, so it serves the full public
 * path itself. Validation reuses src/data/calm-benchmark-data.js, so the
 * server enforces exactly the rules the browser enforces.
 *
 *   node server/data-api.js                 # PORT 8090, DATA_DIR ./benchmark-data
 *   DATA_DIR=/data PORT=8090 node server/data-api.js
 *
 * Endpoints (testId is calm_route_comparison, calm_vs_fast legacy, or ari_fast_vs_google):
 *   POST /api/v1/benchmarks/{testId}/answers                    201 saved / 200 duplicate
 *   PUT  /api/v1/benchmarks/{testId}/sessions/{id}/progress     200 upserted
 *   GET  /api/v1/benchmarks/{testId}/sessions/{id}/progress     200 / 404
 *   GET  /api/v1/benchmarks/{testId}/answers                    NDJSON feed
 *   GET  /healthz
 */
const http = require('node:http');
const { mkdir, readFile, writeFile, rename, open } = require('node:fs/promises');
const { join } = require('node:path');
const { timingSafeEqual } = require('node:crypto');
const {
  validateAnswerRecord,
  validateProgressRecord
} = require('../src/data/calm-benchmark-data.js');

const BASE_PATH = '/api/v1/benchmarks';
const KNOWN_TESTS = new Set(['calm_route_comparison', 'calm_vs_fast', 'ari_fast_vs_google']);
const MAX_BODY_BYTES = 1024 * 1024;

function createDataApi({ dataDir, adminToken = '', allowedOrigins = [], rateLimitPerMinute = 600 }) {
  /** In-memory answer index per test: captureId -> stored record. */
  const answersByTest = new Map();
  /** Serialize all writes so concurrent requests cannot interleave files. */
  let writeChain = Promise.resolve();
  const requestWindows = new Map();

  const answersFile = test => join(dataDir, `${test}-answers.ndjson`);
  const progressFile = test => join(dataDir, `${test}-progress.json`);

  function serialize(work) {
    const next = writeChain.then(work, work);
    writeChain = next.catch(() => {});
    return next;
  }

  function authorized(request) {
    if (!adminToken) return false;
    const supplied = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const expectedBuffer = Buffer.from(adminToken);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length
      && timingSafeEqual(expectedBuffer, suppliedBuffer);
  }

  function originAllowed(request) {
    if (!allowedOrigins.length) return true;
    return allowedOrigins.includes(String(request.headers.origin || ''));
  }

  function withinRateLimit(request) {
    const now = Date.now();
    const key = request.socket.remoteAddress || 'unknown';
    const current = requestWindows.get(key);
    if (!current || now - current.startedAt >= 60_000) {
      requestWindows.set(key, { startedAt: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= rateLimitPerMinute;
  }

  async function appendDurably(path, value) {
    const handle = await open(path, 'a');
    try {
      await handle.write(value);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async function loadAnswers(test) {
    if (answersByTest.has(test)) return answersByTest.get(test);
    const index = new Map();
    try {
      const contents = await readFile(answersFile(test), 'utf8');
      const lines = contents.split('\n');
      for (const [lineIndex, line] of lines.entries()) {
        if (!line.trim()) continue;
        let record;
        try {
          record = JSON.parse(line);
        } catch (error) {
          const isFinalPartialLine = lineIndex === lines.length - 1 && !contents.endsWith('\n');
          if (!isFinalPartialLine) throw error;
          console.warn(`[data-api] Ignoring incomplete final record in ${answersFile(test)}.`);
          continue;
        }
        if (record.captureId) index.set(record.captureId, record);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    answersByTest.set(test, index);
    return index;
  }

  async function readProgressMap(test) {
    try {
      return JSON.parse(await readFile(progressFile(test), 'utf8')) || {};
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return {};
    }
  }

  async function saveAnswer(test, input) {
    const result = validateAnswerRecord(input);
    if (!result.valid) return { status: 400, body: { status: 'invalid', errors: result.errors } };
    if (result.record.test !== test) {
      return {
        status: 400,
        body: { status: 'invalid', errors: [`Record test ${result.record.test} does not match endpoint ${test}.`] }
      };
    }
    return serialize(async () => {
      const index = await loadAnswers(test);
      const existing = index.get(result.record.captureId);
      if (existing) return { status: 200, body: { status: 'duplicate', record: existing } };
      const record = { ...result.record, receivedAt: new Date().toISOString() };
      await appendDurably(answersFile(test), `${JSON.stringify(record)}\n`);
      index.set(record.captureId, record);
      return { status: 201, body: { status: 'saved', record } };
    });
  }

  async function saveProgress(test, sessionId, input) {
    const result = validateProgressRecord(input);
    if (!result.valid) return { status: 400, body: { status: 'invalid', errors: result.errors } };
    if (result.record.test !== test || result.record.sessionId !== sessionId) {
      return {
        status: 400,
        body: { status: 'invalid', errors: ['Record test/sessionId does not match the endpoint.'] }
      };
    }
    return serialize(async () => {
      const record = { ...result.record, receivedAt: new Date().toISOString() };
      const map = await readProgressMap(test);
      map[sessionId] = record;
      const target = progressFile(test);
      const temporary = `${target}.tmp`;
      await writeFile(temporary, JSON.stringify(map, null, 2));
      await rename(temporary, target);
      return { status: 200, body: { status: 'saved', record } };
    });
  }

  async function getProgress(test, sessionId) {
    const record = (await readProgressMap(test))[sessionId];
    if (!record) return { status: 404, body: { status: 'not_found' } };
    return { status: 200, body: { status: 'ok', record } };
  }

  async function answersFeed(test) {
    const records = await loadAnswers(test);
    return Array.from(records.values(), record => JSON.stringify(record)).join('\n')
      + (records.size ? '\n' : '');
  }

  function readBody(request) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      request.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          reject(Object.assign(new Error('Body too large.'), { statusCode: 413 }));
          request.destroy();
          return;
        }
        chunks.push(chunk);
      });
      request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      request.on('error', reject);
    });
  }

  function sendJson(response, status, body) {
    response.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(JSON.stringify(body));
  }

  const server = http.createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname === '/healthz') return sendJson(response, 200, { status: 'ok' });

    const answersMatch = pathname.match(new RegExp(`^${BASE_PATH}/([^/]+)/answers$`));
    const progressMatch = pathname.match(new RegExp(`^${BASE_PATH}/([^/]+)/sessions/([^/]+)/progress$`));
    const test = decodeURIComponent(answersMatch?.[1] || progressMatch?.[1] || '');
    if ((!answersMatch && !progressMatch) || !KNOWN_TESTS.has(test)) {
      return sendJson(response, 404, { status: 'not_found' });
    }

    try {
      const isWrite = request.method === 'POST' || request.method === 'PUT';
      if (isWrite && !originAllowed(request)) {
        return sendJson(response, 403, { status: 'forbidden' });
      }
      if (isWrite && !withinRateLimit(request)) {
        response.setHeader('Retry-After', '60');
        return sendJson(response, 429, { status: 'rate_limited' });
      }
      if (answersMatch && request.method === 'POST') {
        const input = JSON.parse(await readBody(request));
        if (request.headers['idempotency-key'] !== input.captureId) {
          return sendJson(response, 400, { status: 'invalid', errors: ['Idempotency-Key must match captureId.'] });
        }
        const { status, body } = await saveAnswer(test, input);
        return sendJson(response, status, body);
      }
      if (answersMatch && request.method === 'GET') {
        if (!authorized(request)) return sendJson(response, 401, { status: 'unauthorized' });
        response.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8' });
        return response.end(await answersFeed(test));
      }
      if (progressMatch) {
        const sessionId = decodeURIComponent(progressMatch[2]);
        if (request.method === 'PUT') {
          const { status, body } = await saveProgress(test, sessionId, JSON.parse(await readBody(request)));
          return sendJson(response, status, body);
        }
        if (request.method === 'GET') {
          if (!authorized(request)) return sendJson(response, 401, { status: 'unauthorized' });
          const { status, body } = await getProgress(test, sessionId);
          return sendJson(response, status, body);
        }
      }
      return sendJson(response, 405, { status: 'method_not_allowed' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return sendJson(response, 400, { status: 'invalid', errors: ['Body is not valid JSON.'] });
      }
      if (error.statusCode === 413) {
        return sendJson(response, 413, { status: 'invalid', errors: ['Body too large.'] });
      }
      console.error('[data-api]', error);
      return sendJson(response, 500, { status: 'error' });
    }
  });

  return { server, ready: mkdir(dataDir, { recursive: true }) };
}

module.exports = { createDataApi, BASE_PATH, KNOWN_TESTS };

if (require.main === module) {
  const dataDir = process.env.DATA_DIR || join(__dirname, '..', 'benchmark-data');
  const port = Number(process.env.PORT || 8090);
  const adminToken = process.env.ARI_DATA_ADMIN_TOKEN || '';
  const allowedOrigins = String(process.env.ARI_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!adminToken || !allowedOrigins.length) {
    console.error('ARI_DATA_ADMIN_TOKEN and ARI_ALLOWED_ORIGINS are required.');
    process.exit(1);
  }
  const { server, ready } = createDataApi({ dataDir, adminToken, allowedOrigins });
  ready.then(() => {
    server.listen(port, () => {
      console.log(`Benchmark data API on http://127.0.0.1:${port}${BASE_PATH}`);
      console.log(`Storing records in ${dataDir}`);
    });
  });
}
