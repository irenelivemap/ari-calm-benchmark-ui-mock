import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CALM_ROUTE_CORPUS,
  CALM_ROUTE_CORPUS_VERSION
} from './calm-route-corpus-manifest.mjs';

const sourceDirectory = process.argv[2] ? path.resolve(process.argv[2]) : null;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!sourceDirectory) {
  console.error('Usage: node scripts/build-calm-route-corpus.mjs <directory-with-paired-v2-exports>');
  process.exit(1);
}

const routeDefinitions = [
  { key: 'calm_quiet', featureName: 'Calm Quiet', id: 'calm-quiet', profile: 'foot_calm' },
  { key: 'calm_nature', featureName: 'Calm Nature', id: 'calm-nature', profile: 'foot_calm_v1' },
  { key: 'fast', featureName: 'Fast', id: 'fast', profile: 'foot_fast' }
];

const diagnosticMetrics = [
  { key: 'tree_canopy', source: 'tree', direction: 'reward', label: 'Tree canopy' },
  { key: 'green_space', source: 'green', direction: 'reward', label: 'Green space' },
  { key: 'proximity_to_water', source: 'water', direction: 'reward', label: 'Proximity to water' },
  { key: 'noise_exposure', source: 'noise', direction: 'penalty', label: 'Noise exposure' },
  { key: 'main_road_exposure', source: 'main_roads', direction: 'penalty', label: 'Main-road exposure' },
  { key: 'accident_risk', source: 'accident', direction: 'penalty', label: 'Accident risk' }
];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read ${filePath}: ${error.message}`);
  }
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function encodePolyline(coordinates, precision = 6) {
  const factor = 10 ** precision;
  let previousLat = 0;
  let previousLng = 0;
  let encoded = '';

  function encodeNumber(value) {
    let current = value < 0 ? ~(value << 1) : value << 1;
    while (current >= 0x20) {
      encoded += String.fromCharCode((0x20 | (current & 0x1f)) + 63);
      current >>= 5;
    }
    encoded += String.fromCharCode(current + 63);
  }

  coordinates.forEach(([lng, lat]) => {
    const nextLat = Math.round(lat * factor);
    const nextLng = Math.round(lng * factor);
    encodeNumber(nextLat - previousLat);
    encodeNumber(nextLng - previousLng);
    previousLat = nextLat;
    previousLng = nextLng;
  });
  return encoded;
}

function validCoordinate(coordinate) {
  return Array.isArray(coordinate)
    && coordinate.length >= 2
    && Number.isFinite(coordinate[0])
    && Number.isFinite(coordinate[1])
    && Math.abs(coordinate[0]) <= 180
    && Math.abs(coordinate[1]) <= 90;
}

function sameCoordinate(left, right) {
  return Math.abs(left[0] - right[0]) <= 1e-7 && Math.abs(left[1] - right[1]) <= 1e-7;
}

function assertRouteFeature(feature, definition, sourcePath) {
  if (!feature || feature.geometry?.type !== 'LineString') {
    throw new Error(`${definition.featureName} LineString missing from ${sourcePath}`);
  }
  if (feature.geometry.coordinates.length < 2 || !feature.geometry.coordinates.every(validCoordinate)) {
    throw new Error(`${definition.featureName} has invalid geometry in ${sourcePath}`);
  }
  const properties = feature.properties || {};
  if (!(Number(properties.distance_m) > 0) || !(Number(properties.duration_s) > 0)) {
    throw new Error(`${definition.featureName} has invalid time or distance in ${sourcePath}`);
  }
  if (properties.profile !== definition.profile) {
    throw new Error(`${definition.featureName} must use ${definition.profile} in ${sourcePath}`);
  }
}

function assertDiagnosticsMatch(diagnostics, features, sourcePath) {
  if (diagnostics?.diagnostics_schema_version !== 2 || !Array.isArray(diagnostics.routes)) {
    throw new Error(`Diagnostics schema v2 routes missing from ${sourcePath}`);
  }
  if (!diagnostics.configured_weights || typeof diagnostics.configured_weights !== 'object') {
    throw new Error(`Configured profile weights missing from ${sourcePath}`);
  }
  ['fast', 'calm_quiet', 'calm_nature'].forEach(profile => {
    const weights = diagnostics.configured_weights[profile];
    if (!weights || Object.values(weights).some(value => !Number.isFinite(Number(value)) || value < 0 || value > 1)) {
      throw new Error(`${profile} has invalid configured weights in ${sourcePath}`);
    }
  });
  routeDefinitions.forEach(definition => {
    const diagnostic = diagnostics.routes.find(route => route.name === definition.featureName);
    const feature = features.get(definition.featureName);
    if (!diagnostic) throw new Error(`${definition.featureName} diagnostics missing from ${sourcePath}`);
    if (!diagnostic.metric_averages || Object.values(diagnostic.metric_averages).some(value => !Number.isFinite(Number(value)))) {
      throw new Error(`${definition.featureName} metric averages are missing or invalid in ${sourcePath}`);
    }
    if (Number(diagnostic.duration_s) !== Number(feature.properties.duration_s)) {
      throw new Error(`${definition.featureName} duration differs between GeoJSON and diagnostics in ${sourcePath}`);
    }
    if (Math.abs(Number(diagnostic.distance_m) - Number(feature.properties.distance_m)) > 0.6) {
      throw new Error(`${definition.featureName} distance differs between GeoJSON and diagnostics in ${sourcePath}`);
    }
  });
}

function serialize(value, depth = 0) {
  const indent = '  '.repeat(depth);
  const nextIndent = '  '.repeat(depth + 1);
  if (Array.isArray(value)) {
    return `[\n${value.map(item => `${nextIndent}${serialize(item, depth + 1)}`).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => {
      const property = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return `${nextIndent}${property}: ${serialize(item, depth + 1)}`;
    });
    return `{\n${entries.join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

let configuredWeightsSignature = null;
let configuredWeights = null;
const sourceDigests = [];

const rounds = CALM_ROUTE_CORPUS.map(entry => {
  const geoJsonPath = path.join(sourceDirectory, entry.geoJsonFile);
  const diagnosticsPath = path.join(sourceDirectory, entry.diagnosticsFile);
  const collection = readJson(geoJsonPath);
  const diagnostics = readJson(diagnosticsPath);
  const features = new Map((collection.features || []).map(feature => [feature.properties?.name, feature]));

  routeDefinitions.forEach(definition => assertRouteFeature(features.get(definition.featureName), definition, geoJsonPath));
  const referenceCoordinates = features.get('Fast').geometry.coordinates;
  routeDefinitions.forEach(definition => {
    const coordinates = features.get(definition.featureName).geometry.coordinates;
    if (!sameCoordinate(coordinates[0], referenceCoordinates[0])
      || !sameCoordinate(coordinates.at(-1), referenceCoordinates.at(-1))) {
      throw new Error(`${definition.featureName} does not share the Fast endpoints in ${geoJsonPath}`);
    }
  });
  assertDiagnosticsMatch(diagnostics, features, diagnosticsPath);

  const weightsSignature = stableJson(diagnostics.configured_weights);
  if (configuredWeightsSignature == null) {
    configuredWeightsSignature = weightsSignature;
    configuredWeights = diagnostics.configured_weights;
  } else if (weightsSignature !== configuredWeightsSignature) {
    throw new Error(`Configured profile weights differ in ${diagnosticsPath}`);
  }

  const relevantSource = {
    sourceRound: entry.sourceRound,
    routes: routeDefinitions.map(definition => ({
      name: definition.featureName,
      geometry: features.get(definition.featureName).geometry.coordinates,
      properties: features.get(definition.featureName).properties,
      diagnostics: diagnostics.routes.find(route => route.name === definition.featureName)
    })),
    configuredWeights: diagnostics.configured_weights
  };
  const sourceDigest = sha256(stableJson(relevantSource));
  sourceDigests.push(sourceDigest);

  const fast = features.get('Fast');
  const routes = Object.fromEntries(routeDefinitions.map(definition => {
    const feature = features.get(definition.featureName);
    const properties = feature.properties || {};
    return [definition.key, {
      routeId: `calm-round-${entry.pairNumber}-${definition.id}`,
      source: definition.key,
      metadata: {
        distanceMeters: properties.distance_m,
        durationSeconds: properties.duration_s,
        ...(definition.key === 'fast' ? {} : { fastDurationSeconds: fast.properties.duration_s }),
        profile: properties.profile
      },
      encoded: encodePolyline(feature.geometry.coordinates)
    }];
  }));

  const diagnosticRoutes = Object.fromEntries(routeDefinitions.map(definition => {
    const diagnostic = diagnostics.routes.find(route => route.name === definition.featureName);
    return [definition.key, diagnostic.metric_averages || {}];
  }));

  return {
    pairId: `calm-route-comparison-${String(entry.pairNumber).padStart(2, '0')}`,
    sourceRound: entry.sourceRound,
    sourceDigest,
    originLabel: entry.originLabel,
    destinationLabel: entry.destinationLabel,
    scenario: 'Two blinded walking routes with the same start and destination.',
    routes,
    diagnosticRoutes
  };
});

const corpusFingerprint = sha256(stableJson({
  version: CALM_ROUTE_CORPUS_VERSION,
  sources: sourceDigests
}));

const routeRounds = rounds.map(({ diagnosticRoutes, originLabel, destinationLabel, ...round }) => round);
const routeOutput = `(function (root, factory) {
  const pairs = factory();
  if (typeof module === 'object' && module.exports) module.exports = pairs;
  if (root) root.AriCalmBenchmarkMockRoutePairs = pairs;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Generated by scripts/build-calm-route-corpus.mjs. Do not edit by hand.
  function decodePolyline(value, precision = 6) {
    const geometry = [];
    const factor = 10 ** precision;
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < value.length) {
      const deltas = [];
      for (let coordinate = 0; coordinate < 2; coordinate += 1) {
        let result = 0;
        let shift = 0;
        let byte;
        do {
          byte = value.charCodeAt(index) - 63;
          index += 1;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        deltas.push((result & 1) ? ~(result >> 1) : result >> 1);
      }
      lat += deltas[0];
      lng += deltas[1];
      geometry.push([lat / factor, lng / factor]);
    }

    return geometry;
  }

  const rounds = ${serialize(routeRounds, 1)};
  const pairs = rounds.map(round => {
    const routes = Object.fromEntries(
      Object.entries(round.routes).map(([routeType, route]) => [
        routeType,
        {
          routeId: route.routeId,
          routeType,
          source: route.source,
          metadata: route.metadata,
          geometry: decodePolyline(route.encoded)
        }
      ])
    );
    const referenceGeometry = routes.calm_quiet.geometry;
    const [originLat, originLng] = referenceGeometry[0];
    const [destinationLat, destinationLng] = referenceGeometry[referenceGeometry.length - 1];
    return {
      pairId: round.pairId,
      sourceRound: round.sourceRound,
      sourceDigest: round.sourceDigest,
      scenario: round.scenario,
      origin: { lat: originLat, lng: originLng, label: 'Start' },
      destination: { lat: destinationLat, lng: destinationLng, label: 'Destination' },
      routes
    };
  });
  pairs.corpusVersion = ${JSON.stringify(CALM_ROUTE_CORPUS_VERSION)};
  pairs.corpusFingerprint = ${JSON.stringify(corpusFingerprint)};
  pairs.sourceRounds = ${JSON.stringify(CALM_ROUTE_CORPUS.map(entry => entry.sourceRound))};
  return pairs;
});
`;

const profileKeys = ['fast', 'calm_nature', 'calm_quiet'];
const diagnosticWeights = Object.fromEntries(diagnosticMetrics.map(metric => [metric.key, {
  ...Object.fromEntries(profileKeys.map(profile => [profile, configuredWeights[profile]?.[metric.source] ?? 0])),
  direction: metric.direction,
  label: metric.label
}]));
const diagnosticPairs = rounds.map(round => ({
  pairId: round.pairId,
  sourceRound: round.sourceRound,
  sourceDigest: round.sourceDigest,
  origin_label: round.originLabel,
  destination_label: round.destinationLabel,
  metric_averages: round.diagnosticRoutes
}));

const diagnosticsOutput = `(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.AriCalmBenchmarkDiagnostics = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Generated by scripts/build-calm-route-corpus.mjs. Do not edit by hand.
  return ${JSON.stringify({
    corpusVersion: CALM_ROUTE_CORPUS_VERSION,
    corpusFingerprint,
    configured_weights: diagnosticWeights,
    pairs: diagnosticPairs
  }, null, 2)};
});
`;

fs.writeFileSync(path.join(repositoryRoot, 'src/data/mock-route-pairs.js'), routeOutput);
fs.writeFileSync(path.join(repositoryRoot, 'src/data/mock-route-diagnostics.js'), diagnosticsOutput);
console.log(`Validated and wrote ${rounds.length} ${CALM_ROUTE_CORPUS_VERSION} route pairs.`);
console.log(`Corpus fingerprint: ${corpusFingerprint}`);
