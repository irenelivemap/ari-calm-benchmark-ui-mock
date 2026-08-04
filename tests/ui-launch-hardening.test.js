const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles/calm-benchmark.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app/calm-benchmark.js'), 'utf8');

test('exposes accessible page landmarks and launch form feedback', () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /class="calm-skip-link"/);
  assert.match(html, /id="participant-name"[^>]*required[^>]*aria-describedby="start-form-error"/);
  assert.match(html, /id="start-form-error"[^>]*aria-live="polite"/);
  assert.match(html, /<main id="community-results"/);
  assert.match(html, /<main id="calm-benchmark-root"/);
});

test('keeps participant records explorable and easy to interpret', () => {
  assert.match(html, /mock-route-diagnostics\.js/);
  assert.match(html, /class="calm-pp-question">Which route would you choose for a calmer walk\?/);
  assert.match(html, /Do you know another Calm route that would work better\?/);
  assert.doesNotMatch(html, /Known alternative/);
  assert.doesNotMatch(html, /querySelectorAll\('\.calm-pp-card__header\[aria-expanded="true"\]'/);
});

test('supports complete onboarding keyboard navigation', () => {
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /querySelectorAll\('button:not\(\[hidden\]\):not\(\[disabled\]\)'\)/);
  assert.match(app, /event\.shiftKey/);
});

test('uses readable secondary text and respects reduced-motion preferences', () => {
  assert.match(css, /--ari-faint: rgba\(33, 26, 42, 0\.68\)/);
  assert.match(css, /\.calm-pp-map\s*\{[^}]*transition:\s*height/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.calm-pp-map\s*\{\s*transition:\s*none;/);
  assert.match(css, /\.ari-choice-grid label\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.ari-onboarding__close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
});
