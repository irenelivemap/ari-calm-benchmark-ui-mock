const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = join(__dirname, '..');

test('builds a static Pages artifact with Street View configured without changing source', () => {
  const output = mkdtempSync(join(tmpdir(), 'ari-pages-build-'));
  const sourceConfigBefore = readFileSync(join(ROOT, 'runtime-config.js'), 'utf8');
  const fakeBrowserKey = 'test-street-view-browser-key';
  const fakeMapTilerKey = 'test-maptiler-browser-key';

  try {
    const result = spawnSync(
      process.execPath,
      [join(ROOT, 'scripts', 'build-pages.mjs'), '--out', output],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          ARI_GOOGLE_MAPS_KEY: fakeBrowserKey,
          ARI_MAPTILER_KEY: fakeMapTilerKey
        },
        encoding: 'utf8'
      }
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const deployedConfig = readFileSync(join(output, 'runtime-config.js'), 'utf8');
    assert.match(deployedConfig, new RegExp(`googleMapsKey: ${JSON.stringify(fakeBrowserKey)}`));
    assert.match(deployedConfig, new RegExp(`mapTilerKey: ${JSON.stringify(fakeMapTilerKey)}`));
    assert.equal(readFileSync(join(ROOT, 'runtime-config.js'), 'utf8'), sourceConfigBefore);
    assert.doesNotMatch(sourceConfigBefore, new RegExp(fakeBrowserKey));
    assert.match(readFileSync(join(output, 'index.html'), 'utf8'), /ARI Calm Route Comparison/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('refuses to build a production artifact without the Street View key', () => {
  const output = mkdtempSync(join(tmpdir(), 'ari-pages-build-missing-key-'));

  try {
    const env = { ...process.env };
    delete env.ARI_GOOGLE_MAPS_KEY;
    env.ARI_MAPTILER_KEY = 'test-maptiler-browser-key';
    const result = spawnSync(
      process.execPath,
      [join(ROOT, 'scripts', 'build-pages.mjs'), '--out', output],
      { cwd: ROOT, env, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ARI_GOOGLE_MAPS_KEY is required/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('refuses to build a production artifact without the MapTiler key', () => {
  const output = mkdtempSync(join(tmpdir(), 'ari-pages-build-missing-map-key-'));

  try {
    const env = { ...process.env, ARI_GOOGLE_MAPS_KEY: 'test-google-browser-key' };
    delete env.ARI_MAPTILER_KEY;
    const result = spawnSync(
      process.execPath,
      [join(ROOT, 'scripts', 'build-pages.mjs'), '--out', output],
      { cwd: ROOT, env, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ARI_MAPTILER_KEY is required/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
