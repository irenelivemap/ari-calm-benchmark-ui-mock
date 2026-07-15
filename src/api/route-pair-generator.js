(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriRoutePairGenerator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_API_BASE = '/api/v1/routing';
  const DEFAULT_STORAGE_KEY = 'ari-benchmark-route-pairs-v1';

  /**
   * Hand-drawn central-Zurich sampling region for random origin/destination
   * pairs, imported from the livemap-routing guided blind benchmark. Points are
   * drawn inside this polygon (not just its bounding box) so endpoints stay on
   * the walkable core and clear of the lake. Ring is [lng, lat], closed.
   */
  const ZURICH_POLYGON = [
    [8.5355835, 47.3585861],
    [8.5075933, 47.3626448],
    [8.4882483, 47.3827599],
    [8.5106748, 47.3997966],
    [8.5299342, 47.3980005],
    [8.5507342, 47.3913948],
    [8.5616051, 47.382586],
    [8.5596363, 47.3690801],
    [8.5620076, 47.3496018],
    [8.5528487, 47.3539511],
    [8.544717, 47.367287],
    [8.5360717, 47.3636924],
    [8.5355835, 47.3585861]
  ];

  /** O/D pairs must be at least this far apart, and no farther (keeps it walkable). */
  const MIN_OD_METERS = 400;
  const MAX_OD_METERS = 3000;

  /** How many random draws to attempt before giving up on a routable pair. The
   *  polygon constraint rejects most draws, so allow plenty of attempts. */
  const MAX_OD_TRIES = 40;

  /** How many facade "cannot route this pair" responses to tolerate per round
   *  before treating the API as unusable for this draw. */
  const MAX_ROUTE_ERRORS = 5;

  const EARTH_M_PER_DEG_LAT = 111320;
  const toRad = degrees => (degrees * Math.PI) / 180;

  /** Axis-aligned bounds of a [lng, lat] ring — the box we draw samples from. */
  function bboxOfPolygon(ring) {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return { minLat, maxLat, minLng, maxLng };
  }

  const ZURICH_BBOX = bboxOfPolygon(ZURICH_POLYGON);

  /** Ray-casting point-in-polygon. point and ring vertices are [lng, lat]. */
  function pointInPolygon(point, ring) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersects =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  /** Equirectangular metric distance between [lng, lat] points — fine at city scale. */
  function metersBetween(a, b) {
    const mPerDegLng = EARTH_M_PER_DEG_LAT * Math.cos(toRad((a[1] + b[1]) / 2));
    const dx = (b[0] - a[0]) * mPerDegLng;
    const dy = (b[1] - a[1]) * EARTH_M_PER_DEG_LAT;
    return Math.hypot(dx, dy);
  }

  /** Uniform random point in a bbox. `rng` is injectable so tests stay deterministic. */
  function randomPointInBbox(bbox, rng = Math.random) {
    return {
      lng: bbox.minLng + rng() * (bbox.maxLng - bbox.minLng),
      lat: bbox.minLat + rng() * (bbox.maxLat - bbox.minLat)
    };
  }

  /**
   * Draw one random O/D candidate inside `bbox`. Returns null when either point
   * falls outside the sampling polygon, or the two points fall outside
   * [min, max] meters — the caller re-draws (and also re-draws when the router
   * cannot connect them). Geometry validity is the router's job, not ours.
   */
  function pickRandomOdCandidate(bbox, rng = Math.random, opts = {}) {
    const min = opts.min ?? MIN_OD_METERS;
    const max = opts.max ?? MAX_OD_METERS;
    const polygon = opts.polygon === undefined ? ZURICH_POLYGON : opts.polygon;
    const origin = randomPointInBbox(bbox, rng);
    const destination = randomPointInBbox(bbox, rng);
    if (
      polygon &&
      (!pointInPolygon([origin.lng, origin.lat], polygon) ||
        !pointInPolygon([destination.lng, destination.lat], polygon))
    ) {
      return null;
    }
    const distance = metersBetween(
      [origin.lng, origin.lat],
      [destination.lng, destination.lat]
    );
    if (distance < min || distance > max) return null;
    return {
      points: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat]
      ],
      origin,
      destination,
      distance
    };
  }

  const round5 = value => Number(value).toFixed(5);

  /** Stable O/D pair id. points = [[lng, lat], [lng, lat]]. */
  function pairIdFromPoints(points) {
    const fmt = point => `${round5(point[1])}-${round5(point[0])}`;
    return `zurich-random-${fmt(points[0])}-to-${fmt(points[1])}`;
  }

  /** GeoJSON [lng, lat] coordinates → benchmark-shell [lat, lng] tuples. */
  function toLatLngTuples(coordinates) {
    return (coordinates || []).map(point => [point[1], point[0]]);
  }

  /**
   * Shape one facade response into the shell's BenchmarkRoutePair. `routeTypes`
   * maps benchmark route keys to facade profiles, e.g.
   * `{ fast: 'foot_fast', calm: 'foot_calm' }`.
   */
  function buildRoutePair(candidate, facadeRoutes, routeTypes) {
    const pairId = pairIdFromPoints(candidate.points);
    const routes = {};
    for (const [routeType, profile] of Object.entries(routeTypes)) {
      const route = (facadeRoutes || []).find(item => item.profile === profile);
      const coordinates = route?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return null;
      }
      routes[routeType] = {
        routeId: `${pairId}-${profile}`,
        source: 'model',
        metadata: {
          profile,
          distanceMeters: route.distanceMeters ?? route.distance ?? null,
          durationSeconds: route.timeMillis != null
            ? Math.round(route.timeMillis / 1000)
            : route.time != null ? Math.round(route.time / 1000) : null,
          resolvedBucket: route.resolvedBucket || null
        },
        geometry: toLatLngTuples(coordinates)
      };
    }

    const firstType = Object.keys(routeTypes)[0];
    const snapped = routes[firstType].geometry;
    return {
      pairId,
      origin: { lat: snapped[0][0], lng: snapped[0][1] },
      destination: {
        lat: snapped[snapped.length - 1][0],
        lng: snapped[snapped.length - 1][1]
      },
      routes
    };
  }

  /**
   * Random route-pair provider against the LiveMap routing facade
   * (`POST {apiBase}/route`), imported from the livemap-routing runtime bench.
   *
   * Behavior:
   * - Draws random O/D candidates in the Zurich sampling polygon and requests
   *   both configured profiles in one facade call.
   * - Persists each generated pair per session so retries and resumed sessions
   *   load the identical pair (the shell verifies `expectedPairId` on resume).
   * - Falls back to `fallbackProvider` (usually the mock fixtures) when the
   *   facade is unreachable, and stops retrying the network for that session.
   */
  function createLivemapRoutePairProvider(options = {}) {
    const apiBase = options.apiBase ?? DEFAULT_API_BASE;
    const routeTypes = options.routeTypes || { fast: 'foot_fast', calm: 'foot_calm' };
    const polygon = options.polygon === undefined ? ZURICH_POLYGON : options.polygon;
    const bbox = options.bbox || (polygon ? bboxOfPolygon(polygon) : ZURICH_BBOX);
    const rng = options.rng || Math.random;
    const maxTries = options.maxTries ?? MAX_OD_TRIES;
    const maxRouteErrors = options.maxRouteErrors ?? MAX_ROUTE_ERRORS;
    const fetchImpl = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    const fallbackProvider = options.fallbackProvider || null;
    const storage = options.storage !== undefined
      ? options.storage
      : typeof localStorage !== 'undefined' ? localStorage : null;
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    const warn = options.onWarning || (message => console.warn(`[ARI route pairs] ${message}`));

    let apiUnavailable = false;

    function readCache(sessionId) {
      if (!storage) return { sessionId, rounds: {} };
      try {
        const stored = JSON.parse(storage.getItem(storageKey) || 'null');
        if (stored && stored.sessionId === sessionId && stored.rounds) return stored;
      } catch (error) {
        warn(`Ignoring unreadable pair cache: ${error.message}`);
      }
      return { sessionId, rounds: {} };
    }

    function writeCache(cache) {
      if (!storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify(cache));
      } catch (error) {
        warn(`Could not persist generated pair: ${error.message}`);
      }
    }

    async function fetchPairFromFacade(points) {
      const response = await fetchImpl(`${apiBase}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points,
          profiles: Object.values(routeTypes),
          details: true
        })
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        const message = data.routeErrors?.[0]?.message || data.message || `HTTP ${response.status}`;
        const error = new Error(message);
        error.routeError = true;
        throw error;
      }
      return data.routes || [];
    }

    async function generatePair() {
      if (!fetchImpl) throw new Error('No fetch implementation available.');
      let routeErrors = 0;
      for (let attempt = 0; attempt < maxTries; attempt++) {
        const candidate = pickRandomOdCandidate(bbox, rng, { polygon });
        if (!candidate) continue;
        let facadeRoutes;
        try {
          facadeRoutes = await fetchPairFromFacade(candidate.points);
        } catch (error) {
          if (!error.routeError) throw error;
          routeErrors += 1;
          if (routeErrors >= maxRouteErrors) {
            throw new Error(`Routing facade rejected ${routeErrors} pairs in a row (${error.message}).`);
          }
          continue;
        }
        const pair = buildRoutePair(candidate, facadeRoutes, routeTypes);
        if (pair) return pair;
        routeErrors += 1;
        if (routeErrors >= maxRouteErrors) {
          throw new Error('Routing facade responses were missing the configured profiles.');
        }
      }
      throw new Error(`No routable pair found in ${maxTries} draws.`);
    }

    async function useFallback({ sessionId, roundIndex }, reason) {
      if (!fallbackProvider) throw reason;
      warn(`Falling back to fixture pairs: ${reason.message}`);
      return fallbackProvider({ sessionId, roundIndex });
    }

    return async function routePairProvider({ sessionId, roundIndex }) {
      const cache = readCache(sessionId);
      const cached = cache.rounds[roundIndex];
      if (cached) return cached;

      if (apiUnavailable) {
        return useFallback({ sessionId, roundIndex }, new Error('Routing API marked unavailable.'));
      }

      let pair;
      try {
        pair = await generatePair();
      } catch (error) {
        apiUnavailable = true;
        return useFallback({ sessionId, roundIndex }, error);
      }
      cache.rounds[roundIndex] = pair;
      writeCache(cache);
      return pair;
    };
  }

  return {
    ZURICH_POLYGON,
    ZURICH_BBOX,
    MIN_OD_METERS,
    MAX_OD_METERS,
    MAX_OD_TRIES,
    DEFAULT_API_BASE,
    DEFAULT_STORAGE_KEY,
    bboxOfPolygon,
    pointInPolygon,
    metersBetween,
    randomPointInBbox,
    pickRandomOdCandidate,
    pairIdFromPoints,
    toLatLngTuples,
    buildRoutePair,
    createLivemapRoutePairProvider
  };
});
