#!/usr/bin/env node
/** Read-only production smoke test. It never submits participant data. */
const siteUrl = new URL(process.argv[2] || 'https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/');

async function fetchOk(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response;
}

const page = await (await fetchOk(siteUrl)).text();
const configMatch = page.match(/<script[^>]+src=["']([^"']*runtime-config\.js[^"']*)["']/i);
if (!configMatch) throw new Error('The deployed page does not load runtime-config.js.');
const configUrl = new URL(configMatch[1], siteUrl);
const configText = await (await fetchOk(configUrl)).text();
const projectMatch = configText.match(/supabaseUrl:\s*['"](https:\/\/([a-z0-9]+)\.supabase\.co)['"]/);
const keyMatch = configText.match(/supabaseAnonKey:\s*['"]([^'"]+)['"]/);
if (!projectMatch || !keyMatch) throw new Error('The deployed Supabase URL or anon key is missing.');
if (projectMatch[2] !== 'xyrmytymcipyntdtsksu') throw new Error(`Unexpected Supabase project ${projectMatch[2]}.`);
const googleKeyMatch = configText.match(/googleMapsKey:\s*['"]([^'"]+)['"]/);
if (!googleKeyMatch?.[1]) throw new Error('The deployed Google Maps key is missing; Street View is unavailable.');
const mapTilerKeyMatch = configText.match(/mapTilerKey:\s*['"]([^'"]+)['"]/);
if (!mapTilerKeyMatch?.[1]) throw new Error('The deployed MapTiler key is missing; the production basemap is unavailable.');

await fetchOk(`https://api.maptiler.com/maps/streets-v4/style.json?key=${encodeURIComponent(mapTilerKeyMatch[1])}`, {
  headers: { Referer: siteUrl.origin }
});

const jwtPayload = JSON.parse(Buffer.from(keyMatch[1].split('.')[1], 'base64url').toString('utf8'));
if (jwtPayload.role !== 'anon') throw new Error(`Browser key has unexpected role ${jwtPayload.role || 'unknown'}.`);

const headers = {
  apikey: keyMatch[1],
  Authorization: `Bearer ${keyMatch[1]}`,
  Prefer: 'count=exact',
  Range: '0-0'
};
const exposure = {};
for (const table of ['benchmark_answers', 'benchmark_progress']) {
  const response = await fetch(`${projectMatch[1]}/rest/v1/${table}?select=id&limit=1`, { headers });
  if ([401, 403].includes(response.status)) {
    exposure[table] = 0;
    continue;
  }
  if (!response.ok) throw new Error(`Supabase ${table} read probe returned unexpected HTTP ${response.status}.`);
  const rows = await response.json();
  exposure[table] = Array.isArray(rows) ? rows.length : -1;
  if (!Array.isArray(rows) || rows.length !== 0) {
    throw new Error(`Anonymous reads exposed ${table} data.`);
  }
}

console.log(JSON.stringify({
  ok: true,
  site: siteUrl.href,
  runtimeConfig: configUrl.href,
  supabaseProject: projectMatch[2],
  browserKeyRole: jwtPayload.role,
  streetViewConfigured: true,
  mapTilerConfigured: true,
  anonymousRowsExposed: exposure,
  note: 'Read-only check; participant writes were not exercised.'
}, null, 2));
