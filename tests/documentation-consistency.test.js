const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const markdownFiles = [
  'AGENTS.md',
  'CONTEXT.md',
  'DESIGN_PRINCIPLES.md',
  'README.md',
  'TODO.md',
  'deploy/README.md',
  'src/maps/README.md',
  'supabase/README.md',
  ...fs.readdirSync(path.join(root, 'docs'))
    .filter(file => file.endsWith('.md'))
    .map(file => `docs/${file}`)
];

const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('keeps one canonical Calm participant link in the README live previews', () => {
  const readme = read('README.md');
  const livePreview = readme.match(/## Live Preview\n([\s\S]*?)\n## /)?.[1] || '';
  const links = livePreview.match(/https:\/\/[^\s)]+/g) || [];
  assert.equal(links.filter(link => !link.includes('game=google')).length, 1);
  assert.match(livePreview, /https:\/\/ari-calm-benchmark\.vercel\.app\//);
  assert.doesNotMatch(livePreview, /game=calm/);
});

test('keeps current interaction behavior in the design documents', () => {
  const design = `${read('DESIGN_PRINCIPLES.md')}\n${read('docs/DESIGN.md')}`;
  assert.doesNotMatch(design, /simultaneous contextual coachmarks/);
  assert.doesNotMatch(design, /Off-route points are rejected/);
  assert.doesNotMatch(design, /press A, B, or C/i);
  assert.match(design, /one opening briefing followed by three numbered steps/);
  assert.match(design, /turns Street View mode off/);
});

test('documents the active corpus and answer fields', () => {
  const contract = read('docs/DATA_CONTRACT.md');
  const schema = read('docs/ANSWER_SCHEMA.md');
  assert.match(contract, /Calm Route Comparison.*calm_quiet.*calm_nature.*fast/);
  assert.match(schema, /q1KnowsBetter: boolean/);
  assert.match(schema, /q1BetterRouteNote: string/);
  assert.match(schema, /q3NoteKind: "fast_alternative" \| "supporting_detail" \| null/);
  assert.match(schema, /goalCheckpointPending: boolean; \/\/ True while the final-completion state is active/);
});

test('all relative Markdown links resolve to repository files', () => {
  const missing = [];
  markdownFiles.forEach(relativePath => {
    const sourceDirectory = path.dirname(path.join(root, relativePath));
    for (const match of read(relativePath).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].trim().replace(/^<|>$/g, '');
      if (!target || target.startsWith('#') || /^[a-z]+:/i.test(target)) continue;
      const fileTarget = decodeURIComponent(target.split('#')[0]);
      if (!fileTarget) continue;
      const resolved = path.resolve(sourceDirectory, fileTarget);
      if (!fs.existsSync(resolved)) missing.push(`${relativePath} -> ${target}`);
    }
  });
  assert.deepEqual(missing, []);
});
