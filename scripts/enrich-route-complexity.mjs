import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import RouteComplexity from '../src/maps/route-complexity.js';

const {
  calculateRouteComplexity,
  toGeoJsonProperties
} = RouteComplexity;

export function enrichFeatureCollection(featureCollection) {
  if (featureCollection?.type !== 'FeatureCollection'
    || !Array.isArray(featureCollection.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection.');
  }

  return {
    ...featureCollection,
    features: featureCollection.features.map((feature, index) => {
      if (feature?.geometry?.type !== 'LineString') {
        throw new Error(`Feature ${index + 1} must contain a LineString geometry.`);
      }
      const complexity = calculateRouteComplexity(feature.geometry.coordinates, {
        distanceMeters: feature.properties?.distance_m
      });
      return {
        ...feature,
        properties: {
          ...(feature.properties || {}),
          ...toGeoJsonProperties(complexity)
        }
      };
    })
  };
}

function enrichFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const enriched = enrichFeatureCollection(parsed);
  fs.writeFileSync(filePath, `${JSON.stringify(enriched, null, 2)}\n`);
  return enriched.features.map(feature => ({
    name: feature.properties?.name || feature.properties?.profile || 'Unnamed route',
    turns: feature.properties?.estimated_turn_count,
    turnsPerKm: feature.properties?.estimated_turns_per_km,
    decisionLoad: feature.properties?.estimated_decision_load,
    decisionLoadPerKm: feature.properties?.estimated_decision_load_per_km
  }));
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const files = process.argv.slice(2).map(file => path.resolve(file));
  if (!files.length) {
    console.error('Usage: node scripts/enrich-route-complexity.mjs <route.geojson> [...]');
    process.exitCode = 1;
  } else {
    for (const file of files) {
      const summary = enrichFile(file);
      console.log(`Updated ${file}`);
      console.table(summary);
    }
  }
}
