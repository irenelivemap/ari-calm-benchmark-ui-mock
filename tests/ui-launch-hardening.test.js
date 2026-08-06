const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const freshHtml = fs.readFileSync(path.join(root, 'fresh.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles/calm-benchmark.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app/calm-benchmark.js'), 'utf8');
const mapAdapter = fs.readFileSync(path.join(root, 'src/maps/map-adapter.js'), 'utf8');
const design = fs.readFileSync(path.join(root, 'docs/DESIGN.md'), 'utf8');

test('opens the fresh preview through index.html on file and hosted URLs', () => {
  assert.match(freshHtml, /url=\.\/index\.html\?fresh=1/);
  assert.match(freshHtml, /window\.location\.replace\(`\.\/index\.html\?fresh=1/);
  assert.match(freshHtml, /href="\.\/index\.html\?fresh=1"/);
  assert.doesNotMatch(freshHtml, /(?:url=|replace\(`|href=")\.\/\?fresh=1/);
});

test('exposes accessible page landmarks and launch form feedback', () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /class="calm-skip-link"/);
  assert.match(html, /id="participant-name"[^>]*required[^>]*aria-describedby="start-form-error"/);
  assert.match(html, /id="start-form-error"[^>]*aria-live="polite"/);
  assert.match(html, /<main id="community-results"/);
  assert.match(html, /<main id="calm-benchmark-root"/);
  assert.doesNotMatch(html, /participant-consent|calm-consent|calm-privacy-note|I agree to share my name/);
  assert.doesNotMatch(app, /consentVersion|consentedAt|participantConsent/);
  assert.match(html, /<div>About 10 minutes<\/div>/);
  assert.doesNotMatch(html, /About 6 to 8 min/);
});

test('keeps Results unavailable until the first comparison is saved', () => {
  assert.match(html, /data-view="results" aria-disabled="true" aria-label="Results" aria-describedby="results-tab-tooltip"/);
  assert.match(html, /class="calm-tab-lock"/);
  assert.match(html, /id="results-tab-tooltip" role="tooltip">Available after your first comparison\.<\/span>/);
  assert.match(html, /function resultsAreAvailable\(\)/);
  assert.match(html, /resultsTab\.removeAttribute\('aria-disabled'\)/);
  assert.match(html, /resultsTab\.setAttribute\('aria-disabled', 'true'\)/);
  assert.match(html, /if \(view === 'results' && !resultsAreAvailable\(\)\) view = 'testing'/);
  assert.match(html, /answerSink:[\s\S]*?updateResultsAvailability\(\)/);
  assert.match(css, /\.calm-tabs button\[aria-disabled="true"\]:hover \.calm-tab-tooltip/);
  assert.match(css, /\.calm-tabs button\[aria-disabled="true"\]:focus-visible \.calm-tab-tooltip/);
  assert.match(css, /\.calm-tabs button:not\(\[aria-disabled="true"\]\) \.calm-tab-lock\s*\{[^}]*display:\s*none;/s);
});

