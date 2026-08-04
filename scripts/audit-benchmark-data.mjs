#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { auditBenchmarkData } = require('../src/data/benchmark-audit.js');
const file = process.argv[2];

if (!file) {
  console.error('Usage: npm run audit:data -- <export.json|export.ndjson>');
  process.exit(2);
}

const text = await readFile(file, 'utf8');
let input;
try {
  input = JSON.parse(text);
} catch (_) {
  input = text.split('\n').filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`Invalid JSON on NDJSON line ${index + 1}: ${error.message}`); }
  });
}

const report = auditBenchmarkData(input);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;

