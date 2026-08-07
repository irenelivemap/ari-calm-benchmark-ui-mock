const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Results = require('../src/results/calm-results');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const runtimeAndDocs = [
  'index.html',
  'src/app/calm-benchmark.js',
  'src/results/calm-results.js',
  'README.md',
  'AGENTS.md',
  'CONTEXT.md',
  'TODO.md',
  ...fs.readdirSync(path.join(root, 'docs'))
    .filter(file => file.endsWith('.md'))
    .map(file => `docs/${file}`)
].map(read).join('\n');

const obsoleteQuestionCopy = [
  ['Which route would you choose', 'for this calm walk?'].join(' '),
  ['Is it worth showing both routes as separate options,', 'one Fast and one Calm?'].join(' '),
  ['What made the route option(s)', 'less suitable for a calmer walk?'].join(' '),
  ['What made you choose', 'this route?'].join(' '),
  ['What made the other route', 'less suitable?'].join(' '),
  ['Do you know another Calm route', 'that would work better?'].join(' '),
  ['Anything else', 'you wanted to add?'].join(' ')
];

test('keeps superseded Calm question copy out of runtime and documentation', () => {
  obsoleteQuestionCopy.forEach(copy => assert.equal(runtimeAndDocs.includes(copy), false, copy));
});

test('documents every current conditional Calm question used by participant results', () => {
  const questionnaire = read('docs/QUESTIONNAIRE.md');
  ['route_a', 'route_b', 'both_work_well', 'none_work_well', 'hard_to_judge']
    .map(q1Choice => Results.participantQuestionCopy({ q1Choice }))
    .flatMap(copy => Object.values(copy).filter(Boolean))
    .forEach(copy => assert.equal(questionnaire.includes(copy), true, copy));
});

test('keeps paired reasons aligned and removed reasons out of both questionnaire branches', () => {
  const html = read('index.html');
  const questionnaire = read('docs/QUESTIONNAIRE.md');
  const results = read('src/results/calm-results.js');
  ['More of the route is near water', 'Not enough of the route is near water'].forEach(copy => {
    assert.equal(html.includes(copy), true, copy);
    assert.equal(questionnaire.includes(copy), true, copy);
    assert.equal(results.includes(copy), true, copy);
  });
  [
    'More beautiful streets or surroundings',
    'I know this route or area better',
    'Not enough beautiful or pleasant surroundings',
    'I know another route I would prefer'
  ].forEach(copy => {
    assert.equal(html.includes(copy), false, copy);
    assert.equal(questionnaire.includes(copy), false, copy);
    assert.equal(results.includes(copy), false, copy);
  });
});

test('keeps the conditional better-route prompt aligned', () => {
  const html = read('index.html');
  const app = read('src/app/calm-benchmark.js');
  const questionnaire = read('docs/QUESTIONNAIRE.md');
  const prompt = 'Tell us about the route you have in mind (optional)';
  assert.equal(html.includes(prompt), true);
  assert.equal(app.includes(prompt), true);
  assert.equal(questionnaire.includes(prompt), true);
});

test('keeps the conditional Fast-alternative prompt aligned', () => {
  const html = read('index.html');
  const app = read('src/app/calm-benchmark.js');
  const questionnaire = read('docs/QUESTIONNAIRE.md');
  const prompt = Results.Q3_FAST_ALTERNATIVE_QUESTION;
  assert.equal(prompt, 'When might you take the Fast route shown instead? (Optional)');
  assert.equal(html.includes(prompt), true);
  assert.match(app, /notePrompt/);
  assert.equal(questionnaire.includes(prompt), true);
});

test('keeps the first-comparison Q1 guidance aligned with the questionnaire', () => {
  const html = read('index.html');
  const app = read('src/app/calm-benchmark.js');
  const questionnaire = read('docs/QUESTIONNAIRE.md');
  const guidance = [
    'Each route shows its estimated time, then the extra time versus Fast for the same trip.',
    'If you prefer one route, choose Route A or B.',
    'Choose “Both work well” only if you really have no preference, and “Both work poorly” if neither route feels calm enough.'
  ];
  guidance.forEach(copy => {
    assert.equal(html.includes(copy), true, copy);
    assert.equal(questionnaire.includes(copy), true, copy);
  });
  assert.match(app, /About these choices/);
  assert.match(app, /routeMetricsHelpItems\.map/);
});

test('documents the current value-vs-Fast answer scale', () => {
  const schema = read('docs/ANSWER_SCHEMA.md');
  assert.match(schema, /q3WorthShowing\?: "a_lot" \| "somewhat" \| "a_little" \| "not_at_all" \| "not_sure" \| null/);
  assert.doesNotMatch(schema, /q3WorthShowing\?: "yes"/);
});

test('does not add a redundant You badge to participant names', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<em>You<\/em>|<span>You<\/span>/);
});