test('keeps participant records explorable and easy to interpret', () => {
  assert.match(html, /mock-route-diagnostics\.js/);
  assert.match(html, /diagMap\.get\(row\.analysisPairId\)/);
  assert.doesNotMatch(html, /Your sessions/);
  assert.doesNotMatch(html, /class="calm-pp-question">\$\{escapeHtml\(questionCopy\.q1\)\}/);
  assert.match(html, /<span class="calm-team-outcome"[^>]*>\$\{escapeHtml\(outcomeLabel\)\}<\/span>/);
  assert.match(html, /questionCopy\.q1Flag/);
  assert.match(html, /row\.q1BetterRouteNote/);
  assert.match(html, /class="calm-pp-answer__content"/);
  assert.doesNotMatch(html, /querySelectorAll\('\.calm-pp-card__header\[aria-expanded="true"\]'/);
  assert.match(css, /\.calm-pp-route-table tbody tr\.is-selected th::before\s*\{[^}]*content:\s*'✓'/s);
  assert.doesNotMatch(css, /\.calm-pp-card__header\[aria-expanded="true"\] \.calm-team-outcome\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /\.calm-pp-answer\s*\{[^}]*grid-template-columns:\s*minmax\(210px, 0\.38fr\) minmax\(0, 0\.62fr\);/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.calm-pp-answer\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
});

test('reveals, autosaves, restores, and displays the optional better-route note', () => {
  assert.match(app, /name="q1BetterRouteNote" maxlength="500"/);
  assert.match(app, /name="q1BetterRouteNote"[^>]*aria-label="\$\{escapeHtml\(benchmark\.q1Flag\.notePrompt/);
  assert.doesNotMatch(app, /<label for="ari-q1-better-route-note-input">/);
  assert.match(app, /data-q1-better-route-note hidden/);
  assert.match(app, /q1BetterRouteNoteWrap\.hidden = !knowsBetter/);
  assert.match(app, /\n\s*q1BetterRouteNote,/);
  assert.match(app, /els\.q1BetterRouteNote\.value = answer\.q1BetterRouteNote \|\| ''/);
  assert.match(app, /els\.q1BetterRouteNote\?\.addEventListener\('input'/);
  assert.match(css, /\.ari-q1-better-route-note textarea\s*\{[^}]*min-height:\s*72px/s);
});

test('reveals the Fast-alternative note only for the three positive Q3 answers', () => {
  assert.equal((html.match(/noteMode: 'values'/g) || []).length, 3);
  assert.equal((html.match(/noteValues: \['a_lot', 'somewhat', 'a_little'\]/g) || []).length, 3);
  assert.equal((html.match(/When might you take the Fast route shown instead\? \(Optional\)/g) || []).length >= 3, true);
  assert.match(app, /q3Variant\.noteMode === 'values'/);
  assert.match(app, /selectedQ3Values\.some\(value => q3Variant\.noteValues\.includes\(value\)\)/);
  assert.match(app, /q3Note\.setAttribute\('aria-label', variant\.notePrompt/);
  assert.match(app, /q3Note\.placeholder = variant\.notePlaceholder/);
  assert.doesNotMatch(app, /data-q3-note-label/);
  assert.match(html, /questionCopy\.q3Note/);
});

test('keeps the team summary concise', () => {
  assert.match(html, /team member\$\{summary\.participants === 1 \? '' : 's'\}<\/strong> familiar with Zürich completed <strong[^>]*>\$\{summary\.total\} route comparison\$\{summary\.total === 1 \? '' : 's'\}<\/strong> in a blind, side-by-side format/);
  assert.doesNotMatch(html, /marker-lime[^>]*>[^<]*familiar with Zürich/);
  assert.doesNotMatch(html, /marker-lime[^>]*>[^<]*blind, side-by-side/);
  assert.doesNotMatch(html, /familiar with Zürich<\/strong> evaluated <strong>\$\{summary\.routePairs\} origin–destination pair/);
  assert.match(css, /\.calm-results-dashboard-summary\s*\{[^}]*gap:\s*12px;[^}]*width:\s*100%;[^}]*font:\s*var\(--font-detail\);/s);
  assert.match(css, /\.calm-results-dashboard-summary__details\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.25fr\) minmax\(0, 0\.75fr\);/s);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.calm-results-dashboard-summary__details\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
  assert.match(css, /\.calm-results-dashboard-summary__lead\s*\{[^}]*font:\s*var\(--font-body\);/s);
  assert.match(css, /\.calm-results-dashboard-summary > \.calm-results-dashboard-summary__lead\s*\{[^}]*margin-bottom:\s*8px;/s);
});

test('uses participant-focused results copy while preserving profile colors', () => {
  assert.match(html, /You compared pairs of Calm routes without knowing which model created each one\./);
  assert.match(html, /For each pair, you told us whether you preferred Route A, Route B, both routes or neither, or whether you were unsure\./);
  assert.match(html, /Your responses help us understand which approach works better, what people value in a Calm route and which cases need further investigation\./);
  assert.doesNotMatch(html, /You completed <strong class="marker-lime marker-static">\$\{summary\.total\} route comparison/);
  assert.match(html, /class="calm-results-profile-label" data-profile="nature">Nature-focused profile<\/strong>/);
  assert.match(html, /class="calm-results-profile-label" data-profile="quiet">Quiet-focused profile<\/strong>/);
  assert.match(css, /\.calm-results-dashboard-summary \.calm-results-profile-label\[data-profile="nature"\]\s*\{[^}]*color:\s*var\(--ari-route-a\);/s);
  assert.match(css, /\.calm-results-dashboard-summary \.calm-results-profile-label\[data-profile="quiet"\]\s*\{[^}]*color:\s*var\(--ari-route-b\);/s);
});

test('aligns Home and Results typography without enlarging analytical data', () => {
  assert.match(css, /--font-size-page-title:\s*clamp\(40px, 3\.1vw, 42px\);/);
  assert.match(css, /--font-page-title:\s*800 var\(--font-size-page-title\)\/1\.02 var\(--ari-font\);/);
  assert.match(css, /--font-reading:\s*400 var\(--font-size-body\)\/1\.55 var\(--ari-font\);/);
  assert.match(css, /\.calm-hero h1\s*\{[^}]*font:\s*var\(--font-page-title\);[^}]*letter-spacing:\s*-0\.02em;/s);
  assert.match(css, /\.calm-results-dashboard-header h1\s*\{[^}]*font:\s*var\(--font-page-title\);[^}]*letter-spacing:\s*-0\.02em;/s);
  assert.match(css, /\.calm-hero h1,\s*\.calm-results-dashboard-header h1\s*\{[^}]*line-height:\s*1\.08;/s);
  assert.match(html, /<h1>A quick explanation of what you did<\/h1>/);
  assert.match(css, /\.calm-results-dashboard-header--participant > h1,\s*\.calm-route-explorers__head h2,\s*\.calm-participant-results-heading h2\s*\{[^}]*font:\s*var\(--font-heading-md\);/s);
  assert.match(css, /\.calm-results-dashboard-header--participant \.calm-results-dashboard-summary\s*\{[^}]*font:\s*var\(--font-reading\);[^}]*letter-spacing:\s*normal;/s);
  assert.match(css, /\.calm-result-row__copy span\s*\{[^}]*font-size:\s*0\.9em;/s);
  assert.match(css, /\.calm-result-row small\s*\{[^}]*font-size:\s*var\(--font-size-micro\);/s);
});

