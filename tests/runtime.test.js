const test = require('node:test');
const assert = require('node:assert/strict');
const {
  inferBasePath,
  resolveChallenge,
  challengeUrl,
  rootUrl,
  resolveConfig
} = require('../src/app/runtime.js');

test('infers the public routing base without affecting preview paths', () => {
  assert.equal(inferBasePath('/routing/fast-vs-google'), '/routing');
  assert.equal(inferBasePath('/ari-calm-benchmark-ui-mock/'), '');
  assert.equal(inferBasePath('/anything', '/routing/'), '/routing');
});

test('resolves clean challenge paths and legacy query parameters', () => {
  assert.equal(resolveChallenge({ pathname: '/routing/fast-vs-google', search: '' }), 'google');
  assert.equal(resolveChallenge({ pathname: '/routing/fast-vs-calm', search: '?game=google' }), 'calm');
  assert.equal(resolveChallenge({ pathname: '/preview/', search: '?game=google' }), 'google');
});

test('builds clean production URLs and preserves legacy preview URLs', () => {
  const production = challengeUrl(
    { href: 'https://game.livemap.sh/routing/?view=results' },
    'google',
    { production: true, basePath: '/routing' }
  );
  assert.equal(production.href, 'https://game.livemap.sh/routing/fast-vs-google?view=results');

  const preview = challengeUrl(
    { href: 'https://irenelivemap.github.io/ari-calm-benchmark-ui-mock/' },
    'calm'
  );
  assert.equal(preview.search, '?game=calm');
});

test('builds the public arcade root URL', () => {
  const url = rootUrl(
    { href: 'https://game.livemap.sh/routing/fast-vs-google?view=results' },
    { basePath: '/routing' }
  );
  assert.equal(url.href, 'https://game.livemap.sh/routing/');
});

test('production runtime defaults hide development surfaces', () => {
  const config = resolveConfig({
    ARI_RUNTIME_CONFIG: { production: true, basePath: '/routing' }
  });
  assert.equal(config.production, true);
  assert.equal(config.showReset, false);
  assert.equal(config.enableTeamResults, false);
  assert.equal(config.allowQueryConfig, false);
});
