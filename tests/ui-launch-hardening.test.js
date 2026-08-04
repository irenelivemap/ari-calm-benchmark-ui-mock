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

test('keeps participant results focused on personal records', () => {
  assert.match(html, /if \(!researcherMode\) return '';/);
  assert.match(html, /<details class="calm-participant-analysis-disclosure">/);
  assert.match(html, /\$\{researcherMode \? `<header class="calm-results-dashboard-header">/);
});

test('supports complete onboarding keyboard navigation', () => {
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /querySelectorAll\('button:not\(\[hidden\]\):not\(\[disabled\]\)'\)/);
  assert.match(app, /event\.shiftKey/);
});

test('uses readable secondary text and avoids layout-driven map animation', () => {
  assert.match(css, /--ari-faint: rgba\(33, 26, 42, 0\.68\)/);
  assert.doesNotMatch(css, /\.calm-pp-map\s*\{[^}]*transition:\s*height/s);
  assert.match(css, /\.ari-choice-grid label\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.ari-onboarding__close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
});
