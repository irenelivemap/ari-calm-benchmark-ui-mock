import fs from 'node:fs';
import path from 'node:path';

const sourcePaths = process.argv.slice(2);
if (sourcePaths.length < 1) {
  console.error('Usage: node scripts/build-calm-route-fixtures.mjs <round1.geojson> [<round2.geojson> ...]');
  process.exit(1);
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

const routeDefinitions = [
  { key: 'calm_quiet', featureName: 'Calm Quiet', id: 'calm-quiet' },
  { key: 'calm_nature', featureName: 'Calm Nature', id: 'calm-nature' },
  { key: 'fast', featureName: 'Fast', id: 'fast' }
];

const rounds = sourcePaths.map((sourcePath, roundIndex) => {
  const collection = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const features = Array.isArray(collection.features) ? collection.features : [];
  const fast = features.find(feature => feature.properties?.name === 'Fast');
  if (!fast) throw new Error(`Fast route missing from ${sourcePath}`);

  const routes = Object.fromEntries(routeDefinitions.map(definition => {
    const feature = features.find(candidate => candidate.properties?.name === definition.featureName);
    if (!feature || feature.geometry?.type !== 'LineString') {
      throw new Error(`${definition.featureName} LineString missing from ${sourcePath}`);
    }
    const properties = feature.properties || {};
    const metadata = {
      distanceMeters: properties.distance_m,
      durationSeconds: properties.duration_s,
      ...(definition.key === 'fast' ? {} : { fastDurationSeconds: fast.properties.duration_s }),
      profile: properties.profile
    };
    return [definition.key, {
      routeId: `calm-round-${roundIndex + 1}-${definition.id}`,
      source: definition.key,
      metadata,
      encoded: encodePolyline(feature.geometry.coordinates)
    }];
  }));

  return {
    pairId: `calm-route-comparison-${String(roundIndex + 1).padStart(2, '0')}`,
    scenario: 'Two blinded walking routes with the same start and destination.',
    routes
  };
});

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

const output = `(function (root, factory) {
  const pairs = factory();
  if (typeof module === 'object' && module.exports) module.exports = pairs;
  if (root) root.AriCalmBenchmarkMockRoutePairs = pairs;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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

  const rounds = ${serialize(rounds, 1)};

  return rounds.map(round => {
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
      scenario: round.scenario,
      origin: { lat: originLat, lng: originLng, label: 'Start' },
      destination: { lat: destinationLat, lng: destinationLng, label: 'Destination' },
      routes
    };
  });
});
`;

const outputPath = path.resolve('src/data/mock-route-pairs.js');
fs.writeFileSync(outputPath, output);
console.log(`Wrote ${rounds.length} route comparisons to ${outputPath}`);
