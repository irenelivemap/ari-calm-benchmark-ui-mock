(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriRouteOverlap = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function coordinateKey(point, precision) {
    return `${Number(point[0]).toFixed(precision)},${Number(point[1]).toFixed(precision)}`;
  }

  function describeSegment(start, end, precision) {
    const startKey = coordinateKey(start, precision);
    const endKey = coordinateKey(end, precision);
    const forward = startKey <= endKey;
    return {
      key: forward ? `${startKey}|${endKey}` : `${endKey}|${startKey}`,
      direction: forward ? 1 : -1
    };
  }

  function metersPerLongitudeDegree(latitude) {
    return 111320 * Math.max(0.01, Math.cos(Number(latitude) * Math.PI / 180));
  }

  function projectAround(point, origin) {
    return {
      x: (Number(point[1]) - Number(origin[1])) * metersPerLongitudeDegree(origin[0]),
      y: (Number(point[0]) - Number(origin[0])) * 110540
    };
  }

  function nearestPointOnSegment(point, start, end) {
    const pointXY = projectAround(point, point);
    const startXY = projectAround(start, point);
    const endXY = projectAround(end, point);
    const dx = endXY.x - startXY.x;
    const dy = endXY.y - startXY.y;
    const denominator = dx * dx + dy * dy;
    const t = denominator
      ? Math.max(0, Math.min(1, ((pointXY.x - startXY.x) * dx + (pointXY.y - startXY.y) * dy) / denominator))
      : 0;
    const x = startXY.x + t * dx;
    const y = startXY.y + t * dy;
    return {
      lat: Number(start[0]) + (Number(end[0]) - Number(start[0])) * t,
      lng: Number(start[1]) + (Number(end[1]) - Number(start[1])) * t,
      distanceMeters: Math.hypot(pointXY.x - x, pointXY.y - y),
      segmentProgress: t
    };
  }

  /**
   * Resolve a map point to the nearest point on the supplied route geometry.
   * A route hint can restrict the search when a provider-specific hit area
   * already established which visible route the participant selected.
   */
  function nearestPointOnRoutes(routeGeometries, point, { routeKey = null } = {}) {
    if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) return null;
    const target = [Number(point.lat), Number(point.lng)];
    const routeKeys = routeKey && routeGeometries[routeKey]
      ? [routeKey]
      : Object.keys(routeGeometries);
    let nearest = null;

    routeKeys.forEach(key => {
      const geometry = routeGeometries[key] || [];
      for (let index = 1; index < geometry.length; index += 1) {
        const candidate = nearestPointOnSegment(target, geometry[index - 1], geometry[index]);
        if (!nearest || candidate.distanceMeters < nearest.distanceMeters) {
          nearest = {
            ...candidate,
            routeKey: key,
            segmentIndex: index - 1
          };
        }
      }
    });

    return nearest;
  }

  /**
   * Keep ordinary map selections exactly where the participant clicked.
   * Provider route hit-areas may pass a route hint; only those selections snap
   * to the visible route so overlapping lines retain the correct identity.
   */
  function resolveStreetViewPoint(routeGeometries, point, {
    routeKey = null,
    snapDistanceMeters = 45
  } = {}) {
    if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) return null;
    const selectedPoint = {
      lat: Number(point.lat),
      lng: Number(point.lng),
      routeKey: null,
      distanceMeters: null,
      snapped: false
    };
    if (!routeKey) return selectedPoint;

    const nearest = nearestPointOnRoutes(routeGeometries, point, { routeKey });
    if (!nearest || nearest.distanceMeters > snapDistanceMeters) return selectedPoint;
    return {
      lat: nearest.lat,
      lng: nearest.lng,
      routeKey: nearest.routeKey,
      distanceMeters: nearest.distanceMeters,
      snapped: true
    };
  }

  /**
   * Offset a geographic line by a small number of metres. This lets providers
   * without a screen-space line-offset API show the same shared-route fanout.
   */
  function offsetGeometry(geometry, offsetMeters) {
    if (!offsetMeters || geometry.length < 2) return geometry.map(point => [...point]);

    return geometry.map((point, index) => {
      const previous = geometry[Math.max(0, index - 1)];
      const next = geometry[Math.min(geometry.length - 1, index + 1)];
      const previousXY = projectAround(previous, point);
      const nextXY = projectAround(next, point);
      const dx = nextXY.x - previousXY.x;
      const dy = nextXY.y - previousXY.y;
      const length = Math.hypot(dx, dy) || 1;
      const offsetX = (-dy / length) * offsetMeters;
      const offsetY = (dx / length) * offsetMeters;
      return [
        Number(point[0]) + offsetY / 110540,
        Number(point[1]) + offsetX / metersPerLongitudeDegree(point[0])
      ];
    });
  }

  /**
   * Split routes into runs with a stable screen-space offset only where two or
   * more routes use the exact same street segment. Reversing a geometry also
   * reverses its offset sign, keeping each route on the same physical side.
   */
  function buildFanoutRuns(routeGeometries, {
    routeOrder = Object.keys(routeGeometries),
    spacing = 5,
    precision = 6
  } = {}) {
    const routeKeys = routeOrder.filter(routeKey => routeGeometries[routeKey]?.length > 1);
    const segmentsByRoute = {};
    const routesBySegment = new Map();

    routeKeys.forEach(routeKey => {
      const geometry = routeGeometries[routeKey];
      const segments = [];
      for (let index = 1; index < geometry.length; index += 1) {
        const start = geometry[index - 1];
        const end = geometry[index];
        const descriptor = describeSegment(start, end, precision);
        segments.push({ start, end, ...descriptor });
        if (!routesBySegment.has(descriptor.key)) routesBySegment.set(descriptor.key, new Set());
        routesBySegment.get(descriptor.key).add(routeKey);
      }
      segmentsByRoute[routeKey] = segments;
    });

    const sharedSegmentCount = [...routesBySegment.values()]
      .filter(routeSet => routeSet.size > 1).length;
    const runsByRoute = {};

    routeKeys.forEach(routeKey => {
      const runs = [];
      segmentsByRoute[routeKey].forEach(segment => {
        const sharingRoutes = routeKeys.filter(key => routesBySegment.get(segment.key)?.has(key));
        const sharedCount = sharingRoutes.length;
        const routeIndex = sharingRoutes.indexOf(routeKey);
        const centeredIndex = routeIndex - ((sharedCount - 1) / 2);
        const offset = sharedCount > 1
          ? centeredIndex * spacing * segment.direction
          : 0;
        const previous = runs[runs.length - 1];

        if (previous && previous.offset === offset && previous.sharedCount === sharedCount) {
          previous.geometry.push(segment.end);
        } else {
          runs.push({
            geometry: [segment.start, segment.end],
            offset,
            sharedCount
          });
        }
      });
      runsByRoute[routeKey] = runs;
    });

    return {
      routes: runsByRoute,
      sharedSegmentCount
    };
  }

  return {
    buildFanoutRuns,
    nearestPointOnRoutes,
    resolveStreetViewPoint,
    offsetGeometry
  };
});