test('uses one shared content frame and only real Results destinations', () => {
  assert.match(css, /\.calm-results-wrap,\s*\.calm-team-wrap\s*\{[^}]*width:\s*min\(1224px, calc\(100% - 56px\)\);/s);
  assert.match(html, /const researcherMode = !runtimeConfig\.production && urlParams\.get\('researcher'\) === '1';/);
  assert.doesNotMatch(html, /ari-calm-researcher-mode-v1|RESEARCHER_STORAGE/);
  assert.match(html, /function renderCalmResultsSwitcher\(participantCount\) \{\s*if \(!researcherMode\) return '';/s);
  assert.doesNotMatch(html, /data-results-view="overview"/);
  assert.doesNotMatch(html, /calm-results-switcher__soon/);
  assert.match(html, /data-results-view="participants"[^>]*>Participants<\/button>/);
  assert.match(html, /data-results-view="routes"[^>]*>Routes<\/button>/);
  assert.match(css, /\.calm-results-switcher button\s*\{[^}]*font:\s*600 0\.92em\/normal var\(--ari-font\);/s);
  assert.match(css, /\.calm-results-switcher button\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--ari-off-white\);[^}]*color:\s*var\(--ari-ink\);/s);
});

test('places participant-only Route Explorers between the visible introduction and personal results without another tab', () => {
  const introPosition = html.indexOf('You compared pairs of Calm routes without knowing which model created each one.');
  const explorersPosition = html.indexOf('${renderRouteExplorers(participantSummaries, currentParticipantId)}');
  const panelPosition = html.indexOf('<div class="calm-results-dashboard-panel" data-results-panel="${calmResultsView}">');
  assert.ok(introPosition >= 0);
  assert.ok(explorersPosition > introPosition);
  assert.ok(panelPosition > explorersPosition);
  assert.match(html, /function renderRouteExplorers\(participantSummaries, currentParticipantId\) \{\s*if \(researcherMode\) return '';/s);
  assert.match(html, /async function loadRemoteRouteExplorers\(\) \{\s*if \(researcherMode \|\|/s);
  assert.match(html, /<h2 id="route-explorers-title">Route Explorers Leaderboard<\/h2>/);
  assert.doesNotMatch(html, /routes unlock Cosmic Explorer/);
  assert.match(html, /data-results-action="toggle-explorers"/);
  assert.doesNotMatch(html, /data-route-explorer-participant/);
  assert.match(html, /<h2 id="calm-participant-detail-title">Your choices<\/h2>/);
  assert.match(html, /<h3 id="participant-records-title" class="calm-pp-cards-title">\$\{researcherMode \? 'Participant records' : 'Your comparisons'\}<\/h3>/);
  assert.doesNotMatch(html, /class="calm-participant-route-count"/);
  assert.equal((html.match(/<button[^>]+data-results-view=/g) || []).length, 2);
});

test('renders an accessible responsive leaderboard with four earned or locked medals', () => {
  assert.match(html, /role="table" aria-label="Route Explorers leaderboard"/);
  assert.match(html, /role="columnheader">Participant/);
  assert.match(html, /class="calm-route-explorers__name" role="rowheader"/);
  assert.match(html, /MILESTONES\.map\(\(milestone, index\) =>/);
  assert.match(html, /explorer\.earnedMedals} of \$\{MILESTONES\.length} medals earned/);
  assert.match(html, /isCurrentLevel \? ' is-current-level' : ''/);
  assert.match(html, /data-rank-position="\$\{explorer\.rank}"/);
  assert.match(html, /class="calm-route-explorers__rank-trophy"/);
  assert.match(html, /function renderRouteExplorerRank\(rank\) \{\s*if \(rank > 3\) return String\(rank\);/s);
  assert.match(html, /calm-route-explorers__complete-icon/);
  assert.match(html, /marker-lime marker-static/);
  assert.doesNotMatch(html, /<span role="columnheader">Level<\/span>/);
  assert.doesNotMatch(html, /calm-route-explorers__level/);
  assert.match(html, /role="progressbar"[^>]*aria-valuemin="0"[^>]*aria-valuemax="\$\{explorer\.totalRoutes}[^>]*aria-valuenow="\$\{explorer\.routesCompared}/);
  assert.match(html, /style="--route-progress: \$\{progress}%"/);
  assert.match(css, /\.calm-route-explorers__header,\s*\.calm-route-explorers__row\s*\{[^}]*grid-template-columns:\s*48px minmax\(200px, 1fr\) 132px minmax\(210px, 0\.9fr\);/s);
  assert.match(css, /\.calm-route-explorers__progress > span\s*\{[^}]*width:\s*var\(--route-progress\);[^}]*background:\s*var\(--ari-plum\);/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.calm-route-explorers__row\s*\{[^}]*grid-template-areas:\s*"rank name medals"\s*"rank score score";/s);
  assert.match(css, /\.calm-route-explorers:not\(\.is-expanded\) \.calm-route-explorers__row:not\(\.is-mobile-primary\)\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /\.calm-route-explorers__toggle:focus-visible/);
  assert.match(css, /\.calm-route-explorers__header\s*\{[^}]*font:\s*700 var\(--font-size-micro\)\/1\.2 var\(--ari-font\);/s);
  assert.match(css, /\.calm-route-explorers__row\.is-current\s*\{[^}]*border-radius:\s*var\(--ari-radius-data\);/s);
  assert.match(css, /\.calm-route-explorers\s*\{[^}]*border-bottom:\s*1px solid var\(--ari-hairline\);/s);
  assert.doesNotMatch(css, /\.calm-route-explorers\s*\{[^}]*border-top:/s);
  assert.match(css, /\.calm-route-explorers__row \+ \.calm-route-explorers__row\s*\{[^}]*border-top:\s*1px solid var\(--ari-hairline\);/s);
  assert.doesNotMatch(css, /\.calm-participant-analysis\s*\{[^}]*border-top:/s);
  assert.match(css, /--ari-medal-tier-1-top:\s*#ecb98c;/);
  assert.match(css, /\.calm-route-explorer-medal\[data-medal-tier="4"\]\s*\{[^}]*--explorer-medal-top:\s*var\(--ari-medal-tier-4-top\);/s);
  assert.match(css, /\.calm-route-explorer-medal\.is-current-level\s*\{[^}]*filter:\s*saturate\(1\.08\) drop-shadow[^}]*transform:\s*scale\(1\.12\);/s);
  assert.doesNotMatch(css, /\.calm-route-explorer-medal\.is-current-level\s*\{[^}]*outline:/s);
  assert.match(css, /\.calm-route-explorers__rank\.is-top-rank\[data-rank-position="1"\]\s*\{[^}]*--rank-trophy-metal:\s*#f0cc58;[^}]*--rank-trophy-shadow:\s*#8e5e17;/s);
  assert.match(css, /\.calm-route-explorers__rank\.is-top-rank\[data-rank-position="2"\]\s*\{[^}]*--rank-trophy-metal:\s*#d7dce0;/s);
  assert.match(css, /\.calm-route-explorers__rank\.is-top-rank\[data-rank-position="3"\]\s*\{[^}]*--rank-trophy-metal:\s*#c98050;/s);
  assert.match(css, /\.calm-route-explorers__complete-icon\s*\{[^}]*stroke:\s*currentColor;/s);
});

test('documents and enforces the quieter Results surface tier', () => {
  assert.match(css, /--ari-radius-data:\s*16px;/);
  assert.match(css, /\.calm-pp-cards-list\s*\{[^}]*border-radius:\s*var\(--ari-radius-data\);/s);
  assert.match(css, /\.calm-results-eyebrow,\s*\.calm-results-index\s*\{[^}]*color:\s*var\(--ari-faint\);/s);
  assert.match(css, /\.calm-results-action\s*\{[^}]*min-height:\s*52px;[^}]*font:\s*700 0\.92em\/1 var\(--ari-font\);/s);
  assert.match(design, /Home and Results share one page-title role/);
  assert.match(design, /one active Results view, so it does not repeat that state in a second local switcher/);
  assert.match(design, /Use two radius tiers/);
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
  assert.match(css, /\.calm-step-list span\s*\{[^}]*color:\s*var\(--ari-muted\)/s);
  assert.doesNotMatch(css, /\.calm-pp-map\s*\{[^}]*transition:\s*height/s);
  assert.match(css, /\.ari-choice-grid label\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.ari-onboarding__close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
});

test('celebrates comparison ten without inviting the participant to stop', () => {
  assert.match(app, /data-milestone-confetti/);
  assert.match(app, /milestone\.at === 10 && canContinueAfterCurrentRound\(\)/);
  assert.match(app, /MEDAL_UNLOCK_VISIBLE_MS = 3600/);
  assert.match(app, /All comparisons complete\./);
  assert.match(app, /View results →/);
  assert.doesNotMatch(app, /completedRounds % 10/);
  assert.doesNotMatch(app, /End session|Keep comparing|finish now or keep comparing/);
  assert.match(css, /@keyframes ari-milestone-confetti-burst/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.ari-milestone-confetti\s*\{\s*display:\s*none;/);
});

test('celebrates the final comparison across the full viewport', () => {
  assert.match(app, /function showFinalComparisonConfetti\(\)/);
  assert.match(app, /const particleCount = window\.innerWidth < 700 \? 58 : 92/);
  assert.match(app, /setGoalCheckpointVisible\(true\);\s*showFinalComparisonConfetti\(\);/);
  assert.match(app, /classList\.add\('is-final'\)/);
  assert.match(css, /\.ari-milestone-confetti\.is-final \.ari-milestone-confetti__piece/);
  assert.match(css, /@keyframes ari-final-confetti-fall/);
  assert.match(css, /pointer-events:\s*none/);
});

test('shows one save confirmation after a completed comparison', () => {
  assert.match(app, /data-round-complete[^>]*>[\s\S]*?Saved<\/span>/);
  assert.doesNotMatch(app, /data-save-flash|ari-save-flash|flashSaved/);
  assert.doesNotMatch(css, /ari-save-flash/);
});

test('preserves Q3 details in both the current field and the legacy note alias', () => {
  assert.match(app, /const q3Note = form\.get\('q3Note'\) \|\| ''/);
  assert.match(app, /q3NoteKind: q3Note[\s\S]*?'fast_alternative'[\s\S]*?'supporting_detail'/);
  assert.match(app, /note: q3Note/);
});

test('binds Calm sessions, answers, results, and queued writes to one verified route corpus', () => {
  assert.match(html, /CALM_ROUTE_CORPUS_VERSION = calmRouteCorpus\.corpusVersion/);
  assert.match(html, /CALM_ROUTE_CORPUS_FINGERPRINT = calmRouteCorpus\.corpusFingerprint/);
  assert.match(html, /calmRouteDiagnostics\.corpusFingerprint === CALM_ROUTE_CORPUS_FINGERPRINT/);
  assert.match(html, /storageKey: `ari-calm-route-comparison-dataset-\$\{CALM_ROUTE_CORPUS_VERSION/);
  assert.match(html, /storageKey: CHALLENGE_CONFIGS\.calm\.storageKey,[\s\S]*?migrateLegacy: false/);
  assert.match(html, /ari-benchmark-supabase-outbox-\$\{CALM_ROUTE_CORPUS_VERSION\}/);
  assert.match(html, /answer\.corpusVersion === CALM_ROUTE_CORPUS_VERSION/);
  assert.match(app, /v: benchmark\.corpusVersion \? 3 : 2/);
  assert.match(app, /corpusFingerprint: benchmark\.corpusFingerprint/);
  assert.match(app, /Saved answer belongs to a different route corpus/);
});

test('loads Google Maps with origin-scoped referrer authorization', () => {
  assert.match(html, /maps\.googleapis\.com\/maps\/api\/js\?key=.*auth_referrer_policy=origin/);
});

test('recovers from map startup failures instead of leaving a blank screen', () => {
  assert.match(html, /map-loading\.js[^\n]*calm-launch-fixes/);
  assert.match(html, /mapTilerKey:\s*runtimeConfig\.mapTilerKey/);
  assert.match(app, /data-map-status[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(app, /data-action="retry-map"/);
  assert.match(app, /state\.mapAdapter\.retry\(\)/);
  assert.match(mapAdapter, /createMapWithStyleFallback/);
  assert.match(mapAdapter, /state\.provider = 'leaflet'/);
  assert.match(mapAdapter, /waitForLeafletTiles/);
  assert.match(mapAdapter, /notifyMapStatus\('error'/);
  assert.match(css, /\.ari-map-status\s*\{[^}]*width:\s*min\(340px, calc\(100% - 40px\)\)/s);
  assert.match(css, /\.ari-map-status button\s*\{[^}]*min-height:\s*44px/s);
});
