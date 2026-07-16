/**
 * Zero-dependency dev server for live route pairs.
 *
 * Serves the static benchmark UI like `npm start`, and additionally proxies
 * `/api/v1/routing/*` to a locally running livemap-routing service so the
 * browser talks to the facade same-origin (no CORS setup needed).
 *
 *   node scripts/dev-live.mjs
 *
 * Environment:
 *   PORT                    UI port (default 8765)
 *   LIVEMAP_ROUTING_ORIGIN  Facade origin (default http://127.0.0.1:8989)
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 8765);
const ROUTING_ORIGIN = process.env.LIVEMAP_ROUTING_ORIGIN || 'http://127.0.0.1:8989';
const DATA_ORIGIN = process.env.ARI_DATA_ORIGIN || 'http://127.0.0.1:8090';
const DATA_API_BASE = process.env.ARI_DATA_API_BASE || '';
const GOOGLE_MAPS_KEY = process.env.ARI_GOOGLE_MAPS_KEY || '';
const PROXY_PREFIX = '/api/v1/routing';
const DATA_PROXY_PREFIX = '/api/v1/benchmarks';
const PUBLIC_BASE_PATH = '/routing';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

async function proxyToFacade(request, response, pathname, origin = ROUTING_ORIGIN) {
  const target = `${origin}${pathname}`;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: { 'Content-Type': request.headers['content-type'] || 'application/json' },
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.concat(chunks)
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    response.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json'
    });
    response.end(body);
  } catch (error) {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      status: 'error',
      message: `Upstream unreachable at ${origin}: ${error.message}`
    }));
  }
}

async function serveStatic(response, pathname) {
  const isPublicPath = pathname === PUBLIC_BASE_PATH || pathname.startsWith(`${PUBLIC_BASE_PATH}/`);
  const publicRelative = isPublicPath ? pathname.slice(PUBLIC_BASE_PATH.length).replace(/^\//, '') : '';
  const cleanChallenge = ['fast-vs-google', 'fast-vs-calm'].includes(publicRelative.replace(/\/$/, ''));
  const relative = cleanChallenge
    ? 'index.html'
    : isPublicPath
      ? publicRelative || 'index.html'
      : pathname === '/' ? 'index.html' : pathname.slice(1);
  // Mirror the Caddy env injection: ARI_DATA_API_BASE exercises the real HTTP
  // transport against the local data API, ARI_GOOGLE_MAPS_KEY enables Street
  // View and live Google pairs without a ?gmap= link.
  if (relative === 'runtime-config.js' && (DATA_API_BASE || GOOGLE_MAPS_KEY)) {
    const injected = {};
    if (DATA_API_BASE) injected.dataApiBase = DATA_API_BASE;
    if (GOOGLE_MAPS_KEY) injected.googleMapsKey = GOOGLE_MAPS_KEY;
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    return response.end(
      `window.ARI_RUNTIME_CONFIG = Object.assign(${JSON.stringify(injected)}, window.ARI_RUNTIME_CONFIG || {});\n`
    );
  }
  const filePath = normalize(join(ROOT, relative));
  if (!filePath.startsWith(normalize(ROOT))) {
    response.writeHead(403);
    return response.end('Forbidden');
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

http.createServer((request, response) => {
  const { pathname } = new URL(request.url, `http://127.0.0.1:${PORT}`);
  if (pathname.startsWith(PROXY_PREFIX)) return proxyToFacade(request, response, pathname);
  if (pathname.startsWith(DATA_PROXY_PREFIX)) return proxyToFacade(request, response, pathname, DATA_ORIGIN);
  if (pathname === PUBLIC_BASE_PATH) {
    response.writeHead(308, { Location: `${PUBLIC_BASE_PATH}/` });
    return response.end();
  }
  if (/^\/routing\/(fast-vs-google|fast-vs-calm)\/$/.test(pathname)) {
    response.writeHead(308, { Location: pathname.replace(/\/$/, '') });
    return response.end();
  }
  return serveStatic(response, pathname);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Benchmark UI on http://127.0.0.1:${PORT}/?game=calm`);
  console.log(`Public-path preview on http://127.0.0.1:${PORT}${PUBLIC_BASE_PATH}/fast-vs-google`);
  console.log(`Proxying ${PROXY_PREFIX}/* to ${ROUTING_ORIGIN}`);
});
