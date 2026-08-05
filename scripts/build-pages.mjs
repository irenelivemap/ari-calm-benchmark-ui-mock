#!/usr/bin/env node
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEFAULT_OUTPUT = join(ROOT, '_site');
const PUBLIC_ENTRIES = [
  'index.html',
  'fresh.html',
  'demo.html',
  'runtime-config.js',
  'assets',
  'src'
];

function outputPath(args) {
  const outIndex = args.indexOf('--out');
  if (outIndex < 0) return DEFAULT_OUTPUT;
  const supplied = args[outIndex + 1];
  if (!supplied || supplied.startsWith('--')) throw new Error('--out requires a directory.');
  return isAbsolute(supplied) ? resolve(supplied) : resolve(process.cwd(), supplied);
}

async function prepareOutput(output) {
  if (output === ROOT || dirname(output) === output) {
    throw new Error('Refusing to use a repository or filesystem root as the Pages output directory.');
  }

  if (output === DEFAULT_OUTPUT) {
    await rm(output, { recursive: true, force: true });
    await mkdir(output, { recursive: true });
    return;
  }

  await mkdir(output, { recursive: true });
  const existing = await readdir(output);
  if (existing.length) throw new Error('The custom Pages output directory must be empty.');
}

const googleMapsKey = String(process.env.ARI_GOOGLE_MAPS_KEY || '').trim();
if (!googleMapsKey) {
  console.error('ARI_GOOGLE_MAPS_KEY is required to build the participant site with Street View.');
  process.exit(1);
}
const mapTilerKey = String(process.env.ARI_MAPTILER_KEY || '').trim();
if (!mapTilerKey) {
  console.error('ARI_MAPTILER_KEY is required to build the participant site with the production basemap.');
  process.exit(1);
}

const output = outputPath(process.argv.slice(2));
await prepareOutput(output);

for (const entry of PUBLIC_ENTRIES) {
  await cp(join(ROOT, entry), join(output, entry), { recursive: true });
}

const deployedConfigPath = join(output, 'runtime-config.js');
const deployedConfig = await readFile(deployedConfigPath, 'utf8');
const googlePlaceholder = "googleMapsKey: '',";
const mapTilerPlaceholder = "mapTilerKey: '',";
if (!deployedConfig.includes(googlePlaceholder)) {
  throw new Error('runtime-config.js no longer contains the expected Google Maps placeholder.');
}
if (!deployedConfig.includes(mapTilerPlaceholder)) {
  throw new Error('runtime-config.js no longer contains the expected MapTiler placeholder.');
}
await writeFile(
  deployedConfigPath,
  deployedConfig
    .replace(googlePlaceholder, `googleMapsKey: ${JSON.stringify(googleMapsKey)},`)
    .replace(mapTilerPlaceholder, `mapTilerKey: ${JSON.stringify(mapTilerKey)},`)
);
await writeFile(join(output, '.nojekyll'), '');

console.log(`Built static Pages artifact at ${relative(ROOT, output) || '.'}; Street View and MapTiler are configured.`);
