(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriRouteComplexity = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const COMPLEXITY_METHOD = 'geometry-rdp-8m-min-turn-35deg-v1';
  const DEFAULT_SIMPLIFY_TOLERANCE_METERS = 8;
  const DEFAULT_MIN_TURN_DEGREES = 35;
  const EARTH_RADIUS_METERS = 6_371_008.8;

  function radians(value) {
    return Number(value) * Math.PI / 180;
  }

  function degrees(value) {
    return Number(value) * 180 / Math.PI;
  }

  function haversineMeters(a, b) {
    const lat1 = radians(a[1]);
    const lat2 = radians(b[1]);
    const deltaLat = lat2 - lat1;
    const deltaLng = radians(b[0] - a[0]);
    const sinLat = Math.sin(deltaLat / 2);
    const sinLng = Math.sin(deltaLng / 2);
    const chord = sinLat * sinLat
      + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(chord)));
  }

  function projectCoordinates(coordinates) {
    const referenceLat = coordinates.reduce((sum, point) => sum + Number(point[1]), 0)
      / coordinates.length;
    const referenceLng = coordinates.reduce((sum, point) => sum + Number(point[0]), 0)
      / coordinates.length;
    const latScale = Math.PI * EARTH_RADIUS_METERS / 180;
    const lngScale = latScale * Math.cos(radians(referenceLat));

    return coordinates.map(([lng, lat]) => [
      (Number(lng) - referenceLng) * lngScale,
      (Number(lat) - referenceLat) * latScale
    ]);
  }

  function perpendicularDistance(point, start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (dx === 0 && dy === 0) {
      return Math.hypot(point[0] - start[0], point[1] - start[1]);
    }
    const t = Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy)
        / (dx * dx + dy * dy)));
    const nearestX = start[0] + t * dx;
    const nearestY = start[1] + t * dy;
    return Math.hypot(point[0] - nearestX, point[1] - nearestY);
  }

  function simplifyIndexes(points, toleranceMeters) {
    if (points.length <= 2) return points.map((_, index) => index);

    const keep = new Set([0, points.length - 1]);
    const ranges = [[0, points.length - 1]];

    while (ranges.length) {
      const [startIndex, endIndex] = ranges.pop();
      let furthestIndex = -1;
      let furthestDistance = toleranceMeters;

      for (let index = startIndex + 1; index < endIndex; index += 1) {
        const distance = perpendicularDistance(
          points[index],
          points[startIndex],
          points[endIndex]
        );
        if (distance > furthestDistance) {
          furthestDistance = distance;
          furthestIndex = index;
        }
      }

      if (furthestIndex !== -1) {
        keep.add(furthestIndex);
        ranges.push([startIndex, furthestIndex], [furthestIndex, endIndex]);
      }
    }

    return [...keep].sort((a, b) => a - b);
  }

  function signedTurnDegrees(previous, current, next) {
    const incoming = Math.atan2(
      current[1] - previous[1],
      current[0] - previous[0]
    );
    const outgoing = Math.atan2(
      next[1] - current[1],
      next[0] - current[0]
    );
    let delta = degrees(outgoing - incoming);
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }

  function turnLoad(angleDegrees) {
    const magnitude = Math.abs(angleDegrees);
    if (magnitude < 60) return 0.5;
    if (magnitude < 120) return 1;
    return 1.5;
  }

  function rounded(value, precision = 2) {
    const factor = 10 ** precision;
    return Math.round(Number(value) * factor) / factor;
  }

  function calculateRouteComplexity(coordinates, {
    simplifyToleranceMeters = DEFAULT_SIMPLIFY_TOLERANCE_METERS,
    minimumTurnDegrees = DEFAULT_MIN_TURN_DEGREES,
    distanceMeters
  } = {}) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error('Route complexity requires a LineString with at least two coordinates.');
    }

    const projected = projectCoordinates(coordinates);
    const indexes = simplifyIndexes(projected, simplifyToleranceMeters);
    const simplified = indexes.map(index => projected[index]);
    const turns = [];

    for (let index = 1; index < simplified.length - 1; index += 1) {
      const angle = signedTurnDegrees(
        simplified[index - 1],
        simplified[index],
        simplified[index + 1]
      );
      if (Math.abs(angle) >= minimumTurnDegrees) {
        turns.push({ angleDegrees: angle, load: turnLoad(angle) });
      }
    }

    const measuredDistance = coordinates.slice(1).reduce(
      (sum, point, index) => sum + haversineMeters(coordinates[index], point),
      0
    );
    const routeDistance = Number.isFinite(Number(distanceMeters))
      ? Number(distanceMeters)
      : measuredDistance;
    const distanceKm = routeDistance / 1000;
    const decisionLoad = turns.reduce((sum, turn) => sum + turn.load, 0);

    return {
      estimatedTurnCount: turns.length,
      estimatedTurnsPerKm: distanceKm > 0 ? rounded(turns.length / distanceKm) : 0,
      estimatedDecisionLoad: rounded(decisionLoad, 1),
      estimatedDecisionLoadPerKm: distanceKm > 0
        ? rounded(decisionLoad / distanceKm)
        : 0,
      routeComplexityMethod: COMPLEXITY_METHOD
    };
  }

  function calculateLatLngRouteComplexity(latLngCoordinates, options = {}) {
    const geoJsonCoordinates = (latLngCoordinates || []).map(([lat, lng]) => [lng, lat]);
    return calculateRouteComplexity(geoJsonCoordinates, options);
  }

  function enrichRouteMetadata(metadata, latLngCoordinates) {
    const baseMetadata = metadata && typeof metadata === 'object' ? metadata : {};
    if (!Array.isArray(latLngCoordinates) || latLngCoordinates.length < 2) {
      return { ...baseMetadata };
    }
    return {
      ...baseMetadata,
      ...calculateLatLngRouteComplexity(latLngCoordinates, {
        distanceMeters: baseMetadata.distanceMeters
      })
    };
  }

  function enrichRoutePair(pair) {
    if (!pair?.routes || typeof pair.routes !== 'object') return pair;
    return {
      ...pair,
      routes: Object.fromEntries(Object.entries(pair.routes).map(([routeType, route]) => [
        routeType,
        {
          ...route,
          metadata: enrichRouteMetadata(route?.metadata, route?.geometry)
        }
      ]))
    };
  }

  function toGeoJsonProperties(complexity) {
    return {
      estimated_turn_count: complexity.estimatedTurnCount,
      estimated_turns_per_km: complexity.estimatedTurnsPerKm,
      estimated_decision_load: complexity.estimatedDecisionLoad,
      estimated_decision_load_per_km: complexity.estimatedDecisionLoadPerKm,
      route_complexity_method: complexity.routeComplexityMethod
    };
  }

  return {
    COMPLEXITY_METHOD,
    DEFAULT_SIMPLIFY_TOLERANCE_METERS,
    DEFAULT_MIN_TURN_DEGREES,
    haversineMeters,
    calculateRouteComplexity,
    calculateLatLngRouteComplexity,
    enrichRouteMetadata,
    enrichRoutePair,
    toGeoJsonProperties
  };
});
