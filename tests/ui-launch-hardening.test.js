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
  assert.doesNotMatch(html, /participant-consent|calm-consent|calm-privacy-note|I agree to share my name/);
  assert.doesNotMatch(app, /consentVersion|consentedAt|participantConsent/);
});

test('keeps participant records explorable and easy to interpret', () => {
  assert.match(html, /mock-route-diagnostics\.js/);
  assert.match(html, /diagMap\.get\(row\.analysisPairId\)/);
  assert.doesNotMatch(html, /Your sessions/);
  assert.doesNotMatch(html, /class="calm-pp-question">\$\{escapeHtml\(questionCopy\.q1\)\}/);
  assert.match(html, /<span class="calm-team-outcome"[^>]*>\$\{escapeHtml\(outcomeLabel\)\}<\/span>/);
  assert.match(html, /questionCopy\.q1Flag/);
  assert.match(html, /class="calm-pp-answer__content"/);
  assert.doesNotMatch(html, /querySelectorAll\('\.calm-pp-card__header\[aria-expanded="true"\]'/);
  assert.match(css, /\.calm-pp-route-table tbody tr\.is-selected th::before\s*\{[^}]*content:\s*'✓'/s);
  assert.doesNotMatch(css, /\.calm-pp-card__header\[aria-expanded="true"\] \.calm-team-outcome\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /\.calm-pp-answer\s*\{[^}]*grid-template-columns:\s*minmax\(210px, 0\.38fr\) minmax\(0, 0\.62fr\);/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.calm-pp-answer\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
});

test('keeps the team summary concise', () => {
  assert.match(html, /team member\$\{summary\.participants === 1 \? '' : 's'\}<\/strong> familiar with Zürich completed <strong[^>]*>\$\{summary\.total\} route comparison\$\{summary\.total === 1 \? '' : 's'\}<\/strong> in a blind, side-by-side format/);
  assert.doesNotMatch(html, /marker-lime[^>]*>[^<]*familiar with Zürich/);
  assert.doesNotMatch(html, /marker-lime[^>]*>[^<]*blind, side-by-side/);
  assert.doesNotMatch(html, /familiar with Zürich<\/strong> evaluated <strong>\$\{summary\.routePairs\} origin–destination pair/);
  assert.match(css, /\.calm-results-dashboard-summary\s*\{[^}]*gap:\s*12px;[^}]*max-width:\s*72ch;[^}]*font:\s*var\(--font-detail\);/s);
  assert.match(css, /\.calm-results-dashboard-summary__lead\s*\{[^}]*font:\s*var\(--font-body\);/s);
  assert.match(css, /\.calm-results-dashboard-summary > \.calm-results-dashboard-summary__lead\s*\{[^}]*margin-bottom:\s*8px;/s);
});

test('supports complete onboarding keyboard navigation', () => {
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /querySelectorAll\('button:not\(\[hidden\]\):not\(\[disabled\]\)'\)/);
  assert.match(app, /event\.shiftKey/);
  assert.match(app, /data-action="previous-onboarding"/);
  assert.match(app, /showOnboardingStep\(state\.onboardingStep - 1/);
  assert.match(css, /\.ari-onboarding__step-back\s*\{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.ari-onboarding\[data-step="0"\] \.ari-onboarding__scrim > rect\s*\{[^}]*fill:\s*rgba\(8, 9, 9, 0\.16\);/s);
  assert.match(css, /@keyframes ari-onboarding-intro-enter[\s\S]*?transform:\s*translateX\(-50%\);/);
});

test('uses readable secondary text and respects reduced-motion preferences', () => {
  assert.match(css, /--ari-faint: rgba\(33, 26, 42, 0\.68\)/);
  assert.match(css, /\.calm-pp-map\s*\{[^}]*transition:\s*height/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.calm-pp-map\s*\{\s*transition:\s*none;/);
  assert.match(css, /\.ari-choice-grid label\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.ari-onboarding__close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
});

test('loads Google Maps with origin-scoped referrer authorization', () => {
  assert.match(html, /maps\.googleapis\.com\/maps\/api\/js\?key=.*auth_referrer_policy=origin/);
});
